import {
	Table,
	Column,
	Model,
	PrimaryKey,
	AutoIncrement,
	DataType,
	AllowNull,
} from "sequelize-typescript";

export interface AuditLogAttributes {
	auditId: number;
	auditedById: number;
	action: string;
	details: string;
	createdAt: Date;
	updatedAt: Date;
}

@Table({
	tableName: "AuditLogs",
	timestamps: true,
})
export default class AuditLog extends Model<AuditLogAttributes> {
	@PrimaryKey
	@AutoIncrement
	@Column({ type: DataType.INTEGER })
	declare auditId: number;

	@AllowNull(false)
	@Column({ type: DataType.INTEGER })
	declare auditedById: number;

	@AllowNull(false)
	@Column({ type: DataType.STRING })
	declare action: string;

	@AllowNull(false)
	@Column({ type: DataType.TEXT })
	declare details: string;
}
