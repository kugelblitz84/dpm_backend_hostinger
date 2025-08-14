import express from "express";
import AuthMiddleware from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";
import ImageUploaderMiddleware from "../middleware/imageUploader.middleware";
import BlogController from "../controller/blog.controller";
import BlogMiddleware from "../middleware/blog.middleware";

const blogController = new BlogController();
const blogMiddleware = new BlogMiddleware();
const authMiddleware = new AuthMiddleware();
const blogImageUploader = new ImageUploaderMiddleware();

const blogRouter = express.Router();

blogRouter.get(
	"/",
	blogMiddleware.validateFilteringQueries,
	blogController.getAllBlogs,
);

blogRouter.post(
	"/",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	blogImageUploader.uploader("blog-images").single("bannerImg"),
	blogImageUploader.compressImage,
	blogMiddleware.validateBlogCreation,
	blogController.createBlog,
);

blogRouter.put(
	"/",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	blogImageUploader.uploader("blog-images").single("bannerImg"),
	blogImageUploader.compressImage,
	blogMiddleware.validateBlogEdit,
	blogController.editBlog,
);

blogRouter.delete(
	"/:blogId",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	blogController.deleteBlog,
);

export default blogRouter;
