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
		// Sync models after database creation
		await sequelize.sync({ alter: true });
		
	} catch (err: any) {
		console.error("Database connection failed:", err?.message || err);
	}
};

// Install cross-env for environment variable management
// npm install --save-dev cross-env
