import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
	ForeignKey,
	BelongsTo,
} from "sequelize-typescript";
import Product from "../model/product.model";

export interface ProductTagAttributes {
	tagId: number;
	tag: string;
	productId: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface ProductTagCreationAttributes {
	tag: string;
	productId: number;
}

@Table({
	tableName: "ProductTags",
	timestamps: true,
})
export default class ProductTag extends Model<
	ProductTagAttributes,
	ProductTagCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare tagId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare tag: string;

	@ForeignKey(() => Product)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare productId: number;

	@BelongsTo(() => Product)
	declare product?: Product;
}
