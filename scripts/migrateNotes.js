const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");
require("dotenv").config({ path: ".env.local" });

const migrateNotes = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("Connected to database");

		const tickets = await Ticket.find({ "notes.0": { $exists: true } });
		console.log(`Found ${tickets.length} tickets with notes`);

		for (const ticket of tickets) {
			ticket.notes = ticket.notes.map((note) => ({
				...note.toObject(),
				noteType: note.noteType || "customer", // Default to customer for existing notes
			}));
			await ticket.save();
		}

		console.log("Migration completed successfully");
		process.exit(0);
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}
};

migrateNotes();
