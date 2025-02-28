const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateToken = (user) => {
	return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
		expiresIn: "30d",
	});
};

exports.register = async (req, res) => {
	try {
		const { name, email, password } = req.body;

		// Validate required fields
		if (!name || !email || !password) {
			return res
				.status(400)
				.json({ message: "Please provide all required fields" });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res
				.status(400)
				.json({ message: "Please provide a valid email address" });
		}

		// Check if user exists
		const userExists = await User.findOne({ email });
		if (userExists) {
			return res.status(400).json({ message: "User already exists" });
		}

		// Hash password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Create user with default role
		const user = await User.create({
			name,
			email,
			password: hashedPassword,
			roles: ["customer"], // Default role
		});

		if (!user) {
			throw new Error("Failed to create user");
		}

		res.status(201).json({
			message: "Registration successful",
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				roles: user.roles,
			},
		});
	} catch (error) {
		console.error("Registration error details:", error);
		res.status(500).json({
			message: "Registration failed",
			error: error.message,
		});
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password, selectedRole } = req.body;

		// Check user exists
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		// Verify password
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		// Add new role if it doesn't exist
		if (!user.roles.includes(selectedRole)) {
			user.roles.push(selectedRole);
			await user.save();
		}

		// Generate token with selected role
		const token = jwt.sign(
			{
				id: user._id,
				role: selectedRole,
			},
			process.env.JWT_SECRET,
			{
				expiresIn: "30d",
			}
		);

		res.json({
			success: true,
			token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: selectedRole,
				roles: user.roles,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ message: "Server error" });
	}
};
