import { Op, Sequelize } from "sequelize";
import Payment from "../model/payment.model";
import Order from "../model/order.model";
import Staff from "../model/staff.model";

export type MonthlyTotal = { month: string; total: number };

function formatMonth(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${y}-${m}`;
}

function monthRange(start: Date, end: Date): string[] {
  const months: string[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= last) {
    months.push(formatMonth(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

export default class EarningService {
  // Compute monthly earnings for a single staff based on paid payments.
  // Commission model: commission = payment.amount * (staff.commissionPercentage / 100).
  // Note: Uses the CURRENT commissionPercentage for historical payments, since there is
  // no snapshot at payment-time in the schema.
  async getMonthlyEarningsForStaff(staffId: number) {
    const staff = await Staff.findByPk(staffId);
    if (!staff) return null;

    // Fetch all paid payments for orders handled by this staff
    const payments = await Payment.findAll({
      where: { isPaid: true },
      include: [
        {
          model: Order,
          required: true,
          attributes: ["orderId", "staffId"],
          where: { staffId },
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    // Determine the start month = staff joining month (createdAt) or first payment month if later
  const now = new Date();
  const staffJoined = staff.createdAt ? new Date(staff.createdAt) : now;
  // History must start from staff joining month regardless of first payment time
  const startDate = staffJoined;

    const months = monthRange(startDate, now);
    const map = new Map<string, number>();
    months.forEach((m) => map.set(m, 0));

    const pct = (staff.commissionPercentage || 0) / 100;
    for (const p of payments as any[]) {
      const ym = formatMonth(new Date(p.createdAt));
      const commission = (Number(p.amount) || 0) * pct;
      map.set(ym, (map.get(ym) || 0) + commission);
    }

    const history: MonthlyTotal[] = months.map((m) => ({ month: m, total: Number((map.get(m) || 0).toFixed(2)) }));
    const currentMonth = formatMonth(now);
    const ongoingMonth = Number((map.get(currentMonth) || 0).toFixed(2));
    const allTimeTotal = Number(history.reduce((acc, r) => acc + r.total, 0).toFixed(2));

    return {
      staff: {
        staffId: staff.staffId,
        name: staff.name,
        role: staff.role,
        commissionPercentage: staff.commissionPercentage,
        designCharge: staff.designCharge,
        joinedAt: staff.createdAt,
      },
      ongoingMonth,
      allTimeTotal,
      history,
    };
  }

  // Batch for all staff
  async getMonthlyEarningsForAllStaff() {
    const staffs = await Staff.findAll({ where: { isDeleted: false } });
    const results: any[] = [];
    for (const s of staffs) {
      const r = await this.getMonthlyEarningsForStaff(s.staffId);
      if (r) results.push(r);
    }
    return results;
  }

  // === Designer distribution earnings ===
  // For each month: totalOrders (status != 'order-canceled') are equally divided by number of active designers that month.
  // Each designer's earning for that month = (totalOrders / activeDesigners) * designCharge.
  // Designers active for a month are those with role='designer', isDeleted=false, and createdAt <= end of that month.
  async getDesignerMonthlyDistributionForAll() {
    // Fetch all designers (active only for now; isDeleted=false). We'll still consider createdAt for month eligibility.
    const allDesigners = await Staff.findAll({ where: { role: "designer", isDeleted: false } });
    if (!allDesigners.length) return [];

    // Determine the earliest join date among designers
    let earliest = new Date();
    for (const d of allDesigners) {
      const joined = d.createdAt ? new Date(d.createdAt) : new Date();
      if (joined < earliest) earliest = joined;
    }
    const now = new Date();
    const months = monthRange(new Date(earliest.getFullYear(), earliest.getMonth(), 1), now);

    // Fetch total orders grouped by month across all time (we will map to month range)
    const orderRows = await Order.findAll({
      attributes: [
        [Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), "%Y-%m"), "month"],
        [Sequelize.fn("COUNT", Sequelize.col("orderId")), "count"],
      ],
      where: { status: { [Op.not]: "order-canceled" } },
      group: ["month"],
      order: [["month", "ASC"]],
      raw: true,
    });
    const orderCountMap = new Map<string, number>();
    for (const r of orderRows as any[]) {
      orderCountMap.set(r.month, parseInt(String(r.count), 10) || 0);
    }

    // Precompute active designer count per month
    const designersData = allDesigners.map((d) => ({
      staffId: d.staffId,
      name: d.name,
      designCharge: d.designCharge || 0,
      joinedAt: d.createdAt ? new Date(d.createdAt) : now,
      role: d.role,
    }));

    const activeDesignerCountMap = new Map<string, number>();
    for (const m of months) {
      const [y, mm] = m.split("-").map((x) => parseInt(x, 10));
      const endOfMonth = new Date(y, mm, 0, 23, 59, 59, 999); // last day of month
      let active = 0;
      for (const d of designersData) {
        if (d.joinedAt <= endOfMonth) active += 1;
      }
      activeDesignerCountMap.set(m, active);
    }

    // Build per-designer histories
    const results: any[] = [];
    for (const d of designersData) {
      const dMonths = months.filter((m) => {
        // Include months from join month to now
        const [y, mm] = m.split("-").map((x) => parseInt(x, 10));
        const startOfThisMonth = new Date(y, mm - 1, 1);
        return startOfThisMonth >= new Date(d.joinedAt.getFullYear(), d.joinedAt.getMonth(), 1);
      });

      const history = dMonths.map((m) => {
        const totalOrders = orderCountMap.get(m) || 0;
        const activeCount = activeDesignerCountMap.get(m) || 0;
        const distributed = activeCount > 0 ? totalOrders / activeCount : 0;
        const earning = distributed * (d.designCharge || 0);
        return {
          month: m,
          totalOrders,
          activeDesigners: activeCount,
          distributedOrdersPerDesigner: Number(distributed.toFixed(4)),
          earning: Number(earning.toFixed(2)),
        };
      });

      const ongoingMonth = history.length ? history[history.length - 1].earning : 0;
      const allTimeTotal = Number(history.reduce((acc, r) => acc + r.earning, 0).toFixed(2));

      results.push({
        staff: {
          staffId: d.staffId,
          name: d.name,
          role: d.role,
          designCharge: d.designCharge,
          joinedAt: d.joinedAt,
        },
        ongoingMonth,
        allTimeTotal,
        history,
      });
    }
    return results;
  }

  async getDesignerMonthlyDistributionForStaff(staffId: number) {
    const all = await this.getDesignerMonthlyDistributionForAll();
    return all.find((x: any) => x.staff.staffId === staffId) || null;
  }
}
