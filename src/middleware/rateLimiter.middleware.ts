import rateLimit from "express-rate-limit";

import {
	rateLimitWindow,
	rateLimitMax,
	strictRateLimitWindow,
	strictRateLimitMax,
} from "../config/dotenv.config";

export const apiLimiter = rateLimit({
	windowMs: parseInt(rateLimitWindow) * 60 * 1000, // 15 minutes
	max: parseInt(rateLimitMax), // Limit each IP to 100 requests per `window` (15 minutes)
	message: {
		status: 429,
		error: "Too many requests from this IP, please try again later.",
	},
	headers: true, // Adds rate limit info in headers
});

export const strictLimiter = rateLimit({
	windowMs: parseInt(strictRateLimitWindow) * 60 * 1000, // 1 minute
	max: parseInt(strictRateLimitMax), // Limit each IP to 10 requests per minute
	message: {
		status: 429,
		error: "Too many requests, please slow down.",
	},
	headers: true,
});
