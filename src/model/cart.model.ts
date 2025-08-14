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
import Customer from "./customer.model";
import Product from "./product.model";
import ProductVariant from "./product-variant.model";

export interface CartItemAttributes {
	cartItemId: number;
	customerId: number;
	productId: number;
	productVariantId: number;
	price: number;
	quantity: number;
	size: number | null;
	widthInch: number | null;
	heightInch: number | null;
	createdAt: Date;
	deletedAt: Date;
}

export interface CartItemCreationAttributes {
	customerId: number;
	productId: number;
	productVariantId: number;
	price: number;
	quantity: number;
	size: number | null;
	widthInch: number | null;
	heightInch: number | null;
}

@Table({ tableName: "CartItems", timestamps: true })
export default class CartItem extends Model<
	CartItemAttributes,
	CartItemCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare cartItemId: number;

	@ForeignKey(() => Customer)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare customerId: number;

	@ForeignKey(() => Product)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare productId: number;

	@ForeignKey(() => ProductVariant)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare productVariantId: number;

	@Column({ type: DataType.INTEGER, allowNull: false })
	declare quantity: number;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
	declare size: number;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
	declare widthInch: number;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
	declare heightInch: number;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
	declare price: number;

	@BelongsTo(() => Customer)
	declare customer: Customer;

	@BelongsTo(() => Product)
	declare product: Product;

	@BelongsTo(() => ProductVariant)
	declare productVariant: ProductVariant;
}
