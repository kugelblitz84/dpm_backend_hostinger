import {
	Table,
	Column,
	Model,
	PrimaryKey,
	AutoIncrement,
	DataType,
	ForeignKey,
	BelongsTo,
} from "sequelize-typescript";

import Faq from "../model/faq.model";

export interface FaqItemAttributes {
	faqItemId: number;
	question: string;
	answer: string;
	faqId: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface FaqItemCreationAttributes {
	faqId: number;
	question: string;
	answer: string;
}

@Table({ tableName: "FaqItems", timestamps: true })
export default class FaqItem extends Model<
	FaqItemAttributes,
	FaqItemCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare faqItemId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare question: string;

	@Column({ type: DataType.TEXT, allowNull: false })
	declare answer: string;

	@ForeignKey(() => Faq)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare faqId: number;

	@BelongsTo(() => Faq)
	declare faq?: Faq;
}
