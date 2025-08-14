import ProductService from "../service/product.service";
import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";
import { Op, Order, WhereOptions } from "sequelize";
import { ProductModelAttributes } from "../model/product.model";
import fs from "fs";
import path from "path";
import { staticDir } from "../config/dotenv.config";

class ProductController {
	private productService: ProductService;

	constructor() {
		this.productService = new ProductService();
	}

	createProduct = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const newProduct = {
				name: (req as any).validatedValue.name,
				description: (req as any).validatedValue.description,
				basePrice: (req as any).validatedValue.basePrice,
				minOrderQuantity: (req as any).validatedValue.minOrderQuantity,
				discountStart: (req as any).validatedValue.discountStart,
				discountEnd: (req as any).validatedValue.discountEnd,
				discountPercentage: (req as any).validatedValue
					.discountPercentage,
				pricingType: (req as any).validatedValue.pricingType,
				categoryId: (req as any).validatedValue.categoryId,
				isActive: (req as any).validatedValue.isActive,
				attributes: (req as any).validatedValue.attributes,
				tags: (req as any).validatedValue.tags,
				variations: (req as any).validatedValue.variations,
				variants: (req as any).validatedValue.variants,
			};

			const createdProduct = await this.productService.createProduct(
				newProduct.name,
				newProduct.description,
				newProduct.basePrice,
				newProduct.minOrderQuantity,
				newProduct.discountStart,
				newProduct.discountEnd,
				newProduct.discountPercentage,
				newProduct.pricingType,
				newProduct.categoryId,
				newProduct.isActive,
				newProduct.attributes,
				newProduct.tags,
				newProduct.variations,
				newProduct.variants,
			);

			if (!createdProduct) {
				return responseSender(
					res,
					500,
					"Product creation failed. Please try again.",
				);
			}

			return responseSender(res, 201, "Product created successfully.", {
				product: createdProduct,
			});
		} catch (err: any) {
			
			next(err);
		}
	};

	createProductImage = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const fileValidationError = (req as any).fileValidationError;
			if (fileValidationError) {
				return responseSender(res, 400, fileValidationError);
			}

			const productId = req.body.productId;

			if (!productId) {
				if (req.files && Array.isArray(req.files)) {
					req.files.forEach((file) => {
						const filePath = path.join(
							file.destination,
							file.filename,
						);

						fs.unlink(filePath, (unlinkErr) => {
							if (unlinkErr) {
								
							}
						});
					});
				}

				return responseSender(
					res,
					400,
					"Product ID could not found. Please try again later.",
				);
			}

			if ((req as any).files.length > 0) {
				for (const image of (req as any).files) {
					await this.productService.createProductImage(
						image.filename,
						productId,
					);
				}
			}

			return responseSender(
				res,
				200,
				"Product image uploaded successfully.",
			);
		} catch (err: any) {
			// cleanup process if database operation failed
			if (req.files && Array.isArray(req.files)) {
				req.files.forEach((file) => {
					const filePath = path.join(file.destination, file.filename);

					fs.unlink(filePath, (unlinkErr) => {
						if (unlinkErr) {
							
						}
					});
				});
			}

			next(err);
		}
	};

	editProduct = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const productId = (req as any).validatedValue.productId;
			const editedProduct = {
				name: (req as any).validatedValue.name,
				description: (req as any).validatedValue.description,
				basePrice: (req as any).validatedValue.basePrice,
				minOrderQuantity: (req as any).validatedValue.minOrderQuantity,
				discountStart: (req as any).validatedValue.discountStart,
				discountEnd: (req as any).validatedValue.discountEnd,
				discountPercentage: (req as any).validatedValue
					.discountPercentage,
				pricingType: (req as any).validatedValue.pricingType,
				categoryId: (req as any).validatedValue.categoryId,
				isActive: (req as any).validatedValue.isActive,
				attributes: (req as any).validatedValue.attributes,
				tags: (req as any).validatedValue.tags,
				variations: (req as any).validatedValue.variations,
				variants: (req as any).validatedValue.variants,
			};

			const isProductExist =
				await this.productService.getProductById(productId);

			if (!isProductExist) {
				return responseSender(
					res,
					404,
					"Product could not found. Please try again later.",
				);
			}

			const updatedProduct = await this.productService.updateProduct(
				productId,
				editedProduct.name,
				editedProduct.description,
				editedProduct.basePrice,
				editedProduct.minOrderQuantity,
				editedProduct.discountStart,
				editedProduct.discountEnd,
				editedProduct.discountPercentage,
				editedProduct.pricingType,
				editedProduct.categoryId,
				editedProduct.isActive,
				editedProduct.attributes,
				editedProduct.tags,
				editedProduct.variations,
				editedProduct.variants,
			);

			if (!updatedProduct) {
				return responseSender(
					res,
					500,
					"Product update failed. Please try again.",
				);
			}

			return responseSender(res, 200, "Product updated successfully.", {
				product: updatedProduct,
			});
		} catch (err: any) {
			
			next(err);
		}
	};

	editProductImage = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			// Check for file validation error
			const fileValidationError = (req as any).fileValidationError;
			if (fileValidationError) {
				return responseSender(res, 400, fileValidationError);
			}

			const productId = req.body.productId;

			if (!productId) {
				// Cleanup uploaded files if productId is missing
				if (req.files && Array.isArray(req.files)) {
					req.files.forEach((file) => {
						const filePath = path.join(
							file.destination,
							file.filename,
						);
						fs.unlink(filePath, (unlinkErr) => {
							if (unlinkErr) {
								
							}
						});
					});
				}
				return responseSender(res, 400, "Product ID is required.");
			}

			// Fetch existing product images from the database
			const existingProductImages =
				await this.productService.getProductImagesByProductId(
					productId,
				);

			// Case 1: If `req.files` is empty → Remove all previous images & cleanup storage
			if (!req.files || (req as any).files.length === 0) {
				if (existingProductImages && existingProductImages.length > 0) {
					for (const image of existingProductImages) {
						// Delete image from the database
						await this.productService.deleteProductImage(
							image.imageId,
						);

						// Cleanup storage
						const publicDir = path.resolve(staticDir);
						const filePath = path.join(
							publicDir,
							"product-images",
							image.imageName,
						);

						fs.unlink(filePath, (unlinkErr) => {
							if (unlinkErr) {
								
							}
						});
					}
				}
				return responseSender(
					res,
					200,
					"All previous product images removed.",
				);
			}

			// Case 2: New images are uploaded → Remove all previous images except new ones
			const uploadedFiles = (req as any).files as Express.Multer.File[];

			// Save new images in the database
			for (const file of uploadedFiles) {
				await this.productService.createProductImage(
					file.filename,
					productId,
				);
			}

			// Delete previous images that are not in the new upload list
			if (existingProductImages && existingProductImages.length > 0) {
				for (const image of existingProductImages) {
					const isStillPresent = uploadedFiles.some(
						(file) => file.filename === image.imageName,
					);
					if (!isStillPresent) {
						// Delete from database
						await this.productService.deleteProductImage(
							image.imageId,
						);

						// Cleanup storage
						// Cleanup storage
						const publicDir = path.resolve(staticDir);
						const filePath = path.join(
							publicDir,
							"product-images",
							image.imageName,
						);
						fs.unlink(filePath, (unlinkErr) => {
							if (unlinkErr) {
								
							}
						});
					}
				}
			}

			return responseSender(
				res,
				200,
				"Product images updated successfully.",
			);
		} catch (err: any) {
			// Cleanup uploaded files in case of failure
			if (req.files && Array.isArray(req.files)) {
				req.files.forEach((file) => {
					const filePath = path.join(file.destination, file.filename);
					fs.unlink(filePath, (unlinkErr) => {
						if (unlinkErr) {
							
						}
					});
				});
			}

			next(err);
		}
	};

	deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fetchedProduct = await this.productService.getProductById(
				Number((req as any).validatedValue.productId),
			);

			if (!fetchedProduct) {
				return responseSender(res, 400, "Product couldn't found.");
			}
			// Fetch existing product images from the database
			const existingProductImages =
				await this.productService.getProductImagesByProductId(
					fetchedProduct.productId,
				);

			const isDeleted = await this.productService.deleteProduct(
				fetchedProduct.productId,
			);
			if (!isDeleted) {
				return responseSender(
					res,
					500,
					"Couldn't delete product. Please try again.",
				);
			}

			if (existingProductImages && existingProductImages.length > 0) {
				for (const image of existingProductImages) {
					// Delete image from the database
					await this.productService.deleteProductImage(image.imageId);

					// Cleanup storage
					const publicDir = path.resolve(staticDir);
					const filePath = path.join(
						publicDir,
						"product-images",
						image.imageName,
					);

					fs.unlink(filePath, (unlinkErr) => {
						if (unlinkErr) {
							
						}
					});
				}
			}

			return responseSender(res, 200, "Product deleted successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	activeProduct = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const product = await this.productService.activeProduct(
				(req as any).validatedValue.productId,
			);

			if (!product) {
				return responseSender(
					res,
					400,
					"Failed to activate product. Please try again.",
				);
			}
			return responseSender(res, 200, "Product activated successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	inactiveProduct = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const product = await this.productService.inactiveProduct(
				(req as any).validatedValue.productId,
			);

			if (!product) {
				return responseSender(
					res,
					400,
					"Failed to inactivate product. Please try again.",
				);
			}
			return responseSender(
				res,
				200,
				"Product inactivated successfully.",
			);
		} catch (err: any) {
			
			next(err);
		}
	};

	getProductById = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const productId = Number((req as any).validatedValue.productId);

			const product = await this.productService.getProductById(productId);

			if (!product) {
				return responseSender(
					res,
					404,
					"No product found associated with this id.",
				);
			}
			return responseSender(res, 200, "Product fetched successfully.", {
				product,
			});
		} catch (err: any) {
			
			next(err);
		}
	};

	getAllProducts = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const searchTerm = (req as any).validatedValue.searchTerm;
			const searchBy = (req as any).validatedValue.searchBy;
			const currentPage = parseInt((req as any).validatedValue.page || 1);
			const limitPerPage = parseInt(
				(req as any).validatedValue.limit || 20,
			);
			const offset = (currentPage - 1) * limitPerPage;
			const order: Order = [["createdAt", "DESC"]];
			const filter: WhereOptions<ProductModelAttributes> = {};

			if (searchTerm) {
				filter.name = {
					[Op.like]: `%${searchTerm}%`,
				};
			}

			if (searchTerm && searchBy) {
				switch (searchBy) {
					case "name":
						filter.name = {
							[Op.like]: `%${searchTerm}%`,
						};
						break;
					case "sku":
						filter.sku = {
							[Op.like]: `%${searchTerm}%`,
						};
						break;
					default:
						break;
				}
			}

			const products = await this.productService.getAllProducts(
				filter,
				limitPerPage,
				offset,
				order,
			);
			if (!products.rows) {
				return responseSender(
					res,
					400,
					"Failed to get products. Please try again.",
				);
			}
			return responseSender(res, 200, "Products fetched successfully.", {
				products: products.rows,
				total: products.count,
				totalPages: Math.ceil(products.count / limitPerPage),
				currentPage,
			});
		} catch (err: any) {
			
			next(err);
		}
	};

	getRandomProducts = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const limit = (req as any).validatedValue.limit;
			const excludeProductId = (req as any).validatedValue
				.excludeProductId;

			const products = await this.productService.getRandomProducts(
				limit,
				excludeProductId,
			);
			if (!products.length) {
				return responseSender(
					res,
					400,
					"Failed to get random products. Please try again.",
				);
			}
			return responseSender(res, 200, "Products fetched successfully.", {
				products,
			});
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default ProductController;
