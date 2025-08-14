// Add this to your server.ts or app.ts to write console logs to file
import fs from "fs";
import path from "path";

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
	fs.mkdirSync(logsDir, { recursive: true });
}

// Override console.log to also write to file
const originalConsoleLog = console.log;
const logFile = path.join(
	logsDir,
	`app-${new Date().toISOString().split("T")[0]}.log`,
);

console.log = (...args) => {
	const timestamp = new Date().toISOString();
	const message = `[${timestamp}] ${args.join(" ")}\n`;

	// Write to file
	fs.appendFileSync(logFile, message);

	// Also log to console
	originalConsoleLog(...args);
};

