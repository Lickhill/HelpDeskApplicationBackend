const express = require("express");
const router = express.Router();
const {
	createTicket,
	getMyTickets,
	addNote,
	deleteTicket,
	getAllTickets,
	updateTicketStatus,
} = require("../controllers/ticketController");
const { protect } = require("../middleware/auth");

router.post("/", protect, createTicket);
router.get("/my", protect, getMyTickets);
router.post("/:ticketId/notes", protect, addNote);
router.delete("/:ticketId", protect, deleteTicket);
router.get("/all", protect, getAllTickets);
router.patch("/:ticketId/status", protect, updateTicketStatus);

module.exports = router;
