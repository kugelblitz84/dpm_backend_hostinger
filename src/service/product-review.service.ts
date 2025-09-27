import Customer from "../model/customer.model";
import ProductReview, { ProductReviewAttributes } from "../model/product-review.model";
import Product from "../model/product.model";
import { Order, WhereOptions } from "sequelize";

// Normalized shape exposed to controllers / API responses aligning with frontend contract
export interface NormalizedProductReview {
	reviewId: number;
	id: number; // alias
	productId: number;
	rating: number;
	description: string;
	comment: string; // alias of description
	status: string;
	createdAt: Date;
	updatedAt: Date;
	customer: { name: string; email: string; customerId: number } | null;
	guestName: string;
	guestEmail: string;
}

class ProductReviewService {
	// Internal helper to normalize review shape for frontend contract
	private transformReview(review: any) {
		if (!review) return null;
		// Ensure customer object present only when a registered customer exists
		const customer = review.customer
			? {
				name: review.customer.name,
				email: review.customer.email,
				customerId: review.customer.customerId,
			}
			: null;

		return {
			// Preserve original identifiers
			reviewId: review.reviewId,
			id: review.reviewId, // Alias expected by some frontend helpers
			productId: review.productId,
			rating: review.rating,
			description: review.description, // Legacy field kept
			comment: review.description, // Contract alias
			status: review.status,
			createdAt: review.createdAt,
			updatedAt: review.updatedAt,
			// Provide normalized customer object or null (frontend shows 'Guest' when null)
			customer,
			// Retain guestName / guestEmail for backward compatibility (not relied upon by new UI)
			guestName: review.guestName,
			guestEmail: review.guestEmail,
		};
	}
	// create a new product review
	createReview = async (
		rating: number,
		description: string,
		productId: number,
		customerId: number | null, // Documentation: customerId can be null for guest users
		guestName: string, // Documentation: Name is required for all reviews
		guestEmail: string, // Documentation: Email is required for all reviews
	): Promise<NormalizedProductReview | null> => {
		try {
			// If a registered customerId is provided, prefer authoritative name/email from Customer table
			if (customerId) {
				const customer = await Customer.findByPk(customerId, {
					attributes: ["customerId", "name", "email"],
				});
				if (customer) {
					guestName = customer.name; // Overwrite to ensure consistency
					guestEmail = customer.email;
				} else {
					// Customer not found, treat as guest
					customerId = null;
				}
			}
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

			return createdReview ? this.transformReview(createdReview.toJSON()) : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	// Get a review by reviewId
	getReviewByReviewId = async (
		reviewId: number,
	): Promise<NormalizedProductReview | null> => {
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
			return review ? this.transformReview(review.toJSON()) : null;
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
		rows: NormalizedProductReview[];
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
				rows: reviews.map((review) => this.transformReview(review.toJSON()) as NormalizedProductReview),
				count,
			};
		} catch (err: any) {
			
			throw err;
		}
	};
}

export default ProductReviewService;
