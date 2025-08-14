import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
	Default,
} from "sequelize-typescript";

export interface AdminAttributes {
	adminId: number;
	name: string;
	email: string;
	phone: string;
	password: string;
	avatar: string;
	tokenVersion: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface AdminCreationAttributes {
	name: string;
	email: string;
	phone: string;
	password: string;
}

@Table({
	tableName: "Admins",
	timestamps: true,
})
export default class Admin extends Model<
	AdminAttributes,
	AdminCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare adminId: number;

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

	@Default("null")
	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	declare avatar: string;

	@Default(0)
	@Column(DataType.INTEGER)
	declare tokenVersion: number;
}
