import Customer from "../model/customer.model";
import ProductReview, {
	ProductReviewAttributes,
} from "../model/product-review.model";
import Product from "../model/product.model";
import { Order, WhereOptions } from "sequelize";

class ProductReviewService {
	// create a new product review
	createReview = async (
		rating: number,
		description: string,
		productId: number,
		customerId: number | null, // Documentation: customerId can be null for guest users
		guestName: string, // Documentation: Name is required for all reviews
		guestEmail: string, // Documentation: Email is required for all reviews
	): Promise<ProductReview | ProductReviewAttributes | null> => {
		try {
			const review = await ProductReview.create({
				rating,
				description,
				productId,
				customerId,
				guestName,
				guestEmail,
			});

			if (!review) {
				return null;
			}

			const createdReview = await ProductReview.findByPk(
				review.reviewId,
				{
					include: [
						{
							model: Product,
							as: "product",
							attributes: ["productId", "name"],
						},
						{
							model: Customer,
							as: "customer",
							attributes: ["customerId", "name", "email"],
						},
					],
				},
			);

			return createdReview ? createdReview.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	// Get a review by reviewId
	getReviewByReviewId = async (
		reviewId: number,
	): Promise<ProductReview | ProductReviewAttributes | null> => {
		try {
			const review = await ProductReview.findByPk(reviewId, {
				include: [
					{
						model: Product,
						as: "product",
						attributes: ["productId", "name"],
					},
					{
						model: Customer,
						as: "customer",
						attributes: ["customerId", "name", "email"],
					},
				],
			});
			return review ? review.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	// set status by review id
	setStatusById = async (
		reviewId: number,
		status: "published" | "unpublished",
	): Promise<boolean> => {
		try {
			const [updatedRows] = await ProductReview.update(
				{ status },
				{
					where: { reviewId },
				},
			);
			return updatedRows > 0;
		} catch (err: any) {
			
			throw err;
		}
	};

	// Delete a review by id
	deleteReviewById = async (reviewId: number): Promise<boolean> => {
		try {
			const review = await ProductReview.findByPk(reviewId);
			if (review) {
				await review.destroy();
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	getAllReviews = async (
		filter: WhereOptions<ProductReviewAttributes> = {},
		limit: number,
		offset: number,
		order: Order,
	): Promise<{
		rows: ProductReview[] | ProductReviewAttributes[];
		count: number;
	}> => {
		try {
			const reviews = await ProductReview.findAll({
				where: filter,
				limit,
				offset,
				order,
				subQuery: false,
				include: [
					{
						model: Product,
						as: "product",
						attributes: ["productId", "name"],
					},
					{
						model: Customer,
						as: "customer",
						attributes: ["customerId", "name", "email"],
					},
				],
			});
			const count = await ProductReview.count({ where: filter });
			return {
				rows: reviews.map((review) => review.toJSON()),
				count,
			};
		} catch (err: any) {
			
			throw err;
		}
	};
}

export default ProductReviewService;
