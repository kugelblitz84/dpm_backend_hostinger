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
import Order from "./order.model";

export interface PaymentAttributes {
	paymentId: number;
	transactionId: string;
	orderId: number;
	amount: number;
	paymentMethod: "cod-payment" | "online-payment";
	paymentLink: string | null;
	isPaid: boolean;
	createdAt: Date;
	deletedAt: Date;
}

export interface PaymentCreationAttributes {
	transactionId: string;
	orderId: number;
	amount: number;
	paymentMethod: "cod-payment" | "online-payment";
	paymentLink: string | null;
	isPaid: boolean;
}

@Table({ tableName: "Payments", timestamps: true })
export default class Payment extends Model<
	PaymentAttributes,
	PaymentCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare paymentId: number;

	@Column({ type: DataType.STRING, allowNull: true, unique: true })
	declare transactionId: string;

	@ForeignKey(() => Order)
	@Column(DataType.INTEGER)
	declare orderId: number;

	@Column(DataType.ENUM("cod-payment", "online-payment"))
	declare paymentMethod: "cod-payment" | "online-payment";

	@Column({ type: DataType.INTEGER, allowNull: false })
	declare amount: number;

	@Column({ type: DataType.STRING, allowNull: true })
	declare paymentLink: string;

	@Column({ type: DataType.BOOLEAN, allowNull: false })
	declare isPaid: boolean;

	@BelongsTo(() => Order)
	declare order: Order;
}
