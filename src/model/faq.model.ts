import {
	Table,
	Column,
	Model,
	PrimaryKey,
	AutoIncrement,
	DataType,
	HasMany,
} from "sequelize-typescript";
import FaqItem from "../model/faq-item.model";

export interface FaqAttributes {
	faqId: number;
	faqTitle: string;
	faqItems: FaqItem[];
	createdAt: Date;
	updatedAt: Date;
}

export interface FaqCreationAttributes {
	faqTitle: string;
}

@Table({ tableName: "Faqs", timestamps: true })
export default class Faq extends Model<FaqAttributes, FaqCreationAttributes> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare faqId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare faqTitle: string;

	@HasMany(() => FaqItem, { as: "faqItems" })
	declare faqItems: FaqItem[];
}
