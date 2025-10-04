import express from "express";
import EarningController from "../controller/earning.controller";
import AuthMiddleware from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";

const router = express.Router();
const controller = new EarningController();
const auth = new AuthMiddleware();

// Both admins and staff can access this endpoint. It will return all-staff data for admin,
// and self-only data for staff. We allow any of these roles for authentication.
router.get(
  "/monthly",
  strictLimiter,
  auth.authenticate(["admin", "agent", "designer", "offline-agent"]),
  controller.getMonthlyEarnings,
);

export default router;
