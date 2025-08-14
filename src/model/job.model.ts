import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
} from "sequelize-typescript";

export interface JobAttributes {
	jobId: number;
	title: string;
	content: string;
	jobLocation: string;
	applicationUrl: string;
	status: "open" | "closed";
	createdAt: Date;
	updatedAt: Date;
}

export interface JobCreationAttributes {
	title: string;
	content: string;
	jobLocation: string;
	applicationUrl: string;
	status: "open" | "closed";
}

@Table({
	tableName: "Jobs",
	timestamps: true,
})
export default class Job extends Model<JobAttributes, JobCreationAttributes> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare jobId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare title: string;

	@Column({ type: DataType.TEXT, allowNull: false })
	declare content: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare jobLocation: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare applicationUrl: string;

	@Column({
		type: DataType.ENUM,
		values: ["open", "closed"],
		allowNull: false,
	})
	declare status: "open" | "closed";
}
