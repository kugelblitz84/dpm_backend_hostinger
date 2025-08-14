import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
	ForeignKey,
	BelongsTo,
	HasMany,
} from "sequelize-typescript";
import ProductCategory from "../model/product-category.model";
import ProductAttribute from "../model/product-attribute.model";
import ProductImage from "../model/product-image.model";
import ProductReview from "../model/product-review.model";
import ProductTag from "../model/product-tags.model";
import Variation from "../model/variation.model";
import ProductVariant from "../model/product-variant.model";
import OrderItem from "./order-item.model";

export interface ProductModelAttributes {
	productId: number;
	name: string;
	description: string;
	slug: string;
	sku: string;
	basePrice: number;
	minOrderQuantity: number;
	discountStart: number | null;
	discountEnd: number | null;
	discountPercentage: number | null;
	pricingType: "flat" | "square-feet";
	isActive: boolean;
	categoryId: number | null;
	attributes: ProductAttribute[];
	variations: Variation[];
	variants: ProductVariant[];
	images: ProductImage[];
	tags: ProductTag[];
	reviews: ProductReview[];
	createdAt: Date;
	updatedAt: Date;
}

export interface ProductModelCreationAttributes {
	name: string;
	description: string;
	slug: string;
	sku: string;
	basePrice: number;
	minOrderQuantity: number;
	discountStart: number | null;
	discountEnd: number | null;
	discountPercentage: number | null;
	pricingType: "flat" | "square-feet";
	isActive: boolean;
	categoryId: number | null;
}

@Table({ tableName: "Products", timestamps: true })
export default class Product extends Model<
	ProductModelAttributes,
	ProductModelCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare productId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare name: string;

	@Column({ type: DataType.TEXT, allowNull: false })
	declare description: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare slug: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare sku: string;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
	declare basePrice: number;

	@Column({ type: DataType.INTEGER, allowNull: false })
	declare minOrderQuantity: number;

	@Column({ type: DataType.INTEGER, allowNull: true })
	declare discountStart: number;

	@Column({ type: DataType.INTEGER, allowNull: true })
	declare discountEnd: number;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
	declare discountPercentage: number;

	@Column({ type: DataType.ENUM("flat", "square-feet"), allowNull: false })
	declare pricingType: number;

	@Column({ type: DataType.BOOLEAN, defaultValue: true })
	declare isActive: boolean;

	@ForeignKey(() => ProductCategory)
	@Column({ type: DataType.INTEGER, allowNull: true })
	declare categoryId: number | null;

	@BelongsTo(() => ProductCategory)
	declare category?: ProductCategory;

	@HasMany(() => ProductAttribute, { as: "attributes" })
	declare attributes: ProductAttribute[];

	@HasMany(() => Variation, { as: "variations" })
	declare variations: Variation[];

	@HasMany(() => ProductVariant, { as: "variants" })
	declare variants: ProductVariant[];

	@HasMany(() => ProductImage, { as: "images" })
	declare images: ProductImage[];

	@HasMany(() => ProductTag, { as: "tags" })
	declare tags: ProductTag[];

	@HasMany(() => ProductReview, { as: "reviews" })
	declare reviews: ProductReview[];

	@HasMany(() => OrderItem)
	declare orderItems: OrderItem[];
}
