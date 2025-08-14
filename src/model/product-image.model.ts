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

export interface ProductImageAttributes {
	imageId: number;
	imageName: string;
	productId: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface ProductImageCreationAttributes {
	imageName: string;
	productId: number;
}

@Table({
	tableName: "ProductImages",
	timestamps: true,
})
export default class ProductImage extends Model<
	ProductImageAttributes,
	ProductImageCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare imageId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare imageName: string;

	@ForeignKey(() => Product)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare productId: number;

	@BelongsTo(() => Product)
	declare product?: Product;
}
