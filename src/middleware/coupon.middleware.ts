import Joi from "joi";
import { responseSender } from "../util";
import { Request, Response, NextFunction } from "express";

class CouponMiddleware {
	private schema: {
		couponId: Joi.NumberSchema;
		name: Joi.StringSchema;
		code: Joi.StringSchema;
		discountType: Joi.StringSchema<"flat" | "percentage">;
		amount: Joi.NumberSchema;
		minimumAmount: Joi.NumberSchema;
		endDate: Joi.DateSchema;
	};
	constructor() {
		this.schema = {
			couponId: Joi.number().required().messages({
				"number.base": "couponId must be a number.",
				"number.empty": "couponId cannot be empty.",
				"number.required": "couponId is required.",
			}),
			name: Joi.string().trim().required().messages({
				"string.base": "name must be a string.",
				"string.empty": "name cannot be empty.",
				"any.required": "name is required.",
			}),
			code: Joi.string().required().messages({
				"string.base": "code must be a string.",
				"any.required": "code is required.",
			}),
			amount: Joi.number().required().messages({
				"number.base": "amount must be a number.",
				"number.empty": "amount cannot be empty.",
				"number.required": "amount is required.",
			}),
			minimumAmount: Joi.number().required().messages({
				"number.base": "minimumAmount must be a number.",
				"number.empty": "minimumAmount cannot be empty.",
				"number.required": "minimumAmount is required.",
			}),
			discountType: Joi.string()
				.trim()
				.required()
				.valid("flat", "percentage")
				.messages({
					"string.base": "Discount type must be a string.",
					"any.required":
						"Discount type is required. It should be either flat or percentage.",
				}) as Joi.StringSchema<"flat" | "percentage">,
			endDate: Joi.date().required().messages({
				"number.base": "endDate must be a number.",
				"number.empty": "endDate cannot be empty.",
				"number.required": "endDate is required.",
			}),
		};
	}

	validateCouponCreation = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const couponSchema = Joi.object({
				name: this.schema.name,
				code: this.schema.code,
				discountType: this.schema.discountType,
				amount: this.schema.amount,
				minimumAmount: this.schema.minimumAmount,
				endDate: this.schema.endDate,
			});

			const validationResult = couponSchema.validate(req.body);

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

	validateCouponEdit = (req: Request, res: Response, next: NextFunction) => {
		try {
			const couponSchema = Joi.object({
				couponId: this.schema.couponId,
				name: this.schema.name,
				discountType: this.schema.discountType,
				amount: this.schema.amount,
				minimumAmount: this.schema.minimumAmount,
				endDate: this.schema.endDate,
			});

			const validationResult = couponSchema.validate(req.body);

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

	validateCouponDeletion = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const couponSchema = Joi.object({
				couponId: this.schema.couponId,
			});

			const validationResult = couponSchema.validate(req.params);

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

	validateCouponCheck = (req: Request, res: Response, next: NextFunction) => {
		try {
			const couponSchema = Joi.object({
				code: this.schema.code.allow(""),
				couponId: this.schema.couponId.optional(),
				totalPrice: Joi.number().required().messages({
					"number.base": "totalPrice must be a number.",
					"number.empty": "totalPrice cannot be empty.",
					"number.required": "totalPrice is required.",
				}),
			});

			const validationResult = couponSchema.validate(req.body);

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
			const couponScema = Joi.object({
				searchTerm: Joi.string().trim().optional().messages({
					"string.base": "searchTerm must be a string.",
					"string.empty": "searchTerm cannot be empty.",
				}),
				searchBy: Joi.string()
					.trim()
					.optional()
					.valid("name", "code")
					.messages({
						"string.base": "searchBy must be a string.",
						"any.valid": "searchBy should be 'name', 'code'",
						"string.empty": "searchBy cannot be empty.",
					}),
				page: Joi.number().optional().default(1).messages({
					"number.base": "page must be a integer.",
				}),
				limit: Joi.number().optional().default(20).messages({
					"number.base": "limit must be a integer.",
				}),
			});

			const validationResult = couponScema.validate(req.query);

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

export default CouponMiddleware;
