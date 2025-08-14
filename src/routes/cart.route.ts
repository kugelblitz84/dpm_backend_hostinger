import express from "express";
import AuthMiddleware from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";
import CartMiddleware from "../middleware/cart.middleware";
import CartController from "../controller/cart.controller";

const cartMiddleware = new CartMiddleware();
const cartController = new CartController();
const authMiddleware = new AuthMiddleware();

const cartRouter = express.Router();

cartRouter.get(
	"/:customerId",
	authMiddleware.authenticate(["customer"]),
	cartController.getAllCartItems,
);

cartRouter.post(
	"/add",
	strictLimiter,
	authMiddleware.authenticate(["customer"]),
	cartMiddleware.validateCartCreation,
	cartController.addItemToCart,
);

// cartRouter.put(
// 	"/",
// 	strictLimiter,
// 	couponMiddleware.validateCouponEdit,
// 	couponController.editCoupon,
// );

cartRouter.delete(
	"/:cartItemId",
	authMiddleware.authenticate(["customer"]),
	cartMiddleware.validateCartDeletion,
	cartController.deleteCartItem,
);

export default cartRouter;
