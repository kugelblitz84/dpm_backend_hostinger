const fs = require("fs");
const path = require("path");

// Function to clean debug statements from a file
function cleanDebugStatements(filePath) {
	try {
		let content = fs.readFileSync(filePath, "utf8");

		// Remove console.log, console.error, console.debug, console.info, console.warn statements
		// This regex handles multi-line console statements
		content = content.replace(
			/console\.(log|error|debug|info|warn)\s*\([^)]*(?:\([^)]*\)[^)]*)*\)\s*;?/g,
			"",
		);

		// Remove debugger statements
		content = content.replace(/debugger\s*;?/g, "");

		// Remove debugLog function calls
		content = content.replace(
			/debugLog\s*\([^)]*(?:\([^)]*\)[^)]*)*\)\s*;?/g,
			"",
		);

		// Clean up multiple empty lines
		content = content.replace(/\n\s*\n\s*\n/g, "\n\n");

		// Write back to file
		fs.writeFileSync(filePath, content, "utf8");
		console.log(`Cleaned: ${filePath}`);
	} catch (error) {
		console.error(`Error cleaning ${filePath}:`, error.message);
	}
}

// Function to recursively find TypeScript files
function findTsFiles(dir, files = []) {
	const items = fs.readdirSync(dir);

	for (const item of items) {
		const fullPath = path.join(dir, item);
		const stat = fs.statSync(fullPath);

		if (
			stat.isDirectory() &&
			!item.startsWith(".") &&
			item !== "node_modules"
		) {
			findTsFiles(fullPath, files);
		} else if (item.endsWith(".ts")) {
			files.push(fullPath);
		}
	}

	return files;
}

// Main execution
const srcDir = path.join(__dirname, "src");
const tsFiles = findTsFiles(srcDir);

console.log(`Found ${tsFiles.length} TypeScript files`);

tsFiles.forEach(cleanDebugStatements);

console.log("Debug cleanup complete!");
