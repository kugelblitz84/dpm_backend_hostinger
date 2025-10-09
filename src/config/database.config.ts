import { Sequelize } from "sequelize-typescript";
import { dbConnectionString, dbHost, dbName, dbPassword, dbPort, dbUser, nodeEnv } from "./dotenv.config";
import path from "path";

// Build a connection string if not provided
let finalConnectionString = dbConnectionString?.trim();
if (!finalConnectionString) {
	if (!dbHost || !dbName || !dbUser) {
		const missing = [
			!dbHost && "DB_HOST",
			!dbName && "DB_NAME",
			!dbUser && "DB_USER",
		].filter(Boolean).join(", ");
		throw new Error(`Database configuration missing (${nodeEnv}): ${missing}. Either set ${nodeEnv === "production" ? "PRODUCTION_DB_CONNECTION_STRING" : "DEVELOPMENT_DB_CONNECTION_STRING"} or the discrete vars (${nodeEnv === "production" ? "PRODUCTION_DB_HOST/PORT/NAME/USER/PASSWORD" : "DEVELOPMENT_DB_HOST/PORT/NAME/USER/PASSWORD"}).`);
	}
	const userEnc = encodeURIComponent(dbUser);
	const passEnc = encodeURIComponent(dbPassword || "");
	finalConnectionString = `mysql://${userEnc}:${passEnc}@${dbHost}:${dbPort || 3306}/${dbName}`;
}

export const sequelize = new Sequelize(finalConnectionString, {
	dialect: "mysql",
	logging: true, // Enable SQL query logging temporarily
	pool: {
		max: 10,
		min: 0,
		acquire: 30000,
		idle: 10000,
	},
	models: [path.resolve(__dirname, "../model")],
});

export const initializeDatabase = async () => {
	try {
		await sequelize.authenticate();
		console.log("Database connection established successfully.");
		// Ensure Staff.role ENUM includes 'offline-agent' BEFORE syncing models (so inserts won't fail)
		try {
			const [rows]: any = await sequelize.query("SHOW COLUMNS FROM `Staff` LIKE 'role';");
			const typeStr: string | undefined = rows?.[0]?.Type;
			if (typeStr && typeStr.toLowerCase().startsWith("enum(")) {
				const hasOfflineAgent = typeStr.includes("'offline-agent'");
				if (!hasOfflineAgent) {
					console.log("[DB] Patching Staff.role ENUM to include 'offline-agent'...");
					await sequelize.query(
						"ALTER TABLE `Staff` MODIFY `role` ENUM('agent','designer','offline-agent') NOT NULL DEFAULT 'agent';",
					);
					console.log("[DB] Staff.role ENUM patched successfully.");
				}
			}
		} catch (enumErr: any) {
			console.warn("[DB] Warning: failed to verify/patch Staff.role ENUM:", enumErr?.message || enumErr);
		}

		// Ensure OrderItems has pricing breakdown columns before syncing models
		try {
			const [cols]: any = await sequelize.query("SHOW COLUMNS FROM `OrderItems`;");
			const existing = new Set<string>((cols || []).map((c: any) => c.Field));
			const toAdd: string[] = [];
			if (!existing.has("unitPrice")) {
				toAdd.push("ADD COLUMN `unitPrice` DECIMAL(10,2) NULL");
			}
			if (!existing.has("additionalPrice")) {
				toAdd.push("ADD COLUMN `additionalPrice` DECIMAL(10,2) NULL DEFAULT 0");
			}
			if (!existing.has("discountPercentage")) {
				toAdd.push("ADD COLUMN `discountPercentage` DECIMAL(5,2) NULL DEFAULT 0");
			}
			if (!existing.has("designCharge")) {
				toAdd.push("ADD COLUMN `designCharge` DECIMAL(10,2) NULL DEFAULT 0");
			}
			if (toAdd.length > 0) {
				console.log("[DB] Patching OrderItems columns:", toAdd.join(", "));
				await sequelize.query(`ALTER TABLE \`OrderItems\` ${toAdd.join(", ")};`);
				console.log("[DB] OrderItems columns patched successfully.");
			}
		} catch (colErr: any) {
			console.warn("[DB] Warning: failed to verify/patch OrderItems columns:", colErr?.message || colErr);
		}

		// Sync models after ensuring schema
		await sequelize.sync({ alter: true });
		
	} catch (err: any) {
		console.error("Database connection failed:", err?.message || err);
	}
};

// Install cross-env for environment variable management
// npm install --save-dev cross-env
