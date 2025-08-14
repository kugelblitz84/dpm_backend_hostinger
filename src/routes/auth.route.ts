import express from "express";
import AuthMiddleware from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";
import AuthController from "../controller/auth.controller";

const authMiddleware = new AuthMiddleware();
const authController = new AuthController();

const authRouter = express.Router();

authRouter.get("/", authController.canRegisterAdmin);

// register new admin
authRouter.post(
	"/register",
	strictLimiter,
	authMiddleware.validateAdminRegistration,
	authController.registerAdmin,
);

// login an admin/staff
authRouter.post(
	"/login",
	strictLimiter,
	authMiddleware.validateLogin,
	authController.login,
);

export default authRouter;
