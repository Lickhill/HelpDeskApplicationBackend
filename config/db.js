const mongoose = require("mongoose");

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGODB_URI, {
			ssl: true,
			retryWrites: true,
			w: "majority",
		});
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.error("MongoDB connection error:", error);
		// Don't exit the process, let nodemon handle restart
		throw error;
	}
};

module.exports = connectDB;
