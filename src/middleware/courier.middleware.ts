import Joi from "joi";
import { responseSender } from "../util";
import { Request, Response, NextFunction } from "express";

class CourierMiddleware {
	private schema: {
		courierId: Joi.NumberSchema;
		name: Joi.StringSchema;
	};
	constructor() {
		this.schema = {
			courierId: Joi.number().required().messages({
				"number.base": "courierId must be a number.",
				"number.empty": "courierId cannot be empty.",
				"number.required": "courierId is required.",
			}),
			name: Joi.string().trim().required().messages({
				"string.base": "name must be a string.",
				"string.empty": "name cannot be empty.",
				"any.required": "name is required.",
			}),
		};
	}

	validateCourierCreation = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const courierSchema = Joi.object({
				name: this.schema.name,
			});

			const validationResult = courierSchema.validate(req.body);

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

	validateCourierEdit = (req: Request, res: Response, next: NextFunction) => {
		try {
			const courierSchema = Joi.object({
				courierId: this.schema.courierId,
				name: this.schema.name,
			});

			const validationResult = courierSchema.validate(req.body);

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

	validateCourierDeletion = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const courierSchema = Joi.object({
				courierId: this.schema.courierId,
			});

			const validationResult = courierSchema.validate(req.params);

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
			const courierScema = Joi.object({
				searchTerm: Joi.string().trim().optional().messages({
					"string.base": "searchTerm must be a string.",
					"string.empty": "searchTerm cannot be empty.",
				}),
				page: Joi.number().optional().default(1).messages({
					"number.base": "page must be a integer.",
				}),
				limit: Joi.number().optional().default(20).messages({
					"number.base": "limit must be a integer.",
				}),
			});

			const validationResult = courierScema.validate(req.query);

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

export default CourierMiddleware;
