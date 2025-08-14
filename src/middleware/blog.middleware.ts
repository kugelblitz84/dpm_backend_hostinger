import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";

class BlogMiddleware {
	private schema: {
		title: Joi.StringSchema;
		content: Joi.StringSchema;
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
		};
	}

	validateBlogCreation = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const blogSchema = Joi.object(this.schema);

			const validationResult = blogSchema.validate(req.body);

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

	validateBlogEdit = (req: Request, res: Response, next: NextFunction) => {
		try {
			const blogSchema = Joi.object({
				blogId: Joi.number().required().messages({
					"number.base": "blogId must be a number.",
					"number.empty": "blogId cannot be empty.",
					"any.required": "blogId is required.",
				}),
				...this.schema,
			});

			const validationResult = blogSchema.validate(req.body);

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
			const blogFilteringSchema = Joi.object({
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

			const validationResult = blogFilteringSchema.validate(req.query);
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

export default BlogMiddleware;
