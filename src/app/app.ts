import express from "express";
import cors, { CorsOptions } from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "../config/swagger.config";

import { serverUrlPrefix, apiDocsUrl, staticDir } from "../config/dotenv.config";
import { responseSender } from "../util";

import adminRouter from "../routes/admin.route";
import notFoundController from "../controller/notFound.controller";
import errorController from "../controller/error.controller";
import staffRouter from "../routes/staff.route";
import newsletterRouter from "../routes/newsletter.route";
import inqueryRouter from "../routes/inquery.route";
import customerRouter from "../routes/customer.route";
import faqRouter from "../routes/faq.route";
import authRouter from "../routes/auth.route";
import productCategoryRouter from "../routes/product-category.route";
import productRouter from "../routes/product.route";
import productReviewRouter from "../routes/product-review.route"; // Keep this import
import couponRouter from "../routes/coupon.route";
import orderRouter from "../routes/order.route";
import mediaRouter from "../routes/media.route";
import blogRouter from "../routes/blog.route";
import jobRouter from "../routes/job.route";
import clientRouter from "../routes/client.route";
import cartRouter from "../routes/cart.route";
import courierRouter from "../routes/courier.route";
import transactionRouter from "../routes/transaction.route";
import earningRouter from "../routes/earning.route";
import apiKeyMiddleware from "../middleware/apikey.middleware"; // Keep this import
import dashboardRouter from "../routes/dashboard.route";

const app = express();

export const corsOptions: CorsOptions = {
	// Allow all origins; when credentials=true, cors will echo back the request origin
	origin: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	credentials: true,
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
// Handle preflight for all routes
app.options("*", cors(corsOptions));
app.use(compression());
app.use(helmet());

app.use(morgan("dev"));

app.use("/static", (_req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
	res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
	res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
	res.setHeader("Content-Disposition", "inline"); // Ensure correct file handling
	next();
});

app.use("/static", express.static(staticDir));

// Documentation: Place productReviewRouter BEFORE apiKeyMiddleware
// This ensures that the /api/product-review routes, especially /create,
// are processed before the global API key check.
app.use(`${serverUrlPrefix}/product-review`, productReviewRouter);

// Add API key middleware
// Documentation: This middleware will now apply to all routes EXCEPT those mounted before it.
app.use((req, res, next) => {
	apiKeyMiddleware(req, res, next); // Call the actual API key middleware
});

// Swagger UI setup
app.use(apiDocsUrl, swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// ping route to check the api heartbeat
app.get(`${serverUrlPrefix}/`, (req, res) => {
	responseSender(res, 200, "OK");
});

// health check
app.get(`${serverUrlPrefix}/health`, (req, res) => {
	responseSender(res, 200, "API is running.");
});

// auth routes
app.use(`${serverUrlPrefix}/auth`, authRouter);

// dashboard routes
app.use(`${serverUrlPrefix}/dashboard`, dashboardRouter);

// admin routes
app.use(`${serverUrlPrefix}/admin`, adminRouter);

// staff routes
app.use(`${serverUrlPrefix}/staff`, staffRouter);

// newsletter routes
app.use(`${serverUrlPrefix}/newsletter`, newsletterRouter);

// inquery routes
app.use(`${serverUrlPrefix}/inquery`, inqueryRouter);

// customer routes
app.use(`${serverUrlPrefix}/customer`, customerRouter);

// faq routes
app.use(`${serverUrlPrefix}/faq`, faqRouter);

// product category routes
app.use(`${serverUrlPrefix}/product-category`, productCategoryRouter);

// Documentation: The productReviewRouter was moved above the apiKeyMiddleware.
// This line is now commented out as it's mounted earlier.
// app.use(`${serverUrlPrefix}/product-review`, productReviewRouter);

// coupon routes
app.use(`${serverUrlPrefix}/coupon`, couponRouter);

// product routes
app.use(`${serverUrlPrefix}/product`, productRouter);

// order routes
app.use(`${serverUrlPrefix}/order`, orderRouter);

// media routes
app.use(`${serverUrlPrefix}/media`, mediaRouter);

// blog routes
app.use(`${serverUrlPrefix}/blog`, blogRouter);

// job routes
app.use(`${serverUrlPrefix}/job`, jobRouter);

// client routes
app.use(`${serverUrlPrefix}/client`, clientRouter);

// cart routes
app.use(`${serverUrlPrefix}/cart`, cartRouter);

// courier routes
app.use(`${serverUrlPrefix}/courier`, courierRouter);

// transaction routes
app.use(`${serverUrlPrefix}/transaction`, transactionRouter);

// earning routes
app.use(`${serverUrlPrefix}/earning`, earningRouter);

// 404 middleware
app.use(notFoundController);

// global error controller
app.use(errorController);

export default app;
