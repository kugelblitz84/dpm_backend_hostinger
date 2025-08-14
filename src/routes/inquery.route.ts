import express from "express";
import AuthMiddleware from "../middleware/auth.middleware";
import InqueryMiddleware from "../middleware/inquery.middleware";
import InqueryController from "../controller/inquery.controller";
import {
	apiLimiter,
	strictLimiter,
} from "../middleware/rateLimiter.middleware";
import ImageUploaderMiddleware from "../middleware/imageUploader.middleware";

const authMiddleware = new AuthMiddleware();
const inqueryMiddleware = new InqueryMiddleware();
const inqueryController = new InqueryController();
const inqueryImageUploader = new ImageUploaderMiddleware();

const inqueryRouter = express.Router();

inqueryRouter.get(
	"/",
	authMiddleware.authenticate(["admin", "agent", "designer"]),
	inqueryMiddleware.validateFilteringQueries,
	inqueryController.getAllInqueries,
);

inqueryRouter.post(
	"/create-inquery",
	strictLimiter,
	inqueryImageUploader.uploader("inqueries").array("designFiles", 5),
	inqueryImageUploader.compressImages,
	inqueryMiddleware.validateInqueryCreation,
	inqueryController.createInquery,
);

inqueryRouter.get(
	"/close",
	apiLimiter,
	authMiddleware.authenticate(["admin", "agent", "designer"]),
	inqueryMiddleware.validateInqueryStatusChange,
	inqueryController.closeInquery,
);

inqueryRouter.get(
	"/open",
	apiLimiter,
	authMiddleware.authenticate(["admin", "agent", "designer"]),
	inqueryMiddleware.validateInqueryStatusChange,
	inqueryController.openInquery,
);

inqueryRouter.delete(
	"/",
	apiLimiter,
	authMiddleware.authenticate(["admin"]),
	inqueryMiddleware.validateInqueryDelete,
	inqueryController.deleteInquery,
);

export default inqueryRouter;
