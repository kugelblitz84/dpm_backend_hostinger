import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";

class JobMiddleware {
	private schema: {
		title: Joi.StringSchema;
		content: Joi.StringSchema;
		jobLocation: Joi.StringSchema;
		applicationUrl: Joi.StringSchema;
		status: Joi.StringSchema;
	};

	constructor() {
		this.schema = {
			title: Joi.string().trim().min(5).required().messages({
				"string.base": "title must be a string.",
				"string.empty": "title is required.",
				"string.min": "title must be at least 5 characters long.",
				"any.required": "title is required.",
			}),
			content: Joi.string().trim().required().messages({
				"string.base": "content must be a string.",
				"string.empty": "content cannot be empty.",
				"any.required": "content is required.",
			}),
			jobLocation: Joi.string().trim().required().messages({
				"string.base": "jobLocation must be a string.",
				"string.empty": "jobLocation cannot be empty.",
				"any.required": "jobLocation is required.",
			}),
			applicationUrl: Joi.string().trim().required().messages({
				"string.base": "applicationUrl must be a string.",
				"string.empty": "applicationUrl cannot be empty.",
				"any.required": "applicationUrl is required.",
			}),
			status: Joi.string()
				.trim()
				.valid("open", "closed")
				.required()
				.messages({
					"string.base": "status must be a string.",
					"string.empty": "status cannot be empty.",
					"any.required": "status is required.",
					"any.only": "status must be either open or closed.",
				}),
		};
	}

	validateJobCreation = (req: Request, res: Response, next: NextFunction) => {
		try {
			const jobSchema = Joi.object(this.schema);

			const validationResult = jobSchema.validate(req.body);

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

	validateJobEdit = (req: Request, res: Response, next: NextFunction) => {
		try {
			const jobSchema = Joi.object({
				jobId: Joi.number().required().messages({
					"number.base": "jobId must be a number.",
					"number.empty": "jobId cannot be empty.",
					"any.required": "jobId is required.",
				}),
				...this.schema,
			});

			const validationResult = jobSchema.validate(req.body);

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
			const jobFilteringSchema = Joi.object({
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

			const validationResult = jobFilteringSchema.validate(req.query);
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

export default JobMiddleware;
