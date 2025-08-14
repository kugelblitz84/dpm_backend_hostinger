import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
} from "sequelize-typescript";

export interface MediaAttributes {
	imageId: number;
	imageName: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface MediaCreationAttributes {
	imageName: string;
}

@Table({
	tableName: "Medias",
	timestamps: true,
})
export default class Media extends Model<
	MediaAttributes,
	MediaCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare imageId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare imageName: string;
}
