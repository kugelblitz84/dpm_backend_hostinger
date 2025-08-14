import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
	Default,
	HasMany,
} from "sequelize-typescript";
import Order from "../model/order.model";

export interface CustomerAttributes {
	customerId: number;
	name: string;
	email: string;
	password: string;
	phone: string;
	billingAddress: string;
	shippingAddress: string;
	verified: boolean;
	verificationToken: string;
	tokenVersion: number;
	orders: Order[];
	createdAt: Date;
	updatedAt: Date;
}

export interface CustomerCreationAttributes {
	name: string;
	email: string;
	password: string;
	phone: string;
	billingAddress: string;
	shippingAddress: string;
	verified: boolean;
	verificationToken: string;
}

@Table({
	tableName: "Customers",
	timestamps: true,
})
export default class Customer extends Model<
	CustomerAttributes,
	CustomerCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare customerId: number;

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	declare name: string;

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	declare email: string;

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	declare password: string;

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	declare phone: string;

	@Column({
		type: DataType.TEXT,
		allowNull: false,
	})
	declare billingAddress: string;

	@Column({
		type: DataType.TEXT,
		allowNull: false,
	})
	declare shippingAddress: string;

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
	})
	declare verified: boolean;

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	declare verificationToken: string;

	@Default(0)
	@Column(DataType.INTEGER)
	declare tokenVersion: number;

	@HasMany(() => Order, { onDelete: "SET NULL" })
	declare orders: Order[];
}
