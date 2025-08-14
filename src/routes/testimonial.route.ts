import express from "express";
import AuthMiddleware from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";
import TestimonialController from "../controller/testimonial.controller";
import TestimonialMiddleware from "../middleware/testimonial.middleware";

const testimonialController = new TestimonialController();
const testimonialMiddleware = new TestimonialMiddleware();
const authMiddleware = new AuthMiddleware();

const testimonialRouter = express.Router();

testimonialRouter.get("/", testimonialController.getAllTestimonials);

testimonialRouter.post(
	"/",
	strictLimiter,
	testimonialMiddleware.validateTestimonialCreation,
	testimonialController.addTestimonial,
);

testimonialRouter.put(
	"/",
	strictLimiter,
	testimonialMiddleware.validateTestimonialEdit,
	testimonialController.editTestimonial,
);

testimonialRouter.delete(
	"/:testimonialId",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	testimonialController.deleteTestimonial,
);

export default testimonialRouter;
