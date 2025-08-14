// Quick deployment verification script
// Add this temporary endpoint to verify your changes are deployed

const express = require("express");
const router = express.Router();

// Add this to your routes to check if latest code is deployed
router.get("/deployment-check", (req, res) => {
	res.json({
		message: "Latest changes deployed successfully!",
		timestamp: new Date().toISOString(),
		changes: [
			"Removed role-based filtering for orders",
			"All users can now see all orders",
			"Added multiple staffId filter removal safeguards",
			"Enhanced debug logging added",
		],
		version: "2025-01-27-role-fix",
	});
});

module.exports = router;
