import express from "express";
import AdminController from "../controller/admin.controller";
import AdminMiddleware from "../middleware/admin.middleware";
import AuthMiddleware from "../middleware/auth.middleware";
import ImageUploaderMiddleware from "../middleware/imageUploader.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";

const adminController = new AdminController();
const adminMiddleware = new AdminMiddleware();
const authMiddleware = new AuthMiddleware();
const adminImageUploader = new ImageUploaderMiddleware();

const adminRouter = express.Router();

// upload admin avatar
adminRouter.post(
	"/avatar",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	adminImageUploader.uploader("avatars").single("avatar"),
	adminImageUploader.compressImage,
	adminController.uploadAdminAvatar,
);

// update admin (avatar, name, password, phone)
adminRouter.put(
	"/",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	adminImageUploader.uploader("avatars").single("avatar"),
	adminImageUploader.compressImage,
	adminMiddleware.validateAdminUpdate,
	adminController.updateAdmin,
);

export default adminRouter;
