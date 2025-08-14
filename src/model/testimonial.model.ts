import {
	Table,
	Column,
	Model,
	PrimaryKey,
	AutoIncrement,
	DataType,
} from "sequelize-typescript";

export interface TestimonialAttributes {
	testimonialId: number;
	title: string;
	description: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface TestimonialCreationAttributes {
	title: string;
	description: string;
}

@Table({
	tableName: "Testimonials",
	timestamps: true,
})
export default class Testimonial extends Model<
	TestimonialAttributes,
	TestimonialCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare testimonialId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare title: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare description: string;
}
