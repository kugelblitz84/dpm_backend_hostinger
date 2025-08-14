import ProductCategory, {
	ProductCategoryAttributes,
} from "../model/product-category.model";
import Product from "../model/product.model";
import { createSlug } from "../util";
import { Order, WhereOptions } from "sequelize";

class ProductCategoryService {
	// Create a new category
	createCategory = async (
		name: string,
		parentCategoryId?: number | null,
	): Promise<ProductCategory | ProductCategoryAttributes | null> => {
		try {
			const category = await ProductCategory.create({
				name,
				slug: createSlug(name),
				parentCategoryId,
			});
			return category ? category.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	// Get category by slug
	getCategoryBySlug = async (
		slug: string,
	): Promise<ProductCategory | ProductCategoryAttributes | null> => {
		try {
			const category = await ProductCategory.findOne({
				where: { slug },
			});
			return category ? category.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	// Get category by ID
	getCategoryById = async (
		categoryId: number,
	): Promise<ProductCategory | ProductCategoryAttributes | null> => {
		try {
			const category = await ProductCategory.findByPk(categoryId, {
				include: [
					{ model: ProductCategory, as: "parentCategory" },
					{ model: ProductCategory, as: "subCategories" },
					{ model: Product, as: "products", separate: true },
				],
			});
			return category ? category.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	// Update category
	updateCategory = async (
		categoryId: number,
		name: string,
		parentCategoryId: number | null,
	): Promise<boolean> => {
		try {
			const [updatedRows] = await ProductCategory.update(
				{ name, slug: createSlug(name), parentCategoryId },
				{
					where: { categoryId },
				},
			);
			return updatedRows > 0;
		} catch (err: any) {
			
			throw err;
		}
	};

	// Delete category
	deleteCategory = async (categoryId: number): Promise<boolean> => {
		try {
			const category = await ProductCategory.findByPk(categoryId);
			if (category) {
				await category.destroy();
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	// Get all categories with optional filtering
	getAllCategories = async (
		filter: WhereOptions<ProductCategoryAttributes> = {},
		limit: number,
		offset: number,
		order: Order,
	): Promise<{
		rows: ProductCategory[] | ProductCategoryAttributes[];
		count: number;
	}> => {
		try {
			const categories = await ProductCategory.findAndCountAll({
				where: filter,
				limit,
				offset,
				order,
				distinct: true,
				include: [
					{ model: ProductCategory, as: "parentCategory" },
					{ model: ProductCategory, as: "subCategories" },
					{ model: Product, as: "products", separate: true },
				],
			});
			return {
				rows: categories.rows.map((category) => category.toJSON()),
				count: categories.count,
			};
		} catch (err: any) {
			
			throw err;
		}
	};
}

export default ProductCategoryService;
