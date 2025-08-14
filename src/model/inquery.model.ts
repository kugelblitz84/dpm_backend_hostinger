import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
	HasMany,
} from "sequelize-typescript";
import InqueryImage from "../model/inquery-image.model";

export interface InqueryAttributes {
	inqueryId: number;
	name: string;
	email: string;
	phone: string;
	company: string;
	inqueryType: string;
	message: string;
	status: "open" | "closed";
	images: InqueryImage[];
	createdAt: Date;
	updatedAt: Date;
}

export interface InqueryCreationAttributes {
	name: string;
	email: string;
	phone: string;
	company: string;
	inqueryType: string;
	message: string;
	status: "open" | "closed";
}

@Table({ tableName: "Inqueries", timestamps: true })
export default class Inquery extends Model<
	InqueryAttributes,
	InqueryCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare inqueryId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare name: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare email: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare phone: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare company: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare inqueryType: string;

	@Column({ type: DataType.TEXT, allowNull: false })
	declare message: string;

	@Column({ type: DataType.ENUM("open", "closed"), allowNull: false })
	declare status: "open" | "closed";

	@HasMany(() => InqueryImage, { as: "images" })
	declare images: InqueryImage[];
}
