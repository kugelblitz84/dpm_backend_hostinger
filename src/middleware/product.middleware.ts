import Joi from "joi";
import { responseSender } from "../util";
import { Request, Response, NextFunction } from "express";

class ProductMiddleware {
	private schema: {
		name: Joi.StringSchema;
		description: Joi.StringSchema;
		basePrice: Joi.NumberSchema;
		minOrderQuantity: Joi.NumberSchema;
		discountStart: Joi.NumberSchema;
		discountEnd: Joi.NumberSchema;
		discountPercentage: Joi.NumberSchema;
		pricingType: Joi.StringSchema;
		categoryId: Joi.NumberSchema;
		isActive: Joi.BooleanSchema;
		attributes: Joi.ArraySchema;
		tags: Joi.ArraySchema;
		variations: Joi.ArraySchema;
		variants: Joi.ArraySchema;
	};
	private attributesSchema: Joi.ObjectSchema;
	private variationsSchema: Joi.ObjectSchema;
	private variantsSchema: Joi.ObjectSchema;
	constructor() {
		this.attributesSchema = Joi.object({
			property: Joi.string().trim().min(3).required().messages({
				"string.base": "property must be a string.",
				"string.empty": "property cannot be empty.",
				"any.required": "property is required.",
				"string.min": "property must be atleast 3 characters long.",
			}),
			description: Joi.string().trim().min(3).required().messages({
				"string.base": "description must be a string.",
				"string.empty": "description cannot be empty.",
				"any.required": "description is required.",
				"string.min": "description must be atleast 3 characters long.",
			}),
		});

		this.variationsSchema = Joi.object({
			name: Joi.string().required().messages({
				"string.base": "name must be a string.",
				"string.empty": "name cannot be empty.",
				"string.required": "name is required.",
			}),
			unit: Joi.string().required().allow("").messages({
				"string.base": "unit must be a string.",
				"string.required": "unit is required.",
			}),
			variationItems: Joi.array().items(
				Joi.object({
					value: Joi.string().required().messages({
						"string.base": "value must be a string.",
						"string.empty": "value cannot be empty.",
						"string.requried": "value is requried.",
					}),
				}),
			),
		});

		this.variantsSchema = Joi.object({
			additionalPrice: Joi.number().required().messages({
				"number.base": "additionalPrice must be a number.",
				"number.empty": "additionalPrice cannot be empty.",
				"number.required": "additionalPrice is required.",
			}),
			variantDetails: Joi.array().items(
				Joi.object({
					variationName: Joi.string().required().messages({
						"string.base": "variationName must be a string.",
						"string.empty": "variationName cannot be empty.",
						"string.requried": "variationName is requried.",
					}),
					variationItemValue: Joi.string().required().messages({
						"string.base": "variationItemValue must be a string.",
						"string.empty": "variationItemValue cannot be empty.",
						"string.requried": "variationItemValue is requried.",
					}),
				}),
			),
		});

		this.schema = {
			name: Joi.string().trim().min(5).required().messages({
				"string.base": "name must be a string.",
				"string.empty": "name cannot be empty.",
				"any.required": "name is required.",
				"string.min": "name must be atleast 5 characters long.",
			}),
			description: Joi.string().trim().required().messages({
				"string.base": "description must be a string.",
				"string.empty": "description cannot be empty.",
				"any.required": "description is required.",
			}),
			basePrice: Joi.number().required().messages({
				"number.base": "basePrice must be a number.",
				"number.empty": "basePrice cannot be empty.",
				"any.required": "basePrice is required.",
			}),
			minOrderQuantity: Joi.number().required().messages({
				"number.base": "minOrderQuantity must be a number.",
				"number.empty": "minOrderQuantity cannot be empty.",
				"any.required": "minOrderQuantity is required.",
			}),
			discountStart: Joi.number().optional().messages({
				"number.base": "discountStart must be a number.",
				"number.empty": "discountStart cannot be empty.",
			}),
			discountEnd: Joi.number().optional().messages({
				"number.base": "discountEnd must be a number.",
				"number.empty": "discountEnd cannot be empty.",
			}),
			discountPercentage: Joi.number().optional().messages({
				"number.base": "discountPercentage must be a number.",
				"number.empty": "discountPercentage cannot be empty.",
			}),
			pricingType: Joi.string()
				.trim()
				.valid("flat", "square-feet")
				.required()
				.messages({
					"string.base": "pricingType must be a string.",
					"string.empty": "pricingType cannot be empty.",
					"any.required": "pricingType is required.",
					"string.valid":
						"pricingType must be either 'flat' or 'square-feet'.",
				}),
			isActive: Joi.boolean().default(true).optional().messages({
				"number.base": "isActive must be a boolean.",
			}),
			categoryId: Joi.number().optional().allow(null).messages({
				"number.base": "categoryId must be a number.",
			}),
			attributes: Joi.array()
				.items(this.attributesSchema)
				.optional()
				.messages({
					"array.base": "attributes must be an array.",
				}),
			tags: Joi.array().items(Joi.string()),
			variations: Joi.array()
				.items(this.variationsSchema)
				.required()
				.messages({
					"array.base": "variations must be an array.",
					"array.empty": "variations cannot be empty.",
					"array.required": "variations is required.",
				}),
			variants: Joi.array()
				.items(this.variantsSchema)
				.required()
				.messages({
					"array.base": "variants must be an array.",
					"array.empty": "variants cannot be empty.",
					"array.required": "variants is required.",
				}),
		};
	}

	validateProductCreation = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const productSchema = Joi.object(this.schema);

			const validationResult = productSchema.validate(req.body);

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

	validateProductEdit = (req: Request, res: Response, next: NextFunction) => {
		try {
			const productSchema = Joi.object({
				productId: Joi.number().required().messages({
					"number.base": "productId must be a number.",
					"number.required": "productId is required.",
					"number.empty": "productId cannot be empty.",
				}),
				...this.schema,
			});

			const validationResult = productSchema.validate(req.body);

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

	validateProductDeletion = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const productSchema = Joi.object({
				productId: Joi.number().required().messages({
					"number.base": "productId must be a number.",
					"number.empty": "productId cannot be empty.",
					"number.required": "productId is required.",
				}),
			});

			const validationResult = productSchema.validate(req.params);

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

	validateProductFetchById = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const productSchema = Joi.object({
				productId: Joi.number().required().messages({
					"number.base": "productId must be a number.",
					"number.empty": "productId cannot be empty.",
					"number.required": "productId is required.",
				}),
			});

			const validationResult = productSchema.validate(req.params);

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

	validateProductStatusChange = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const productSchema = Joi.object({
				productId: Joi.number().required().messages({
					"number.base": "productId must be a integer.",
					"number.required": "productId is required.",
				}),
			});

			const validationResult = productSchema.validate(req.query);
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
			const productSchema = Joi.object({
				searchTerm: Joi.string().trim().optional().messages({
					"string.base": "searchTerm must be a string.",
					"string.empty": "searchTerm cannot be empty.",
				}),
				searchBy: Joi.string()
					.trim()
					.optional()
					.valid("name", "sku")
					.messages({
						"string.base": "searchBy must be a string.",
						"any.valid": "searchBy should be 'name' or 'sku'.",
						"string.empty": "searchBy cannot be empty.",
					}),
				page: Joi.number().optional().default(1).messages({
					"number.base": "page must be a integer.",
				}),
				limit: Joi.number().optional().default(20).messages({
					"number.base": "limit must be a integer.",
				}),
			});

			const validationResult = productSchema.validate(req.query);

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

	validateRandomProductsFetching = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const productSchema = Joi.object({
				limit: Joi.number().required().messages({
					"number.base": "limit must be a integer.",
					"number.empty": "limit cannot be empty.",
					"number.required": "limit is required.",
				}),
				excludeProductId: Joi.number().optional().messages({
					"number.base": "excludeProductId must be a integer.",
				}),
			});

			const validationResult = productSchema.validate(req.query);

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

export default ProductMiddleware;
