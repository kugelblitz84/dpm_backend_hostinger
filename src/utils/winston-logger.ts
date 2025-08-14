import winston from "winston";
import path from "path";

// Create Winston logger
const logger = winston.createLogger({
	level: "info",
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.errors({ stack: true }),
		winston.format.json(),
	),
	defaultMeta: { service: "dpm-api" },
	transports: [
		// Write all logs to console
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple(),
			),
		}),
		// Write all logs to file
		new winston.transports.File({
			filename: path.join(__dirname, "../../logs/app.log"),
			maxsize: 5242880, // 5MB
			maxFiles: 5,
		}),
		// Write error logs to separate file
		new winston.transports.File({
			filename: path.join(__dirname, "../../logs/error.log"),
			level: "error",
			maxsize: 5242880,
			maxFiles: 5,
		}),
	],
});

export default logger;
