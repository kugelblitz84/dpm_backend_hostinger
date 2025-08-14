// Add this debug route to check current behavior
router.get(
	"/debug-orders",
	authMiddleware.authenticate(["admin", "agent", "designer"]),
	(req, res) => {
		res.json({
			userRole: req.staff?.role || req.admin?.role,
			userStaffId: req.staff?.staffId,
			userAdmin: !!req.admin,
			userStaff: !!req.staff,
			timestamp: new Date().toISOString(),
			environment: process.env.NODE_ENV,
			serverInfo: "Production debug endpoint",
		});
	},
);
