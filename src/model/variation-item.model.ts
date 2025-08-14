import {
	Table,
	Column,
	Model,
	ForeignKey,
	BelongsTo,
	PrimaryKey,
	AutoIncrement,
	DataType,
} from "sequelize-typescript";
import Variation from "../model/variation.model";

export interface VariationItemAttributes {
	variationItemId: number;
	variationId: number;
	value: string;
	createdAt: Date;
	deletedAt: Date;
}

export interface VariationItemCreationAttributes {
	variationId: number;
	value: string;
}

@Table({ tableName: "VariationItems" })
export default class VariationItem extends Model<
	VariationItemAttributes,
	VariationItemCreationAttributes
> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare variationItemId: number;

	@ForeignKey(() => Variation)
	@Column({ type: DataType.INTEGER, allowNull: false })
	declare variationId: number;

	@Column({ type: DataType.STRING, allowNull: false })
	declare value: string;

	@BelongsTo(() => Variation)
	declare variation: Variation;
}
