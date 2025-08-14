import Joi from "joi";
import { responseSender } from "../util";
import { Request, Response, NextFunction } from "express";

class FaqMiddleware {
	private schema: {
		faqTitle: Joi.StringSchema;
		faqItems: Joi.ArraySchema;
	};
	private faqItemsSchema: {
		faqItemId?: Joi.NumberSchema;
		faqId?: Joi.NumberSchema;
		question?: Joi.StringSchema;
		answer?: Joi.StringSchema;
	};
	constructor() {
		this.faqItemsSchema = {
			faqItemId: Joi.number().optional().messages({
				"number.base": "faqItemId must be a number.",
			}),
			faqId: Joi.number().optional().messages({
				"number.base": "faqId must be a number.",
			}),
			question: Joi.string().required().messages({
				"string.base": "question must be a string.",
				"string.empty": "question cannot be empty.",
				"any.required": "question is required.",
			}),
			answer: Joi.string().required().messages({
				"string.base": "answer must be a string.",
				"string.empty": "answer cannot be empty.",
				"any.required": "answer is required.",
			}),
		};

		this.schema = {
			faqTitle: Joi.string().trim().min(5).required().messages({
				"string.base": "faqTitle must be a string.",
				"string.empty": "faqTitle cannot be empty.",
				"string.min": "faqTitle must be at least 5 characters long.",
				"any.required": "faqTitle is required.",
			}),
			faqItems: Joi.array()
				.items(Joi.object(this.faqItemsSchema))
				.required()
				.min(1)
				.messages({
					"array.base": "faqItems must be an array.",
					"array.empty": "faqItems cannot be empty.",
					"array.min": "At least one faqItem is required.",
				}),
		};
	}

	validateFaqCreation = (req: Request, res: Response, next: NextFunction) => {
		try {
			const faqSchema = Joi.object(this.schema);

			const validationResult = faqSchema.validate(req.body, {
				abortEarly: false,
			});

			if (validationResult.error) {
				const errors = validationResult.error.details.map((detail) => ({
					field: detail.path.join("."),
					message: detail.message,
				}));

				return responseSender(res, 400, errors[0].message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};

	validateFaqEdit = (req: Request, res: Response, next: NextFunction) => {
		try {
			const faqSchema = Joi.object({
				...this.schema,
				faqId: Joi.number().required().messages({
					"number.base": "faqId must be a number.",
					"any.required": "faqId is required for updating.",
				}),
			});

			const validationResult = faqSchema.validate(req.body);

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
			const faqSchema = Joi.object({
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

			const validationResult = faqSchema.validate(req.query);

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

export default FaqMiddleware;
