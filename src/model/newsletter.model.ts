import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
} from "sequelize-typescript";

export interface NewsletterAttributes {
	newsletterId: number;
	email: string;
	verified: boolean;
	verificationToken: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface NewsletterCreationAttributes {
	email: string;
	verified: boolean;
	verificationToken: string;
}

@Table({
	tableName: "Newsletters",
	timestamps: true,
})
export default class Newsletter extends Model<
	NewsletterAttributes,
	NewsletterCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare newsletterId: number;

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	declare email: string;

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
	})
	declare verified: boolean;

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	declare verificationToken: string;
}
