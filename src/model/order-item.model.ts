import {
	Table,
	Column,
	Model,
	PrimaryKey,
	AutoIncrement,
	ForeignKey,
	BelongsTo,
	DataType,
} from "sequelize-typescript";
import Order from "../model/order.model";
import Product from "../model/product.model";
import ProductVariant from "./product-variant.model";
import UnlistedProduct from "./unlisted-product.model";

export interface OrderItemAttributes {
	orderItemId: number;
	orderId: number;
	productId: number | null;
	unlistedProductId: number | null;
	productVariantId: number | null;
	// Pricing breakdown fields
	unitPrice: number | null; // base price for the product (per item), nullable for legacy data
	additionalPrice: number | null; // extra from variant or custom add-on
	discountPercentage: number | null; // percentage [0-100]
	designCharge: number | null; // per-item design charge
	quantity: number;
	size: number | null;
	widthInch: number | null;
	heightInch: number | null;
	price: number;
	createdAt: Date;
	deletedAt: Date;
}

export interface OrderItemCreationAttributes {
	orderId: number;
	productId?: number;
	unlistedProductId?: number;
	productVariantId?: number;
	unitPrice?: number | null;
	additionalPrice?: number | null;
	discountPercentage?: number | null;
	designCharge?: number | null;
	quantity: number;
	size: number | null;
	widthInch: number | null;
	heightInch: number | null;
	price: number;
}

@Table({ tableName: "OrderItems", timestamps: true })
export default class OrderItem extends Model<
	OrderItemAttributes,
	OrderItemCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare orderItemId: number;

	@ForeignKey(() => Order)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare orderId: number;

	@ForeignKey(() => Product)
	@Column({ type: DataType.INTEGER, allowNull: true })
	declare productId: number | null;

	@ForeignKey(() => UnlistedProduct)
	@Column({ type: DataType.INTEGER, allowNull: true })
	declare unlistedProductId: number | null;

	@ForeignKey(() => ProductVariant)
	@Column({ type: DataType.INTEGER, allowNull: true })
	declare productVariantId: number | null;

	// Pricing breakdown fields
	@Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
	declare unitPrice: number | null;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: true, defaultValue: 0 })
	declare additionalPrice: number | null;

	@Column({ type: DataType.DECIMAL(5, 2), allowNull: true, defaultValue: 0 })
	declare discountPercentage: number | null;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: true, defaultValue: 0 })
	declare designCharge: number | null;

	@Column({ type: DataType.INTEGER, allowNull: false })
	declare quantity: number;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
	declare size: number;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
	declare widthInch: number | null;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
	declare heightInch: number | null;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
	declare price: number;

	@BelongsTo(() => Order)
	declare order: Order;

	@BelongsTo(() => Product)
	declare product: Product;

	@BelongsTo(() => UnlistedProduct)
	declare unlistedProduct: UnlistedProduct;

	@BelongsTo(() => ProductVariant)
	declare productVariant: ProductVariant;
}
