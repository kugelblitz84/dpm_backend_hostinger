import Joi from "joi";
import { responseSender } from "../util";
import { Request, Response, NextFunction } from "express";

class NewsletterMiddleware {
	private schema: {
		email: Joi.StringSchema;
		token: Joi.StringSchema;
	};
	constructor() {
		this.schema = {
			email: Joi.string().trim().email().required().messages({
				"string.base": "email must be a string.",
				"string.email": "invalid email address.",
				"string.empty": "email cannot be empty.",
				"any.required": "email is required.",
			}),
			token: Joi.string().trim().required().messages({
				"string.base": "token must be a string.",
				"string.empty": "token cannot be empty.",
				"any.required": "token is required.",
			}),
		};
	}

	validateEmailFromBody = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const newsletterSchema = Joi.object({ email: this.schema.email });

			const validationResult = newsletterSchema.validate(req.body);

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

	validateEmailFromQuery = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const newsletterSchema = Joi.object(this.schema);
			const validationResult = newsletterSchema.validate(req.query);

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
			const newsletterSchema = Joi.object({
				searchTerm: Joi.string().trim().optional().messages({
					"string.base": "Search term must be a string.",
					"string.empty": "Search term cannot be empty.",
				}),
				Verified: Joi.boolean().optional().messages({
					"boolean.base": "verified must be a boolean.",
				}),
				page: Joi.number().optional().default(1).messages({
					"number.base": "Page must be a integer.",
				}),
				limit: Joi.number().optional().default(20).messages({
					"number.base": "Limit must be a integer.",
				}),
			});

			const validationResult = newsletterSchema.validate(req.query);

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

export default NewsletterMiddleware;
