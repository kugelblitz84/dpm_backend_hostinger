import express from "express";
import StaffController from "../controller/staff.controller";
import StaffMiddleware from "../middleware/staff.middleware";
import AuthMiddleware from "../middleware/auth.middleware";
import ImageUploaderMiddleware from "../middleware/imageUploader.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";

const staffController = new StaffController();
const staffMiddleware = new StaffMiddleware();
const authMiddleware = new AuthMiddleware();
const staffImageUploader = new ImageUploaderMiddleware();

const staffRouter = express.Router();

// get all staff
staffRouter.get(
	"/",
	// authMiddleware.authenticate(["admin", "customer"]),
	staffMiddleware.validateFilteringQueries,
	staffController.getAllStaff,
);

// register new staff
staffRouter.post(
	"/register",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	staffMiddleware.validateStaffRegistration,
	staffController.registerStaff,
);

// upload staff avatar
staffRouter.post(
	"/avatar",
	strictLimiter,
	authMiddleware.authenticate(["agent", "designer"]),
	staffImageUploader.uploader("avatars").single("avatar"),
	staffImageUploader.compressImage,
	staffController.uploadStaffAvatar,
);

// update staff general information (avatar, name, password, phone)
staffRouter.put(
	"/",
	strictLimiter,
	authMiddleware.authenticate(["agent", "designer"]),
	staffImageUploader.uploader("avatars").single("avatar"),
	staffImageUploader.compressImage,
	staffMiddleware.validateStaffUpdate,
	staffController.updateStaff,
);

// update staff protected information (role, commissionPercentage)
staffRouter.put(
	"/update",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	staffMiddleware.validateStaffUpdateProtected,
	staffController.updateStaffProtected,
);

// update staff protected information (role, commissionPercentage)
staffRouter.get(
	"/clear-balance/:staffId",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	staffMiddleware.validateStaffClearBalance,
	staffController.clearStaffBalance,
);

// delete staff method
staffRouter.delete(
	"/:staffId",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	staffMiddleware.validateStaffDeletion,
	staffController.deleteStaff,
);

export default staffRouter;
