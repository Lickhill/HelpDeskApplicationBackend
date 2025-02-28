const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
			trim: true,
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: [true, "Password is required"],
		},
		roles: {
			type: [String],
			enum: ["customer", "agent", "admin"],
			default: ["customer"],
			validate: {
				validator: function (roles) {
					return roles.length > 0; // At least one role is required
				},
				message: "User must have at least one role",
			},
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("User", userSchema);
