import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";

class ClientMiddleware {
	private schema: {
		type: Joi.StringSchema;
		clientLogos: Joi.ArraySchema;
	};

	constructor() {
		this.schema = {
			type: Joi.string().trim().min(5).required().messages({
				"string.base": "type must be a string.",
				"string.empty": "type is required.",
				"string.min": "type must be at least 5 characters long.",
				"any.required": "type is required.",
			}),
			clientLogos: Joi.array().items(
				Joi.string().trim().required().messages({
					"string.base": "clientLogoUrl must be a string.",
					"string.empty": "clientLogoUrl cannot be empty.",
					"any.required": "clientLogoUrl is required.",
				}),
			),
		};
	}

	validateClientCreation = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const clientSchema = Joi.object(this.schema);

			const validationResult = clientSchema.validate(req.body);

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

	validateClientEdit = (req: Request, res: Response, next: NextFunction) => {
		try {
			const clientSchema = Joi.object({
				clientId: Joi.number().required().messages({
					"number.base": "clientId must be a number.",
					"number.empty": "clientId cannot be empty.",
					"any.required": "clientId is required.",
				}),
				...this.schema,
			});

			const validationResult = clientSchema.validate(req.body);

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
			const clientFilteringSchema = Joi.object({
				searchTerm: Joi.string().trim().optional().messages({
					"string.base": "search term must be a string.",
					"string.empty": "search term cannot be empty.",
				}),
				page: Joi.number().optional().default(1).messages({
					"number.base": "page must be a integer.",
				}),
				limit: Joi.number().optional().default(20).messages({
					"number.base": "limit must be a integer.",
				}),
			});

			const validationResult = clientFilteringSchema.validate(req.query);
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

export default ClientMiddleware;
