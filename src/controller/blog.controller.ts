import { Request, Response, NextFunction } from "express";
import BlogService from "../service/blog.service";
import { responseSender } from "../util";
import path from "path";
import fs from "fs";
import { Op, Order, WhereOptions } from "sequelize";
import { BlogAttributes } from "../model/blog.model";
import { staticDir } from "../config/dotenv.config";

class BlogController {
	private blogService: BlogService;

	constructor() {
		this.blogService = new BlogService();
	}

	createBlog = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fileValidationError = (req as any).fileValidationError;
			if (fileValidationError) {
				return responseSender(res, 400, fileValidationError);
			}

			if (!req.file) {
				return responseSender(res, 400, "Please upload a banner image");
			}

			const newBlog = {
				title: (req as any).validatedValue.title,
				content: (req as any).validatedValue.content,
				bannerImg: req.file?.filename && req.file.filename,
			};
			const createdBlog = await this.blogService.createBlog(
				newBlog.title,
				newBlog.content,
				newBlog.bannerImg,
			);

			if (!createdBlog) {
				if (req.file) {
					const filePath = path.join(
						req.file.destination,
						req.file.filename,
					);

					fs.unlink(filePath, (unlinkErr) => {
						if (unlinkErr) {
							// Optionally log the error
						}
					});
				}

				return responseSender(res, 400, "Blog could not be created");
			}

			return responseSender(res, 201, "Blog created successfully.", {
				blog: createdBlog,
			});
		} catch (err: any) {
			// If database operation fails, delete the uploaded file
			if (req.file) {
				const filePath = path.join(
					req.file.destination,
					req.file.filename,
				);

				fs.unlink(filePath, (unlinkErr) => {
					if (unlinkErr) {
						// Optionally log the error
					}
				});
			}

			next(err);
		}
	};

	editBlog = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fileValidationError = (req as any).fileValidationError;
			if (fileValidationError) {
				return responseSender(res, 400, fileValidationError);
			}

			if (!req.file) {
				return responseSender(res, 400, "Please upload a banner image");
			}

			const editedBlog = {
				blogId: (req as any).validatedValue.blogId,
				title: (req as any).validatedValue.title,
				content: (req as any).validatedValue.content,
				bannerImg: req.file?.filename && req.file.filename,
			};

			const isBlogExist = await this.blogService.getBlogById(
				editedBlog.blogId,
			);
			if (!isBlogExist) {
				return responseSender(res, 400, "Blog does not exist");
			}

			// remove the previous banner images
			if (isBlogExist.bannerImg) {
				const filePath = path.join(
					staticDir,
					"blog-images",
					isBlogExist.bannerImg,
				);

				fs.unlink(filePath, (unlinkErr) => {
					if (unlinkErr) {
						// Optionally log the error
					}
				});
			}

			const isEditedBlog = await this.blogService.editBlog(
				editedBlog.blogId,
				editedBlog.title,
				editedBlog.content,
				editedBlog.bannerImg,
			);

			if (!isEditedBlog) {
				return responseSender(res, 400, "Blog could not be edited");
			}

			return responseSender(res, 200, "Blog edited successfully.");
		} catch (err: any) {
			// If database operation fails, delete the uploaded file
			if (req.file) {
				const filePath = path.join(
					req.file.destination,
					req.file.filename,
				);

				fs.unlink(filePath, (unlinkErr) => {
					if (unlinkErr) {
						// Optionally log the error
					}
				});
			}

			next(err);
		}
	};

	deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const blogId = (req as any).params.blogId;

			const isBlogExist = await this.blogService.getBlogById(blogId);

			if (!isBlogExist) {
				return responseSender(res, 404, "Blog not found.");
			}

			if (isBlogExist.bannerImg) {
				const filePath = path.join(
					staticDir,
					"blog-images",
					isBlogExist.bannerImg,
				);

				fs.unlink(filePath, (unlinkErr) => {
					if (unlinkErr) {
						// Optionally log the error
					}
				});
			}

			const isDeleted = await this.blogService.deleteBlog(blogId);

			if (!isDeleted) {
				return responseSender(
					res,
					500,
					"Blog deletion failed. Please try again.",
				);
			}

			return responseSender(res, 200, "Blog deleted successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	getAllBlogs = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const searchTerm = (req as any).validatedValue.searchTerm;
			const currentPage = parseInt((req as any).validatedValue.page || 1);
			const limitPerPage = parseInt(
				(req as any).validatedValue.limit || 20,
			);
			const offset = (currentPage - 1) * limitPerPage;
			const order: Order = [["createdAt", "DESC"]];
			const filter: WhereOptions<BlogAttributes> = {};

			if (searchTerm) {
				filter.title = {
					[Op.like]: `%${searchTerm}%`,
				};
			}

			const blogs = await this.blogService.getAllBlogs(
				filter,
				limitPerPage,
				offset,
				order,
			);
			if (!blogs.rows) {
				return responseSender(
					res,
					400,
					"Failed to get blogs. Please try again.",
				);
			}
			return responseSender(res, 200, "Blogs fetched successfully.", {
				blogs: blogs.rows,
				total: blogs.count,
				totalPages: Math.ceil(blogs.count / limitPerPage),
				currentPage,
			});
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default BlogController;
