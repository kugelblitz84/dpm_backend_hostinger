import express from "express";
import AuthMiddleware from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";
import CourierMiddleware from "../middleware/courier.middleware";
import CourierController from "../controller/courier.controller";

const courierMiddleware = new CourierMiddleware();
const courierController = new CourierController();
const authMiddleware = new AuthMiddleware();

const courierRouter = express.Router();

courierRouter.get(
	"/",
	// authMiddleware.authenticate(["admin", "customer"]),
	courierMiddleware.validateFilteringQueries,
	courierController.getAllCourier,
);

courierRouter.post(
	"/add",
	strictLimiter,
	courierMiddleware.validateCourierCreation,
	courierController.addCourier,
);

courierRouter.put(
	"/",
	strictLimiter,
	courierMiddleware.validateCourierEdit,
	courierController.editCourier,
);

courierRouter.delete(
	"/:courierId",
	authMiddleware.authenticate(["admin"]),
	courierMiddleware.validateCourierDeletion,
	courierController.deleteCourier,
);

export default courierRouter;
