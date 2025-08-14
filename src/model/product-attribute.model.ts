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

export interface ProductAttributeProps {
	attributeId: number;
	property: string;
	description: string;
	productId: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface ProductAttributeCreationProps {
	property: string;
	description: string;
	productId: number;
}

@Table({
	tableName: "ProductAttributes",
	timestamps: true,
})
export default class ProductAttribute extends Model<
	ProductAttributeProps,
	ProductAttributeCreationProps
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare attributeId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare property: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare description: string;

	@ForeignKey(() => Product)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare productId: number;

	@BelongsTo(() => Product)
	declare product?: Product;
}
