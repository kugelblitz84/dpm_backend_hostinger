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
}
