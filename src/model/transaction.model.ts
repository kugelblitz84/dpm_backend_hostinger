import {
	AutoIncrement,
	Column,
	DataType,
	ForeignKey,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";
import Order from "./order.model";

export interface TransactionAttributes {
	id: number;
	transactionId: string;
	orderId: number;
	valId: string;
	amount: string;
	storeAmount: string;
	cardType: string;
	bankTransactionId: string;
	status: string;
	transactionDate: Date;
	currency: string;
	cardIssuer: string;
	cardBrand: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface TransactionCreationAttributes {
	transactionId: string;
	orderId: number;
	valId: string;
	amount: string;
	storeAmount: string;
	cardType: string;
	bankTransactionId: string;
	status: string;
	transactionDate: Date;
	currency: string;
	cardIssuer: string;
	cardBrand: string;
}

@Table({ tableName: "Transactions", timestamps: true })
export default class Transaction extends Model<
	TransactionAttributes,
	TransactionCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare id: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare transactionId: string;

	@ForeignKey(() => Order)
	@Column({ type: DataType.INTEGER, allowNull: true, onDelete: "SET NULL" })
	declare orderId?: number | null;

	@Column({ type: DataType.STRING, allowNull: false })
	declare valId: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare amount: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare storeAmount: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare cardType: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare bankTransactionId: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare status: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare transactionDate: Date;

	@Column({ type: DataType.STRING, allowNull: false })
	declare currency: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare cardIssuer: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare cardBrand: string;
}
