import express from "express";
import FaqController from "../controller/faq.controller";
import FaqMiddleware from "../middleware/faq.middleware";
import AuthMiddleware from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";

const faqController = new FaqController();
const faqMiddleware = new FaqMiddleware();
const authMiddleware = new AuthMiddleware();

const faqRouter = express.Router();

faqRouter.post(
	"/create",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	faqMiddleware.validateFaqCreation,
	faqController.createNewFaq,
);

faqRouter.get(
	"/",
	authMiddleware.authenticate(["admin"]),
	faqMiddleware.validateFilteringQueries,
	faqController.getAllFaq,
);

faqRouter.put(
	"/",
	authMiddleware.authenticate(["admin"]),
	faqMiddleware.validateFaqEdit,
	faqController.updateFaq,
);

export default faqRouter;
