import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";

class TestimonialMiddleware {
	private schema: {
		title: Joi.StringSchema;
		description: Joi.StringSchema;
	};

	constructor() {
		this.schema = {
			title: Joi.string().trim().min(5).required().messages({
				"string.base": "title must be a string.",
				"string.empty": "title is required.",
				"string.min": "title must be at least 5 characters long.",
				"any.required": "title is required.",
			}),
			description: Joi.string().trim().required().messages({
				"string.base": "description must be a string.",
				"string.empty": "description cannot be empty.",
				"any.required": "description is required.",
			}),
		};
	}

	validateTestimonialCreation = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const testimonialSchema = Joi.object(this.schema);

			const validationResult = testimonialSchema.validate(req.body);

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

	validateTestimonialEdit = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const testimonialSchema = Joi.object({
				testimonialId: Joi.number().required().messages({
					"number.base": "testimonialId must be a number.",
					"number.empty": "testimonialId cannot be empty.",
					"any.required": "testimonialId is required.",
				}),
				...this.schema,
			});

			const validationResult = testimonialSchema.validate(req.body);

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

export default TestimonialMiddleware;
