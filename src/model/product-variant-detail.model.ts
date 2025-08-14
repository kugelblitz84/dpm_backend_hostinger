import {
	Table,
	Column,
	Model,
	ForeignKey,
	BelongsTo,
	PrimaryKey,
	AutoIncrement,
	DataType,
} from "sequelize-typescript";
import ProductVariant from "../model/product-variant.model";
import VariationItem from "../model/variation-item.model";

export interface ProductVariantDetailAttributes {
	productVariantDetailId: number;
	productVariantId: number;
	variationItemId: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface ProductVariantDetailCreationAttributes {
	productVariantId: number;
	variationItemId: number;
}

@Table({ tableName: "ProductVariantDetails" })
export default class ProductVariantDetail extends Model<
	ProductVariantDetailAttributes,
	ProductVariantDetailCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare productVariantDetailId: number;

	@ForeignKey(() => ProductVariant)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare productVariantId: number;

	@ForeignKey(() => VariationItem)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare variationItemId: number;

	@BelongsTo(() => VariationItem)
	declare variationItem: VariationItem;

	@BelongsTo(() => ProductVariant)
	declare productVariant: ProductVariant;
}
