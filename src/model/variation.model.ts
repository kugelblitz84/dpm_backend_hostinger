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
import VariationItem from "../model/variation-item.model";
import Product from "../model/product.model";

export interface VariationAttributes {
	variationId: number;
	productId: number;
	name: string;
	unit: string;
	variationItems: VariationItem[];
	createdAt: Date;
	updatedAt: Date;
}

export interface VariationCreationAttributes {
	productId: number;
	name: string;
	unit: string;
}

@Table({ tableName: "Variations" })
export default class Variation extends Model<
	VariationAttributes,
	VariationCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare variationId: number;

	@ForeignKey(() => Product)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare productId: number;

	@BelongsTo(() => Product)
	declare product: Product;

	@Column({ type: DataType.STRING, allowNull: false })
	declare name: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare unit: string;

	@HasMany(() => VariationItem, { as: "variationItems" })
	declare variationItems: VariationItem[];
}
