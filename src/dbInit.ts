import "colors";
import { Sequelize } from "sequelize-typescript";
import { dbName, dbUser, dbPassword } from "./config/dotenv.config";

const sequelize = new Sequelize("", dbUser, dbPassword, {
	host: "localhost",
	dialect: "mysql",
	logging: false,
});

(async () => {
	try {
		// Check if the database exists
		const dbExistQueryResult: [any[], any] = await sequelize.query(
			`SHOW DATABASES LIKE '${dbName}'`,
		);

		try {
			if (dbExistQueryResult[0].length === 0) {
				// Create the database if it does not exist
				await sequelize.query(`CREATE DATABASE ${dbName}`);
				
			} else {
				
			}

			// Close the Sequelize connection
			await sequelize.close();
		} catch (err: any) {
			
		}
	} catch (err: any) {
		
	}
})();
