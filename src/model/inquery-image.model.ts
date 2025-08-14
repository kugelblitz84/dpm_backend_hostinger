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
import Inquery from "../model/inquery.model";

export interface InqueryImageAttributes {
	imageId: number;
	imageName: string;
	inqueryId: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface InqueryImageCreationAttributes {
	imageName: string;
	inqueryId: number;
}

@Table({
	tableName: "InqueryImages",
	timestamps: true,
})
export default class InqueryImage extends Model<
	InqueryImageAttributes,
	InqueryImageCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare imageId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare imageName: string;

	@ForeignKey(() => Inquery)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare inqueryId: number;

	@BelongsTo(() => Inquery)
	declare inquery?: Inquery;
}
