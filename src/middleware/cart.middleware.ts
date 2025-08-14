import Joi from "joi";
import { responseSender } from "../util";
import { Request, Response, NextFunction } from "express";

class CartMiddleware {
	private schema: {
		customerId: Joi.NumberSchema;
		productId: Joi.NumberSchema;
		productVariantId: Joi.NumberSchema;
		quantity: Joi.NumberSchema;
		size: Joi.NumberSchema;
		widthInch: Joi.NumberSchema;
		heightInch: Joi.NumberSchema;
		price: Joi.NumberSchema;
	};
	constructor() {
		this.schema = {
			customerId: Joi.number().required().messages({
				"number.base": "customerId must be a number.",
				"number.empty": "customerId cannot be empty.",
				"number.required": "customerId is required.",
			}),
			productId: Joi.number().required().messages({
				"number.base": "productId must be a number.",
				"number.empty": "productId cannot be empty.",
				"number.required": "productId is required.",
			}),
			productVariantId: Joi.number().required().messages({
				"number.base": "productVariantId must be a number.",
				"number.empty": "productVariantId cannot be empty.",
				"number.required": "productVariantId is required.",
			}),
			quantity: Joi.number().required().messages({
				"number.base": "quantity must be a number.",
				"number.empty": "quantity cannot be empty.",
				"number.required": "quantity is required.",
			}),
			size: Joi.number().optional().allow(null).messages({
				"number.base": "size must be a number.",
				"number.empty": "size cannot be empty.",
			}),
			widthInch: Joi.number().optional().allow(null).messages({
				"number.base": "widthInch must be a number.",
				"number.empty": "widthInch cannot be empty.",
			}),
			heightInch: Joi.number().optional().allow(null).messages({
				"number.base": "heightInch must be a number.",
				"number.empty": "heightInch cannot be empty.",
			}),
			price: Joi.number().required().messages({
				"number.base": "price must be a number.",
				"number.empty": "price cannot be empty.",
				"number.required": "price is required.",
			}),
		};
	}

	validateCartCreation = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const cartSchema = Joi.object(this.schema);

			const validationResult = cartSchema.validate(req.body);

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

	validateCartEdit = (req: Request, res: Response, next: NextFunction) => {
		try {
			const cartSchema = Joi.object(this.schema);

			const validationResult = cartSchema.validate(req.body);

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

	validateCartDeletion = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const cartSchema = Joi.object({
				cartItemId: Joi.number().required().messages({
					"number.base": "cartItemId must be a number.",
					"number.empty": "cartItemId cannot be empty.",
					"number.required": "cartItemId is required.",
				}),
			});

			const validationResult = cartSchema.validate(req.params);

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

export default CartMiddleware;
