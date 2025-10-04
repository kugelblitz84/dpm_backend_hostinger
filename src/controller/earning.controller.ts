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

      if (admin?.role === "admin") {
        const data = await this.earningService.getMonthlyEarningsForAllStaff();
        return responseSender(res, 200, "Monthly earnings fetched successfully.", { role: "admin", data });
      }

      if (staff?.staffId) {
        const data = await this.earningService.getMonthlyEarningsForStaff(staff.staffId);
        if (!data) return responseSender(res, 404, "Staff not found.");
        return responseSender(res, 200, "Monthly earnings fetched successfully.", { role: staff.role, data });
      }

      return responseSender(res, 401, "Unauthorized.");
    } catch (err) {
      next(err);
    }
  };
}

export default EarningController;
