import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";

class AdminMiddleware {
	private schema: {
		name: Joi.StringSchema;
		email: Joi.StringSchema;
		phone: Joi.StringSchema;
		password: Joi.StringSchema;
	};

	constructor() {
		this.schema = {
			name: Joi.string().trim().min(2).required().messages({
				"string.base": "name must be a string.",
				"string.empty": "name cannot be empty.",
				"string.min": "name must be at least 2 characters long.",
				"any.required": "name is required.",
			}),
			email: Joi.string().trim().email().required().messages({
				"string.base": "email must be a string.",
				"string.email": "invalid email address.",
				"string.empty": "email cannot be empty.",
				"any.required": "email is required.",
			}),
			phone: Joi.string()
				.trim()
				.required()
				.pattern(/^01[3-9][0-9]{8}$/)
				.messages({
					"string.pattern.base":
						"phone number must be a valid Bangladeshi number starting with 01 and 11 digits long.",
					"string.empty": "phone number cannot be empty.",
				}),
			password: Joi.string().trim().min(8).required().messages({
				"string.base": "password must be a string.",
				"string.empty": "password cannot be empty.",
				"string.min": "password must be at least 8 characters long.",
				"any.required": "password is required.",
			}),
		};
	}

	validateAdminRegistration = (
		req: Request,
		res: Response,
		next: NextFunction,
	): void => {
		try {
			const adminSchema = Joi.object(this.schema);

			const validationResult = adminSchema.validate(req.body);
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

	validateAdminLogin = (req: Request, res: Response, next: NextFunction) => {
		try {
			const adminSchema = Joi.object({
				email: this.schema.email,
				password: this.schema.password,
			});

			const validationResult = adminSchema.validate(req.body);
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

	validateAdminUpdate = (req: Request, res: Response, next: NextFunction) => {
		try {
			const adminSchema = Joi.object({
				name: this.schema.name,
				currentPassword: this.schema.password.messages({
					"string.base": "Current password must be a string.",
					"any.required": "Current password is required.",
					"string.empty": "Current password cannot be empty.",
				}),
				newPassword: this.schema.password
					.optional()
					.allow("")
					.messages({
						"string.base": "New password must be a string.",
					}),
				phone: this.schema.phone,
				keepPreviousAvatar: Joi.string()
					.trim()
					.optional()
					.valid("true", "false")
					.messages({
						"string.base": "keepPreviousAvatar must be a string.",
						"any.required":
							"keepPreviousAvatar must be either true or false",
					}),
			});

			const validationResult = adminSchema.validate(req.body, {
				allowUnknown: true,
			});

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

export default AdminMiddleware;
