import express from "express";
import AuthMiddleware from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";
import ProductReviewMiddleware from "../middleware/product-review.middleware"; // Correct import
import ProductReviewController from "../controller/product-review.controller";

// Instantiate the middleware and controller classes once
const productReviewMiddleware = new ProductReviewMiddleware(); // This line is correct as it is
const productReviewController = new ProductReviewController();
const authMiddleware = new AuthMiddleware();

const productReviewRouter = express.Router();

// Test route to verify public access is working
productReviewRouter.get("/test-public", (req, res) => {
	res.status(200).json({
		message: "Public route is working!",
		environment: process.env.NODE_ENV,
		timestamp: new Date().toISOString(),
	});
});

// ... (rest of your routes)

productReviewRouter.get(
	"/",
	authMiddleware.authenticate(["admin", "agent"]),
	productReviewMiddleware.validateFilteringQueries, // Use the method here
	productReviewController.getAllReviews,
);

productReviewRouter.post(
	"/create",
	strictLimiter,
	// Documentation: Removed authentication to allow guest users to create reviews
	// authMiddleware.authenticate(["customer"]),
	productReviewMiddleware.validateProductReviewCreation,
	productReviewController.createReview,
);

productReviewRouter.put(
	"/",
	strictLimiter,
	authMiddleware.authenticate(["admin", "agent"]),
	productReviewMiddleware.validateProductReviewStatusUpdate, // Use the method here
	productReviewController.setStatus,
);

export default productReviewRouter;
