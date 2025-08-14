import Joi from "joi";
import { responseSender } from "../util";
import { Request, Response, NextFunction } from "express";

class ProductCategoryMiddleware {
	private schema: {
		categoryId: Joi.NumberSchema;
		name: Joi.StringSchema;
		parentCategoryId: Joi.NumberSchema;
	};
	constructor() {
		this.schema = {
			categoryId: Joi.number().required().messages({
				"number.base": "categoryId must be a number.",
				"number.empty": "categoryId cannot be empty.",
				"number.required": "categoryId is required.",
			}),
			name: Joi.string().trim().required().messages({
				"string.base": "name must be a string.",
				"string.empty": "name cannot be empty.",
				"any.required": "name is required.",
			}),
			parentCategoryId: Joi.number().optional().messages({
				"number.base": "parentCategoryId must be a number.",
				"number.empty": "parentCategoryId cannot be empty.",
			}),
		};
	}

	validateProductCategoryCreation = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const productCategorySchema = Joi.object({
				name: this.schema.name,
				parentCategoryId: this.schema.parentCategoryId,
			});

			const validationResult = productCategorySchema.validate(req.body);

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

	validateProductCategoryEdit = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const productCategorySchema = Joi.object(this.schema);

			const validationResult = productCategorySchema.validate(req.body);

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

	validateProductCategoryDeletion = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const productCategorySchema = Joi.object({
				categoryId: this.schema.categoryId,
			});

			const validationResult = productCategorySchema.validate(req.params);

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

	validateProductFetchByCategory = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const productCategorySchema = Joi.object({
				categoryId: this.schema.categoryId,
			});

			const validationResult = productCategorySchema.validate(req.params);

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
			const productCategorySchema = Joi.object({
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

			const validationResult = productCategorySchema.validate(req.query);

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

export default ProductCategoryMiddleware;
