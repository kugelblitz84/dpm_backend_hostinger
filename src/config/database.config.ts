import { Sequelize } from "sequelize-typescript";
import { dbConnectionString } from "./dotenv.config";
import path from "path";

// Debug log the connection string being used

export const sequelize = new Sequelize(dbConnectionString, {
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
		console.error("Database connection failed:", err);
	}
};

// Install cross-env for environment variable management
// npm install --save-dev cross-env
