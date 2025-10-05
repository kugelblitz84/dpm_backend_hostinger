import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";
import EarningService from "../service/earning.service";

class EarningController {
  private earningService: EarningService;
  constructor() {
    this.earningService = new EarningService();
  }

  // GET /api/earning/monthly
  // Role logic:
  // - admin: returns earnings for all staff
  // - agent/designer: returns earnings for the authenticated staff
  getMonthlyEarnings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = (req as any).admin;
      const staff = (req as any).staff;

      // Optional query switch: ?mode=designer-distribution to use the designer order distribution logic
      const mode = (req.query.mode as string) || "commission";

      if (admin?.role === "admin") {
        const data =
          mode === "designer-distribution"
            ? await this.earningService.getDesignerMonthlyDistributionForAll()
            : await this.earningService.getMonthlyEarningsForAllStaff();
        return responseSender(res, 200, "Monthly earnings fetched successfully.", { role: "admin", data });
      }

      if (staff?.staffId) {
        if (mode === "designer-distribution") {
          // Designer distribution only applies to designers. For non-designers or brand-new staff,
          // the service may return null. In that case, return a zero/empty dataset instead of 404
          // to keep frontend flows simple for newly created staff.
          const data = await this.earningService.getDesignerMonthlyDistributionForStaff(staff.staffId);
          if (!data) {
            const fallback = {
              staff: {
                staffId: staff.staffId,
                name: staff.name,
                role: staff.role,
                designCharge: staff.designCharge ?? null,
                joinedAt: staff.createdAt ?? null,
              },
              ongoingMonth: 0,
              allTimeTotal: 0,
              history: [] as Array<unknown>,
            };
            return responseSender(res, 200, "Monthly earnings fetched successfully.", {
              role: staff.role,
              data: fallback,
              mode,
              note: "No designer distribution available for this staff. Returning empty dataset.",
            });
          }
          return responseSender(res, 200, "Monthly earnings fetched successfully.", { role: staff.role, data, mode });
        } else {
          const data = await this.earningService.getMonthlyEarningsForStaff(staff.staffId);
          if (!data) return responseSender(res, 404, "Staff not found.");
          return responseSender(res, 200, "Monthly earnings fetched successfully.", { role: staff.role, data, mode });
        }
      }

      return responseSender(res, 401, "Unauthorized.");
    } catch (err) {
      next(err);
    }
  };
}

export default EarningController;
