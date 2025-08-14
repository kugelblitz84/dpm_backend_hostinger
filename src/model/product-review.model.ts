import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
	Min,
	Max,
	ForeignKey,
	BelongsTo,
	Default,
} from "sequelize-typescript";
import Product from "../model/product.model";
import Customer from "../model/customer.model";

export interface ProductReviewAttributes {
	reviewId: number;
	rating: number;
	description: string;
	status: "published" | "unpublished";
	productId: number;
	customerId: number | null; // Documentation: customerId can be null for guest users
	guestName: string; // Documentation: Name is required for all reviews
	guestEmail: string; // Documentation: Email is required for all reviews
	createdAt: Date;
	updatedAt: Date;
}

export interface ProductReviewCreationAttributes {
	rating: number;
	description: string;
	productId: number;
	customerId: number | null; // Documentation: customerId can be null for guest users
	guestName: string; // Documentation: Name is required for all reviews
	guestEmail: string; // Documentation: Email is required for all reviews
}

@Table({ tableName: "ProductReviews", timestamps: true })
export default class ProductReview extends Model<
	ProductReviewAttributes,
	ProductReviewCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare reviewId: number;

	@Min(1)
	@Max(5)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare rating: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare description: string;

	@Default("unpublished")
	@Column({
		type: DataType.ENUM("published", "unpublished"),
		allowNull: false,
	})
	declare status: string;

	@ForeignKey(() => Product)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare productId: number;

	@ForeignKey(() => Customer)
	// Documentation: customerId is nullable - allows guest users
	@Column({ type: DataType.INTEGER, allowNull: true })
	declare customerId: number | null;

	// Documentation: Name and email are required for all reviews (guest or registered users)
	@Column({ type: DataType.STRING, allowNull: false })
	declare guestName: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare guestEmail: string;

	@BelongsTo(() => Product, { as: "product" })
	declare product?: Product;

	@BelongsTo(() => Customer, { as: "customer" })
	declare customer?: Customer;
}
