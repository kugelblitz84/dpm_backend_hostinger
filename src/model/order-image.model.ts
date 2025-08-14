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
import Order from "./order.model";

export interface OrderImageAttributes {
	imageId: number;
	imageName: string;
	orderId: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface OrderImageCreationAttributes {
	imageName: string;
	orderId: number;
}

@Table({
	tableName: "OrderImages",
	timestamps: true,
})
export default class OrderImage extends Model<
	OrderImageAttributes,
	OrderImageCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare imageId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare imageName: string;

	@ForeignKey(() => Order)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare orderId: number;

	@BelongsTo(() => Order)
	declare order: Order;
}
