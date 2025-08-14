import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
} from "sequelize-typescript";

export interface BlogAttributes {
	blogId: number;
	title: string;
	content: string;
	bannerImg: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface BlogCreationAttributes {
	title: string;
	content: string;
	bannerImg: string;
}

@Table({
	tableName: "Blogs",
	timestamps: true,
})
export default class Blog extends Model<
	BlogAttributes,
	BlogCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare blogId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare title: string;

	@Column({ type: DataType.TEXT, allowNull: false })
	declare content: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare bannerImg: string;
}
