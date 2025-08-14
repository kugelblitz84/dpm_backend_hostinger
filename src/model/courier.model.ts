import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
	HasMany,
} from "sequelize-typescript";
import Order from "./order.model";

export interface CourierAttributes {
	courierId: number;
	name: string;
	orders: Order[];
	createdAt: Date;
	updatedAt: Date;
}

export interface CourierCreationAttributes {
	name: string;
}

@Table({
	tableName: "Couriers",
	timestamps: true,
})
export default class Courier extends Model<
	CourierAttributes,
	CourierCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare courierId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare name: string;

	@HasMany(() => Order)
	declare orders: Order[];
}
