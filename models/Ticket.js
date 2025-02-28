const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
	{
		text: {
			type: String,
			required: [true, "Note text is required"],
		},
		addedBy: {
			_id: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				required: true,
			},
			name: {
				type: String,
				required: true,
			},
			email: {
				type: String,
				required: true,
			},
			role: {
				type: String,
				required: true,
			},
		},
		addedAt: {
			type: Date,
			default: () => {
				const now = new Date();
				// Set seconds and milliseconds to 0
				now.setSeconds(0, 0);
				return now;
			},
			get: (date) => {
				if (!date) return null;
				return date.toISOString().slice(0, -5) + "Z"; // Remove seconds and milliseconds
			},
		},
		noteType: {
			type: String,
			enum: {
				values: ["customer", "admin", "agent"],
				message: "Invalid note type",
			},
			required: [true, "Note type is required"],
		},
	},
	{
		toJSON: { getters: true, virtuals: true },
		toObject: { getters: true, virtuals: true },
	}
);

const ticketSchema = new mongoose.Schema(
	{
		ticketId: {
			type: String,
			unique: true,
			required: true,
		},
		title: {
			type: String,
			required: [true, "Title is required"],
			trim: true,
		},
		status: {
			type: String,
			enum: ["Active", "Pending", "Closed", "Review"],
			default: "Active",
		},
		customer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		customerName: {
			type: String,
			required: true,
		},
		customerEmail: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: [true, "Description is required"],
		},
		notes: [noteSchema],
	},
	{
		timestamps: true,
	}
);

// Generate ticket ID before saving
ticketSchema.pre("save", async function (next) {
	if (!this.ticketId) {
		const count = await this.constructor.countDocuments();
		this.ticketId = `TKT${String(count + 1).padStart(5, "0")}`;
	}
	next();
});

module.exports = mongoose.model("Ticket", ticketSchema);
