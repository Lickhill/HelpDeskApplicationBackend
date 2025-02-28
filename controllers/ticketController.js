const Ticket = require("../models/Ticket");

exports.createTicket = async (req, res) => {
	try {
		const { title, description } = req.body;

		// Validate required fields
		if (!title || !description) {
			return res.status(400).json({
				success: false,
				message: "Please provide title and description",
			});
		}

		// Create new ticket with user data
		const ticket = await Ticket.create({
			ticketId: `TKT${Date.now()}`, // Temporary ID until pre-save hook generates the proper one
			title,
			description,
			customer: req.user._id,
			customerName: req.user.name,
			customerEmail: req.user.email,
			status: "Active",
			notes: [], // Initialize empty notes array
		});

		res.status(201).json({
			success: true,
			message: "Ticket created successfully",
			data: ticket,
		});
	} catch (error) {
		console.error("Create ticket error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to create ticket",
			error: error.message,
		});
	}
};

exports.getMyTickets = async (req, res) => {
	try {
		const tickets = await Ticket.find({ customer: req.user.id }).sort({
			createdAt: -1,
		});

		res.json({
			success: true,
			data: tickets,
		});
	} catch (error) {
		console.error("Get tickets error:", error);
		res.status(500).json({
			message: "Failed to fetch tickets",
			error: error.message,
		});
	}
};

exports.addNote = async (req, res) => {
	try {
		const { text } = req.body;
		const { ticketId } = req.params;

		if (!text) {
			return res.status(400).json({
				success: false,
				message: "Note text is required",
			});
		}

		const ticket = await Ticket.findById(ticketId);

		if (!ticket) {
			return res.status(404).json({
				success: false,
				message: "Ticket not found",
			});
		}

		// Determine note type based on user role
		let noteType;
		switch (req.user.role) {
			case "admin":
				noteType = "admin";
				break;
			case "agent":
				noteType = "agent";
				break;
			default:
				noteType = "customer";
		}

		// Create the note object with user details
		const note = {
			text,
			addedBy: {
				_id: req.user._id,
				name: req.user.name,
				email: req.user.email,
				role: req.user.role,
			},
			addedAt: new Date().toISOString().slice(0, -5) + "Z", // Remove seconds and milliseconds
			noteType,
		};

		// Ensure all existing notes have a noteType
		ticket.notes = ticket.notes.map((existingNote) => ({
			...existingNote.toObject(),
			noteType: existingNote.noteType || "customer",
		}));

		// Add new note
		ticket.notes.push(note);

		try {
			await ticket.save();
		} catch (saveError) {
			throw saveError;
		}

		// Return the populated note
		const populatedNote = {
			...note,
			_id: ticket.notes[ticket.notes.length - 1]._id,
		};

		res.status(201).json({
			success: true,
			message: "Note added successfully",
			note: populatedNote,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Failed to add note",
			error: error.message,
		});
	}
};

exports.deleteTicket = async (req, res) => {
	try {
		const { ticketId } = req.params;
		const ticket = await Ticket.findById(ticketId);

		if (!ticket) {
			return res.status(404).json({
				success: false,
				message: "Ticket not found",
			});
		}

		// Check if user owns the ticket or is admin
		if (
			ticket.customer.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to delete this ticket",
			});
		}

		await ticket.deleteOne();

		res.json({
			success: true,
			message: "Ticket deleted successfully",
		});
	} catch (error) {
		console.error("Delete ticket error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to delete ticket",
			error: error.message,
		});
	}
};

exports.getAllTickets = async (req, res) => {
	try {
		let tickets;

		// Custom sort function to put Closed/Review tickets at the end
		const customSort = (a, b) => {
			// Put Closed/Review tickets at the end
			if (a.status === "Closed" && b.status !== "Closed") return 1;
			if (a.status !== "Closed" && b.status === "Closed") return -1;
			if (a.status === "Review" && b.status !== "Review") return 1;
			if (a.status !== "Review" && b.status === "Review") return -1;

			// For other tickets, sort by updatedAt
			return new Date(b.updatedAt) - new Date(a.updatedAt);
		};

		if (req.user.role === "admin") {
			tickets = await Ticket.find().populate("customer", "name email");
		} else if (req.user.role === "agent") {
			tickets = await Ticket.find({ status: { $ne: "Closed" } }).populate(
				"customer",
				"name email"
			);
		} else {
			return res.status(403).json({
				success: false,
				message: "Not authorized to view all tickets",
			});
		}

		tickets = tickets.sort(customSort);

		res.json({
			success: true,
			count: tickets.length,
			data: tickets,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Failed to fetch tickets",
			error: error.message,
		});
	}
};

exports.updateTicketStatus = async (req, res) => {
	try {
		const { ticketId } = req.params;
		const { status } = req.body;

		// Validate status based on role
		if (req.user.role === "admin") {
			if (!["Active", "Pending", "Closed"].includes(status)) {
				return res.status(400).json({
					success: false,
					message: "Invalid status for admin",
				});
			}
		} else if (req.user.role === "agent") {
			if (!["Active", "Pending", "Review"].includes(status)) {
				return res.status(400).json({
					success: false,
					message: "Invalid status for agent",
				});
			}
		} else {
			return res.status(403).json({
				success: false,
				message: "Not authorized to update ticket status",
			});
		}

		const ticket = await Ticket.findById(ticketId);
		if (!ticket) {
			return res.status(404).json({
				success: false,
				message: "Ticket not found",
			});
		}

		ticket.status = status;
		await ticket.save();

		res.json({
			success: true,
			message: "Ticket status updated successfully",
			data: ticket,
		});
	} catch (error) {
		console.error("Update ticket status error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to update ticket status",
			error: error.message,
		});
	}
};
