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

export interface CouponAttributes {
	couponId: number;
	name: string;
	code: string;
	discountType: "flat" | "percentage";
	amount: number;
	minimumAmount: number;
	startDate: Date;
	endDate: Date;
	isActive: boolean;
	orders: Order[];
	createdAt: Date;
	updatedAt: Date;
}

export interface CopuonCreationAttributes {
	name: string;
	code: string;
	discountType: "flat" | "percentage";
	amount: number;
	minimumAmount: number;
	startDate: Date;
	endDate: Date;
	isActive: boolean;
}

@Table({ tableName: "Coupons", timestamps: true })
export default class Coupon extends Model<
	CouponAttributes,
	CopuonCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare couponId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare name: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare code: string;

	@Column({
		type: DataType.ENUM("flat", "percentage"),
		defaultValue: "flat",
		allowNull: false,
	})
	declare discountType: "flat" | "percentage";

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
	declare amount: number;

	@Column({ type: DataType.INTEGER, allowNull: false })
	declare minimumAmount: number;

	@Column({ type: DataType.DATE, allowNull: false })
	declare startDate: Date;

	@Column({ type: DataType.DATE, allowNull: false })
	declare endDate: Date;

	@Column({ type: DataType.BOOLEAN, defaultValue: true })
	declare isActive: boolean;

	@HasMany(() => Order)
	declare orders: Order[];
}
