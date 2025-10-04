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

export interface StaffAttributes {
	staffId: number;
	name: string;
	email: string;
	phone: string;
	password: string;
	role: "agent" | "designer" | "offline-agent";
	commissionPercentage: number;
	designCharge: number | null;
	balance: number;
	avatar: string;
	tokenVersion: number;
	status: "online" | "offline";
	isDeleted: boolean;
	orders: Order[];
	createdAt: Date;
	updatedAt: Date;
}

export interface StaffCreationAttributes {
	name: string;
	email: string;
	phone: string;
	password: string;
	role: "agent" | "designer" | "offline-agent";
	commissionPercentage: number;
	designCharge: number | null;
	balance: number;
	isDeleted: boolean;
}

@Table({
	tableName: "Staff",
	timestamps: true,
})
export default class Staff extends Model<
	StaffAttributes,
	StaffCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare staffId: number;

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
	declare phone: string;

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	declare password: string;

	@Column({
		type: DataType.ENUM("agent", "designer", "offline-agent"), // Define ENUM values
		defaultValue: "agent",
		allowNull: false,
	})
	declare role: "agent" | "designer" | "offline-agent";

	@Column({
		type: DataType.INTEGER,
		allowNull: false,
	})
	declare commissionPercentage: number;

	@Column({
		type: DataType.INTEGER,
		allowNull: true,
	})
	declare designCharge: number;

	@Column({
		type: DataType.INTEGER,
		allowNull: false,
	})
	declare balance: number;

	@Default("null")
	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	declare avatar: string;

	@Default(0)
	@Column(DataType.INTEGER)
	declare tokenVersion: number;

	@Default("offline")
	@Column({
		type: DataType.ENUM("online", "offline"),
		allowNull: false,
	})
	declare status: "online" | "offline";

	@Default(false)
	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
	})
	declare isDeleted: boolean;

	@HasMany(() => Order)
	declare orders: Order[];
}
