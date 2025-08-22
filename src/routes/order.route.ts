// order.route.ts
import express, { Request, Response } from "express";
import OrderController from "../controller/order.controller";
import { strictLimiter } from "../middleware/rateLimiter.middleware";
import OrderMiddleware from "../middleware/order.middleware";
import ImageUploaderMiddleware from "../middleware/imageUploader.middleware";
import AuthMiddleware from "../middleware/auth.middleware";

const orderMiddleware = new OrderMiddleware();
const authMiddleware = new AuthMiddleware();
const orderController = new OrderController();
const orderImageUploader = new ImageUploaderMiddleware();

const orderRouter = express.Router();

orderRouter.get(
	"/",
	// Documentation: Authenticate allows 'admin', 'agent', and 'designer' roles to view all orders.
	// The `req.staff` or `req.admin` object will contain the role, which is then used for specific filtering.
	authMiddleware.authenticate(["admin", "agent", "designer"]),
	orderMiddleware.validateFilteringQueries,
	orderController.getAllOrders,
);

// 🔍 TEMPORARY DEBUG ENDPOINT - Remove after debugging
orderRouter.get(
	"/debug-info",
	authMiddleware.authenticate(["admin", "agent", "designer"]),
	(req: Request, res: Response) => {
		const debugInfo = {
			timestamp: new Date().toISOString(),
			userInfo: {
				role: (req as any).staff?.role || (req as any).admin?.role,
				staffId: (req as any).staff?.staffId,
				isAdmin: Boolean((req as any).admin),
				isStaff: Boolean((req as any).staff),
				email: (req as any).staff?.email || (req as any).admin?.email,
			},
			environment: process.env.NODE_ENV,
			serverStatus: "Debug endpoint working",
			codeVersion: "2025-07-28-review-system-and-commission-update",
		};

		res.json({
			success: true,
			debug: debugInfo,
		});
	},
);

orderRouter.get(
	"/customer/:customerId",
	// Documentation: Restrict access to get orders by customer ID. Only 'admin' and 'agent' roles can perform this action.
	// 'designer' role is excluded as per previous requirements for specific customer views.
	authMiddleware.authenticate(["admin", "agent"]),
	orderMiddleware.validateOrderByCustomer,
	orderController.getOrdersByCustomer,
);

orderRouter.post(
	"/create",
	strictLimiter,
	// Documentation: Allow 'designer' role to create orders, in addition to 'admin' and 'agent'.
	authMiddleware.authenticate(["admin", "agent", "designer"]),
	orderImageUploader.uploader("order-images").array("designFiles", 5),
	orderImageUploader.compressImages,
	orderMiddleware.validateOrderCreation,
	orderController.createOrder,
);

orderRouter.post(
	"/create-request",
	strictLimiter,
	// Documentation: Allow 'designer' role to create order requests, in addition to 'admin' and 'agent'.
	authMiddleware.authenticate(["admin", "agent", "designer", "customer"]),
	orderImageUploader.uploader("order-images").array("designFiles", 5),
	orderImageUploader.compressImages,
	orderMiddleware.validateOrderRequestCreation,
	orderController.createOrderRequest,
);

orderRouter.put(
	"/update-order",
	strictLimiter,
	// Documentation: Allow 'designer' and 'agent' roles to update orders (one-time logic is in controller/service).
	authMiddleware.authenticate(["admin", "agent", "designer"]),
	orderMiddleware.validateOrderUpdate,
	orderController.updateOrder,
);

orderRouter.post(
	"/add-payment",
	strictLimiter,
	// Documentation: Allow 'designer' role to add payments, in addition to 'admin' and 'agent'.
	(req: Request, _res: Response, next) => {
		console.log("[Route:/order/add-payment] Incoming", {
			method: req.method,
			path: req.path,
			contentType: req.headers["content-type"],
			hasAuth: Boolean(req.headers["authorization"]),
			bodyKeys: Object.keys(req.body || {}),
		});
		next();
	},
	authMiddleware.authenticate(["admin", "agent", "designer"]),
	orderMiddleware.validateOrderPaymentCreation,
	orderController.createOrderPayment,
);

orderRouter.post(
	"/payment/success",
	strictLimiter,
	orderController.paymentSuccess,
);

orderRouter.post("/payment/fail", strictLimiter, orderController.paymentFail);

orderRouter.post(
	"/payment/cancel",
	strictLimiter,
	orderController.paymentCancel,
);

orderRouter.delete(
	"/:orderId",
	// Documentation: Order deletion is restricted to 'admin' roles only.
	authMiddleware.authenticate(["admin"]),
	orderMiddleware.validateOrderDeletion,
	orderController.deleteOrder,
);

export default orderRouter;
