import express from "express";
import CustomerMiddleware from "../middleware/customer.middleware";
import CustomerController from "../controller/customer.controller";
import AuthMiddleware from "../middleware/auth.middleware";
import {
	apiLimiter,
	strictLimiter,
} from "../middleware/rateLimiter.middleware";

const customerMiddleware = new CustomerMiddleware();
const customerController = new CustomerController();
const authMiddleware = new AuthMiddleware();

const customerRouter = express.Router();

// register customer
customerRouter.post(
	"/register",
	strictLimiter,
	customerMiddleware.validateCustomerRegistration,
	customerController.registerCustomer,
);

// verify customer account
// * TODO: Redirect to the home page with a toast message
customerRouter.get(
	"/verify",
	apiLimiter,
	customerMiddleware.validateCustomerVerificationQuery,
	customerController.verifyCustomerAccount,
);

// login customer
customerRouter.post(
	"/login",
	strictLimiter,
	customerMiddleware.validateCustomerLogin,
	customerController.loginCustomer,
);

// password reset request
customerRouter.post(
	"/reset-password-request",
	strictLimiter,
	customerMiddleware.validateCustomerResetPasswordRequest,
	customerController.sendPasswordResetRequest,
);

// reset password
customerRouter.post(
	"/reset-password-verify",
	strictLimiter,
	customerMiddleware.validateCustomerResetPasswordVerify,
	customerController.verifyResetPassword,
);

// update password
customerRouter.post(
	"/reset-password",
	strictLimiter,
	customerMiddleware.validateCustomerResetPassword,
	customerController.resetPassword,
);

customerRouter.put(
	"/",
	strictLimiter,
	authMiddleware.authenticate(["customer"]),
	customerMiddleware.validateCustomerUpdate,
	customerController.updateCustomer,
);

// get all customers
customerRouter.get(
	"/",
	authMiddleware.authenticate(["admin"]),
	customerMiddleware.validateFilteringQueries,
	customerController.getAllCustomers,
);

export default customerRouter;
