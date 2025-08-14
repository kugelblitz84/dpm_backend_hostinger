// Add this to your order routes temporarily
router.get(
	"/debug-info",
	authMiddleware.authenticate(["admin", "agent", "designer"]),
	(req, res) => {
		const debugInfo = {
			timestamp: new Date().toISOString(),
			userInfo: {
				role: req.staff?.role || req.admin?.role,
				staffId: req.staff?.staffId,
				isAdmin: !!req.admin,
				isStaff: !!req.staff,
				email: req.staff?.email || req.admin?.email,
			},
			environment: process.env.NODE_ENV,
			serverStatus: "Debug endpoint working",
			codeVersion: "2025-01-27-role-fix-with-logging",
		};

		res.json({
			success: true,
			debug: debugInfo,
		});
	},
);
