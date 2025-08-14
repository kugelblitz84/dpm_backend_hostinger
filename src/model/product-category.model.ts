import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
	Default,
	HasMany,
	ForeignKey,
	BelongsTo,
} from "sequelize-typescript";
import Product from "../model/product.model";

export interface ProductCategoryAttributes {
	categoryId: number;
	name: string;
	slug: string;
	parentCategoryId: number | null;
	parentCategory: ProductCategory | null;
	subCategories: ProductCategory[];
	products: Product[];
	createdAt: Date;
	updatedAt: Date;
}

export interface ProductCategoryCreationAttributes {
	name: string;
	slug: string;
	parentCategoryId: number | null;
}

@Table({ tableName: "ProductCategories", timestamps: true })
export default class ProductCategory extends Model<
	ProductCategoryAttributes,
	ProductCategoryCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare categoryId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare name: string;

	@Column({ type: DataType.STRING, allowNull: false, unique: true })
	declare slug: string;

	@ForeignKey(() => ProductCategory)
	@Default(null)
	@Column({ type: DataType.INTEGER, allowNull: true })
	declare parentCategoryId: number | null;

	@BelongsTo(() => ProductCategory, { as: "parentCategory" })
	declare parentCategory: ProductCategory;

	@HasMany(() => ProductCategory, {
		as: "subCategories",
		foreignKey: "parentCategoryId",
	})
	declare subCategories: ProductCategory[];

	@HasMany(() => Product)
	declare products: Product[];
}
