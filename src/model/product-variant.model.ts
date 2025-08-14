import {
	Table,
	Column,
	Model,
	ForeignKey,
	BelongsTo,
	HasMany,
	PrimaryKey,
	AutoIncrement,
	DataType,
} from "sequelize-typescript";
import Product from "../model/product.model";
import ProductVariantDetail from "../model/product-variant-detail.model";
import OrderItem from "./order-item.model";

export interface ProductVariantAttributes {
	productVariantId: number;
	productId: number;
	additionalPrice: number;
	variantDetails: ProductVariantDetail[];
	createdAt: Date;
	updatedAt: Date;
}

export interface ProductVariantCreationAttributes {
	productId: number;
	additionalPrice: number;
}

@Table({ tableName: "ProductVariants" })
export default class ProductVariant extends Model<
	ProductVariantAttributes,
	ProductVariantCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare productVariantId: number;

	@ForeignKey(() => Product)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare productId: number;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
	declare additionalPrice: number;

	@HasMany(() => ProductVariantDetail, { as: "variantDetails" })
	declare variantDetails: ProductVariantDetail[];

	@BelongsTo(() => Product)
	declare product: Product;

	@HasMany(() => OrderItem)
	declare orderItems: OrderItem[];
}
