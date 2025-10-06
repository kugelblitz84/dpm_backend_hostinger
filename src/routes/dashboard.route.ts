import express from "express";
import AuthMiddleware from "../middleware/auth.middleware";
import DashboardController from "../controller/dashboard.controller";

const authMiddleware = new AuthMiddleware();
const dashboardController = new DashboardController();

const dashboardRouter = express.Router();

dashboardRouter.get(
	"/",
	authMiddleware.authenticate(["admin", "agent", "designer", "offline-agent"]),
	dashboardController.getStats,
);

export default dashboardRouter;
