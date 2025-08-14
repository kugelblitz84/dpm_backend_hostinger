import express from "express";
import AuthMiddleware from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";
import ProductMiddleware from "../middleware/product.middleware";
import ProductController from "../controller/product.controller";
import ImageUploaderMiddleware from "../middleware/imageUploader.middleware";

const productMiddleware = new ProductMiddleware();
const productController = new ProductController();
const authMiddleware = new AuthMiddleware();
const productImageUploader = new ImageUploaderMiddleware();

const productRouter = express.Router();

productRouter.get(
	"/",
	productMiddleware.validateFilteringQueries,
	productController.getAllProducts,
);

productRouter.get(
	"/random",
	productMiddleware.validateRandomProductsFetching,
	productController.getRandomProducts,
);

productRouter.get(
	"/:productId",
	productMiddleware.validateProductFetchById,
	productController.getProductById,
);

productRouter.post(
	"/create",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	productMiddleware.validateProductCreation,
	productController.createProduct,
);

// just for product image upload
productRouter.post(
	"/upload-image",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	productImageUploader.uploader("product-images").array("product-images", 20),
	productImageUploader.compressImages,
	productController.createProductImage,
);

productRouter.put(
	"/",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	productMiddleware.validateProductEdit,
	productController.editProduct,
);

// just for product image edit
productRouter.put(
	"/edit-image",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	productImageUploader.uploader("product-images").array("product-images", 20),
	productImageUploader.compressImages,
	productController.editProductImage,
);

productRouter.delete(
	"/:productId",
	authMiddleware.authenticate(["admin"]),
	productMiddleware.validateProductDeletion,
	productController.deleteProduct,
);

productRouter.get(
	"/active",
	authMiddleware.authenticate(["admin"]),
	productMiddleware.validateProductStatusChange,
	productController.activeProduct,
);

productRouter.get(
	"/inactive",
	authMiddleware.authenticate(["admin"]),
	productMiddleware.validateProductStatusChange,
	productController.inactiveProduct,
);

export default productRouter;
