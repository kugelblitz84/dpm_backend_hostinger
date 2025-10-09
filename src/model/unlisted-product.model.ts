import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
	HasMany,
} from "sequelize-typescript";
import OrderItem from "./order-item.model";

export interface UnlistedProductModelAttributes {
	unlistedProductId: number;
	name: string;
	description: string;
	basePrice: number;
	pricingType: "flat" | "square-feet";
	createdAt: Date;
	updatedAt: Date;
}

export interface UnlistedProductModelCreationAttributes {
	name: string;
	description: string;
	basePrice: number;
	pricingType: "flat" | "square-feet";
}

@Table({ tableName: "UnlistedProducts", timestamps: true })
export default class UnlistedProduct extends Model<
	UnlistedProductModelAttributes,
	UnlistedProductModelCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare unlistedProductId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare name: string;

	@Column({ type: DataType.TEXT, allowNull: false })
	declare description: string;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
	declare basePrice: number;

	@Column({ type: DataType.ENUM("flat", "square-feet"), allowNull: false })
	declare pricingType: "flat" | "square-feet";

	@HasMany(() => OrderItem)
	declare orderItems: OrderItem[];
}
