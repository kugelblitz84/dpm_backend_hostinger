import { Request, Response, NextFunction } from "express";
import { apiDocsUrl, apiKey, serverUrlPrefix } from "../config/dotenv.config";
import { responseSender } from "../util";

const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
	// Skip validation for public routes and ALL product review routes
	const publicRoutes = [
		`${serverUrlPrefix}/`,
		`${serverUrlPrefix}/health`,
		apiDocsUrl,
	];

	// Use originalUrl to get the full path before route matching
	const fullPath = req.originalUrl || req.path;

	// Check if the request is for product review routes
	if (fullPath.includes(`${serverUrlPrefix}/product-review`)) {
		
		return next();
	}

	// Check if the request path starts with any other public route
	if (publicRoutes.some((route) => fullPath.startsWith(route))) {
		return next();
	}

	// Get API key from request header (e.g., 'X-API-Key')
	const receivedApiKey = req.headers["x-api-key"];

	if (!receivedApiKey) {
		return responseSender(res, 401, "API key is missing");
	}

	if (receivedApiKey !== apiKey) {
		return responseSender(res, 401, "Invalid API key");
	}

	next(); // Proceed to the next middleware/route handler
};

export default apiKeyMiddleware;
