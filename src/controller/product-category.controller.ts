import { Request, Response, NextFunction } from "express";
import ProductCategoryService from "../service/product-category.service";
import { createSlug, responseSender } from "../util";
import { Op, Order, WhereOptions } from "sequelize";
import { ProductCategoryAttributes } from "../model/product-category.model";

class ProductCategoryController {
	private productCategoryService: ProductCategoryService;

	constructor() {
		this.productCategoryService = new ProductCategoryService();
	}

	createCategory = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const newCategory = {
				name: (req as any).validatedValue.name,
				parentCategoryId:
					(req as any).validatedValue.parentCategoryId || null,
			};

			const isCategoryExist =
				await this.productCategoryService.getCategoryBySlug(
					createSlug(newCategory.name),
				);

			if (isCategoryExist) {
				return responseSender(
					res,
					400,
					"Category already exist. Category name must be unique.",
				);
			}

			const createdCategory =
				await this.productCategoryService.createCategory(
					newCategory.name,
					newCategory.parentCategoryId,
				);

			if (!createdCategory) {
				return responseSender(
					res,
					500,
					"Product category creation failed. Please try again.",
				);
			}

			return responseSender(
				res,
				201,
				"Product category created successfully.",
				{
					category: createdCategory,
				},
			);
		} catch (err: any) {
			
			next(err);
		}
	};

	editCategory = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const editedCategory = {
				categoryId: (req as any).validatedValue.categoryId,
				name: (req as any).validatedValue.name,
				parentCategoryId:
					(req as any).validatedValue.parentCategoryId || null,
			};

			const updatedCategory =
				await this.productCategoryService.updateCategory(
					editedCategory.categoryId,
					editedCategory.name,
					editedCategory.parentCategoryId,
				);

			if (!updatedCategory) {
				return responseSender(
					res,
					500,
					"Product category update failed. Please try again.",
				);
			}

			return responseSender(
				res,
				200,
				"Product category updated successfully.",
			);
		} catch (err: any) {
			
			next(err);
		}
	};

	deleteCategory = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const fetchedCategory =
				await this.productCategoryService.getCategoryById(
					Number((req as any).validatedValue.categoryId),
				);

			if (!fetchedCategory) {
				return responseSender(res, 400, "Category couldn't found.");
			}

			const isDeleted = await this.productCategoryService.deleteCategory(
				fetchedCategory.categoryId,
			);
			if (!isDeleted) {
				return responseSender(
					res,
					500,
					"Couldn't delete category. Please try again.",
				);
			}

			return responseSender(res, 200, "Category deleted successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	getCategoryById = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const categoryId = Number((req as any).validatedValue.categoryId);

			const category =
				await this.productCategoryService.getCategoryById(categoryId);
			if (!category) {
				return responseSender(
					res,
					404,
					"No category found associated with this id.",
				);
			}
			return responseSender(
				res,
				200,
				"Categories fetched successfully.",
				{
					category,
				},
			);
		} catch (err: any) {
			
			next(err);
		}
	};

	getAllCategories = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const searchTerm = (req as any).validatedValue.searchTerm;
			const currentPage = parseInt((req as any).validatedValue.page || 1);
			const limitPerPage = parseInt(
				(req as any).validatedValue.limit || 20,
			);
			const offset = (currentPage - 1) * limitPerPage;
			const order: Order = [["createdAt", "DESC"]];
			const filter: WhereOptions<ProductCategoryAttributes> = {};

			if (searchTerm) {
				filter.name = {
					[Op.like]: `%${searchTerm}%`,
				};
			}

			const categories =
				await this.productCategoryService.getAllCategories(
					filter,
					limitPerPage,
					offset,
					order,
				);
			if (!categories.rows) {
				return responseSender(
					res,
					400,
					"Failed to get categories. Please try again.",
				);
			}
			return responseSender(
				res,
				200,
				"Categories fetched successfully.",
				{
					categories: categories.rows,
					total: categories.count,
					totalPages: Math.ceil(categories.count / limitPerPage),
					currentPage,
				},
			);
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default ProductCategoryController;
