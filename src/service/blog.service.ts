import { Order, WhereOptions } from "sequelize";
import Blog, { BlogAttributes } from "../model/blog.model";

class BlogService {
	createBlog = async (
		title: string,
		content: string,
		bannerImg: string,
	): Promise<Blog | BlogAttributes | null> => {
		try {
			const createdBlog = await Blog.create({
				title,
				content,
				bannerImg,
			});

			return createdBlog ? createdBlog.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	editBlog = async (
		blogId: number,
		title: string,
		content: string,
		bannerImg: string,
	): Promise<Blog | BlogAttributes | null> => {
		try {
			const blog = await Blog.findByPk(blogId);

			if (blog) {
				blog.title = title;
				blog.content = content;
				blog.bannerImg = bannerImg;
				await blog.save();
				return blog.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	getBlogById = async (
		blogId: number,
	): Promise<Blog | BlogAttributes | null> => {
		try {
			const blog = await Blog.findByPk(blogId);

			return blog ? blog.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	deleteBlog = async (blogId: number): Promise<boolean> => {
		try {
			const blog = await Blog.findByPk(blogId);

			if (blog) {
				await blog.destroy();
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	getAllBlogs = async (
		filter: WhereOptions<BlogAttributes>,
		limit: number,
		offset: number,
		order: Order,
	): Promise<{ rows: Blog[] | BlogAttributes[]; count: number }> => {
		try {
			const blogs = await Blog.findAndCountAll({
				where: filter,
				limit,
				offset,
				order,
			});

			return {
				rows: blogs.rows.map((blog) => blog.toJSON()),
				count: blogs.count,
			};
		} catch (err: any) {
			
			throw err;
		}
	};
}

export default BlogService;
