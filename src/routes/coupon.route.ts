import express from "express";
import AuthMiddleware from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";
import CouponMiddleware from "../middleware/coupon.middleware";
import CouponController from "../controller/coupon.controller";

const couponMiddleware = new CouponMiddleware();
const couponController = new CouponController();
const authMiddleware = new AuthMiddleware();

const couponRouter = express.Router();

couponRouter.get(
	"/",
	authMiddleware.authenticate(["admin", "agent", "designer"]),
	couponMiddleware.validateFilteringQueries,
	couponController.getAllCoupons,
);

couponRouter.post(
	"/check",
	couponMiddleware.validateCouponCheck,
	couponController.checkCoupon,
);

couponRouter.post(
	"/create",
	strictLimiter,
	couponMiddleware.validateCouponCreation,
	couponController.createCoupon,
);

couponRouter.put(
	"/",
	strictLimiter,
	couponMiddleware.validateCouponEdit,
	couponController.editCoupon,
);

couponRouter.delete(
	"/:couponId",
	authMiddleware.authenticate(["admin"]),
	couponMiddleware.validateCouponDeletion,
	couponController.deleteCoupon,
);

export default couponRouter;
