import express from "express";
import AuthMiddleware from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";
import ProductCategoryMiddleware from "../middleware/product-category.middleware";
import ProductCategoryController from "../controller/product-category.controller";

const productCategoryMiddleware = new ProductCategoryMiddleware();
const productCategoryController = new ProductCategoryController();
const authMiddleware = new AuthMiddleware();

const productCategoryRouter = express.Router();

productCategoryRouter.get(
	"/",
	productCategoryMiddleware.validateFilteringQueries,
	productCategoryController.getAllCategories,
);

productCategoryRouter.get(
	"/:categoryId",
	productCategoryMiddleware.validateProductFetchByCategory,
	productCategoryController.getCategoryById,
);

productCategoryRouter.post(
	"/create",
	strictLimiter,
	productCategoryMiddleware.validateProductCategoryCreation,
	productCategoryController.createCategory,
);

productCategoryRouter.put(
	"/",
	strictLimiter,
	productCategoryMiddleware.validateProductCategoryEdit,
	productCategoryController.editCategory,
);

productCategoryRouter.delete(
	"/:categoryId",
	authMiddleware.authenticate(["admin"]),
	productCategoryMiddleware.validateProductCategoryDeletion,
	productCategoryController.deleteCategory,
);

export default productCategoryRouter;
