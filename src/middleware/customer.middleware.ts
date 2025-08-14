import Joi from "joi";
import { responseSender } from "../util";
import { Request, Response, NextFunction } from "express";

class CustomerMiddleware {
	private schema: {
		name: Joi.StringSchema;
		email: Joi.StringSchema;
		password: Joi.StringSchema;
		phone: Joi.StringSchema;
		billingAddress: Joi.StringSchema;
		shippingAddress: Joi.StringSchema;
		token: Joi.StringSchema;
		otp: Joi.StringSchema;
	};

	constructor() {
		this.schema = {
			name: Joi.string().trim().min(2).required().messages({
				"string.base": "Name must be a string.",
				"string.empty": "Name cannot be empty.",
				"string.min": "Name must be at least 2 characters long.",
				"any.required": "Name is required.",
			}),
			email: Joi.string().trim().email().required().messages({
				"string.base": "Email must be a string.",
				"string.email": "Invalid email address.",
				"string.empty": "Email cannot be empty.",
				"any.required": "Email is required.",
			}),
			password: Joi.string().trim().min(8).required().messages({
				"string.base": "Password must be a string.",
				"string.empty": "Password cannot be empty.",
				"string.min": "Password must be at least 8 characters long.",
				"any.required": "Password is required.",
			}),
			phone: Joi.string()
				.trim()
				.required()
				.pattern(/^01[3-9][0-9]{8}$/)
				.messages({
					"string.pattern.base":
						"Phone number must be a valid Bangladeshi number starting with 01 and 11 digits long.",
				}),
			billingAddress: Joi.string()
				.trim()
				.min(5)
				.allow("")
				.required()
				.messages({
					"string.base": "Billing address must be a string.",
					"string.min":
						"Billing address must be at least 5 characters long.",
					"any.required": "Billing address is required.",
				}),
			shippingAddress: Joi.string()
				.trim()
				.min(5)
				.allow("")
				.required()
				.messages({
					"string.base": "Shipping address must be a string.",
					"string.min":
						"Shipping address must be at least 5 characters long.",
					"any.required": "Shipping address is required.",
				}),
			token: Joi.string().trim().required().messages({
				"string.base": "Token must be a string",
				"string.empty": "Token cannot be empty.",
				"any.required": "Token is required",
			}),
			otp: Joi.string().trim().required().messages({
				"string.base": "OTP must be a string",
				"string.empty": "OTP cannot be empty.",
				"any.required": "OTP is required",
			}),
		};
	}

	validateCustomerRegistration = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const customerSchema = Joi.object({
				name: this.schema.name,
				email: this.schema.email,
				password: this.schema.password,
				phone: this.schema.phone,
			});

			const validationResult = customerSchema.validate(req.body);
			if (validationResult.error) {
				
				return responseSender(res, 400, validationResult.error.message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};

	validateCustomerLogin = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const customerSchema = Joi.object({
				email: this.schema.email,
				password: this.schema.password,
			});

			const validationResult = customerSchema.validate(req.body);
			if (validationResult.error) {
				
				return responseSender(res, 400, validationResult.error.message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};

	validateCustomerUpdate = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const customerSchema = Joi.object({
				name: this.schema.name,
				phone: this.schema.phone,
				billingAddress: this.schema.billingAddress,
				shippingAddress: this.schema.shippingAddress,
				currentPassword: this.schema.password.messages({
					"string.base": "currentPassword must be a string.",
					"any.required": "currentPassword is required.",
					"string.empty": "currentPassword cannot be empty.",
				}),
				newPassword: this.schema.password
					.optional()
					.allow("")
					.messages({
						"string.base": "newPassword must be a string.",
					}),
			});

			const validationResult = customerSchema.validate(req.body);
			if (validationResult.error) {
				
				return responseSender(res, 400, validationResult.error.message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};

	validateCustomerVerificationQuery = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const customerSchema = Joi.object({
				email: this.schema.email,
				token: this.schema.token,
			});
			const validationResult = customerSchema.validate(req.query);

			if (validationResult.error) {
				
				return responseSender(res, 400, validationResult.error.message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};

	validateCustomerResetPasswordRequest = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const customerSchema = Joi.object({
				email: this.schema.email,
			});
			const validationResult = customerSchema.validate(req.body);

			if (validationResult.error) {
				
				return responseSender(res, 400, validationResult.error.message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};

	validateCustomerResetPasswordVerify = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const customerSchema = Joi.object({
				email: this.schema.email,
				otp: this.schema.otp,
			});

			const validationResult = customerSchema.validate(req.body);
			if (validationResult.error) {
				
				return responseSender(res, 400, validationResult.error.message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};

	validateCustomerResetPassword = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const customerSchema = Joi.object({
				email: this.schema.email,
				password: this.schema.password,
			});

			const validationResult = customerSchema.validate(req.body);
			if (validationResult.error) {
				
				return responseSender(res, 400, validationResult.error.message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};

	validateFilteringQueries = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const customerFilteringSchema = Joi.object({
				searchTerm: Joi.string().trim().optional().messages({
					"string.base": "searchTerm must be a string.",
					"string.empty": "searchTerm cannot be empty.",
				}),
				searchBy: Joi.string()
					.trim()
					.optional()
					.valid("name", "email", "phone")
					.messages({
						"string.base": "searchBy must be a string.",
						"any.valid":
							"searchBy should be 'name', 'email' or 'phone'.",
						"string.empty": "searchBy cannot be empty.",
					}),
				verified: Joi.boolean().optional().messages({
					"boolean.base": "verified must be a boolean.",
					"boolean.empty": "verified cannot be empty.",
				}),
				page: Joi.number().optional().default(1).messages({
					"number.base": "page must be a integer.",
				}),
				limit: Joi.number().optional().default(20).messages({
					"number.base": "limit must be a integer.",
				}),
			});

			const validationResult = customerFilteringSchema.validate(
				req.query,
			);
			if (validationResult.error) {
				
				return responseSender(res, 400, validationResult.error.message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default CustomerMiddleware;
