const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
	try {
		let token;

		// Get token from Authorization header
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];
		}

		// Check if token exists
		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Not authorized to access this route",
			});
		}

		try {
			// Verify token
			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			// Get user from token
			const user = await User.findById(decoded.id);

			if (!user) {
				return res.status(401).json({
					success: false,
					message: "User not found",
				});
			}

			// Make sure to set both user and role
			req.user = user;
			req.user.role = decoded.role || user.roles[0]; // Use role from token or first role from user

			next();
		} catch (err) {
			return res.status(401).json({
				success: false,
				message: "Token is not valid",
			});
		}
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Server Error",
		});
	}
};

// Middleware to restrict access based on roles
exports.authorize = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				message: `User role ${req.user.role} is not authorized to access this route`,
			});
		}
		next();
	};
};
