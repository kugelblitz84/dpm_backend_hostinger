import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
} from "sequelize-typescript";

export interface ClientAttributes {
	clientId: number;
	type: string;
	clientLogos: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface ClientCreationAttributes {
	type: string;
	clientLogos: string[];
}

@Table({
	tableName: "Clients",
	timestamps: true,
})
export default class Client extends Model<
	ClientAttributes,
	ClientCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare clientId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare type: string;

	@Column({ type: DataType.JSON, allowNull: false })
	declare clientLogos: string[];
}
