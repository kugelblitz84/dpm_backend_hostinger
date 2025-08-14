import express from "express";
import NewsletterMiddleware from "../middleware/newsletter.middleware";
import NewsletterController from "../controller/newsletter.controller";
import AuthMiddleware from "../middleware/auth.middleware";
import {
	apiLimiter,
	strictLimiter,
} from "../middleware/rateLimiter.middleware";

const newsletterMiddleware = new NewsletterMiddleware();
const newsletterController = new NewsletterController();
const authMiddleware = new AuthMiddleware();

const newsletterRouter = express.Router();

newsletterRouter.get(
	"/",
	authMiddleware.authenticate(["admin"]),
	newsletterMiddleware.validateFilteringQueries,
	newsletterController.getAllSubscriber,
);

newsletterRouter.post(
	"/subscribe",
	strictLimiter,
	newsletterMiddleware.validateEmailFromBody,
	newsletterController.subscribe,
);

newsletterRouter.get(
	"/verify",
	apiLimiter,
	newsletterMiddleware.validateEmailFromQuery,
	newsletterController.verifyEmail,
);

newsletterRouter.get(
	"/unsubscribe",
	apiLimiter,
	newsletterMiddleware.validateEmailFromQuery,
	newsletterController.unsubscribe,
);

newsletterRouter.delete(
	"/",
	apiLimiter,
	newsletterMiddleware.validateEmailFromBody,
	newsletterController.deleteByEmail,
);

export default newsletterRouter;
