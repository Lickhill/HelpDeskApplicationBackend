const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const Ticket = require("../models/Ticket");
const User = require("../models/User");

// Get dashboard stats based on user role
router.get(
	"/stats",
	protect,
	authorize("admin", "agent", "customer"),
	async (req, res) => {
		try {
			const userRole = req.user.role;
			let stats = {};

			if (userRole === "admin") {
				// Get all ticket counts and user count for admin
				const ticketStats = await Ticket.aggregate([
					{
						$group: {
							_id: "$status",
							count: { $sum: 1 },
						},
					},
				]);

				const userCount = await User.countDocuments({
					role: "customer",
				});

				stats = {
					tickets: {
						Active: 0,
						Pending: 0,
						Closed: 0,
						Review: 0,
					},
					users: userCount,
				};

				ticketStats.forEach((stat) => {
					stats.tickets[stat._id] = stat.count;
				});
			} else if (userRole === "agent") {
				// Get non-closed tickets count for agent
				const ticketStats = await Ticket.aggregate([
					{
						$match: { status: { $ne: "Closed" } },
					},
					{
						$group: {
							_id: "$status",
							count: { $sum: 1 },
						},
					},
				]);

				stats = {
					tickets: {
						Active: 0,
						Pending: 0,
						Review: 0,
					},
				};

				ticketStats.forEach((stat) => {
					stats.tickets[stat._id] = stat.count;
				});
			} else {
				// Get customer's own tickets count
				const ticketStats = await Ticket.aggregate([
					{
						$match: { customer: req.user._id },
					},
					{
						$group: {
							_id: "$status",
							count: { $sum: 1 },
						},
					},
				]);

				stats = {
					tickets: {
						Active: 0,
						Pending: 0,
						Closed: 0,
					},
				};

				ticketStats.forEach((stat) => {
					stats.tickets[stat._id] = stat.count;
				});
			}

			res.json({
				success: true,
				data: stats,
			});
		} catch (error) {
			console.error("Dashboard stats error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to fetch dashboard stats",
			});
		}
	}
);

module.exports = router;
