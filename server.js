const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		origin:
			process.env.NODE_ENV === "production"
				? [process.env.FRONTEND_URL, /\.vercel\.app$/] // Allow all Vercel domains in production
				: "http://localhost:5173",
		credentials: true,
	})
);

// Routes
const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/tickets");
const dashboardRoutes = require("./routes/dashboard");

// Connect to database with retry logic
const startServer = async () => {
	try {
		await connectDB();

		app.use("/api/auth", authRoutes);
		app.use("/api/tickets", ticketRoutes);
		app.use("/api/dashboard", dashboardRoutes);

		// Error handling middleware
		app.use((err, req, res, next) => {
			console.error("Error:", err);
			res.status(500).json({
				success: false,
				message: "Server error",
				error: err.message,
				stack:
					process.env.NODE_ENV === "development"
						? err.stack
						: undefined,
			});
		});

		const PORT = process.env.PORT || 5000;
		app.listen(PORT, () => {
			console.log(
				`Server running in ${
					process.env.NODE_ENV || "development"
				} mode on port ${PORT}`
			);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
};

startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
	console.error("Unhandled Promise Rejection:", err);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	process.exit(1);
});
