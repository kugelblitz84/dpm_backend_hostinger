import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";

class StaffMiddleware {
	private schema: {
		name: Joi.StringSchema;
		email: Joi.StringSchema;
		phone: Joi.StringSchema;
		password: Joi.StringSchema;
		role: Joi.StringSchema;
		commissionPercentage: Joi.NumberSchema;
		designCharge: Joi.NumberSchema;
	};

	constructor() {
		this.schema = {
			name: Joi.string().trim().min(2).required().messages({
				"string.base": "name must be a string.",
				"string.empty": "name is required.",
				"string.min": "name must be at least 2 characters long.",
				"any.required": "name is required.",
			}),
			email: Joi.string().trim().email().required().messages({
				"string.base": "email must be a string.",
				"string.email": "invalid email address.",
				"string.empty": "email is required.",
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
				"string.empty": "password is required.",
				"string.min": "password must be at least 8 characters long.",
				"any.required": "password is required.",
			}),
			role: Joi.string()
				.trim()
				.required()
				.valid("agent", "designer")
				.messages({
					"string.base": "role must be a string.",
					"string.empty": "role is required.",
					"string.valid":
						"invalid role. role must be 'agent' or 'designer'.",
					"any.required": "role is required.",
				}),
			commissionPercentage: Joi.number().optional().default(1).messages({
				"number.base": "commissionPercentage must be a number.",
				"number.empty": "commissionPercentage cannot be empty.",
			}),
			designCharge: Joi.number().allow(null).optional().messages({
				"number.base": "designCharge must be a number.",
				"number.empty": "designCharge cannot be empty.",
			}),
		};
	}

	validateStaffRegistration = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const staffSchema = Joi.object(this.schema);

			const validationResult = staffSchema.validate(req.body);

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

	validateStaffLogin = (req: Request, res: Response, next: NextFunction) => {
		try {
			const staffSchema = Joi.object({
				email: this.schema.email,
				password: this.schema.password,
			});

			const validationResult = staffSchema.validate(req.body);

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

	validateStaffUpdate = (req: Request, res: Response, next: NextFunction) => {
		try {
			const staffSchema = Joi.object({
				avatar: Joi.string().trim().optional().allow(null).messages({
					"string.base": "avatar must be a string.",
					"string.empty": "avatar cannot be empty.",
				}),
				name: this.schema.name,
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

			const validationResult = staffSchema.validate(req.body);

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

	validateStaffUpdateProtected = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const staffSchema = Joi.object({
				name: this.schema.name,
				email: this.schema.email,
				phone: this.schema.phone,
				role: this.schema.role,
				commissionPercentage: this.schema.commissionPercentage,
				designCharge: this.schema.designCharge,
			});

			const validationResult = staffSchema.validate(req.body);

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

	validateStaffClearBalance = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const staffSchema = Joi.object({
				staffId: Joi.number().required().messages({
					"number.base": "staffId must be a integer.",
					"number.required": "staffId is required.",
				}),
			});

			const validationResult = staffSchema.validate(req.params);
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

	validateStaffDeletion = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const staffSchema = Joi.object({
				staffId: Joi.number().required().messages({
					"number.base": "staffId must be a integer.",
					"number.required": "staffId is required.",
				}),
			});

			const validationResult = staffSchema.validate(req.params);
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
			const staffFilteringSchema = Joi.object({
				searchTerm: Joi.string().trim().optional().messages({
					"string.base": "search term must be a string.",
					"string.empty": "search term cannot be empty.",
				}),
				searchBy: Joi.string()
					.trim()
					.optional()
					.valid("name", "email", "phone")
					.messages({
						"string.base": "search by must be a string.",
						"any.valid":
							"search by should be 'name', 'email' or 'phone'.",
						"string.empty": "search by cannot be empty.",
					}),
				role: Joi.string()
					.trim()
					.optional()
					.valid("agent", "designer")
					.messages({
						"string.base": "role must be a string.",
						"string.empty": "role is required.",
						"string.valid":
							"Invalid role. role must be 'agent' or 'designer'.",
					}),
				page: Joi.number().optional().default(1).messages({
					"number.base": "page must be a integer.",
				}),
				limit: Joi.number().optional().default(20).messages({
					"number.base": "limit must be a integer.",
				}),
			});

			const validationResult = staffFilteringSchema.validate(req.query);
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

export default StaffMiddleware;
