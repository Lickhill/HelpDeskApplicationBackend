const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

// Test route
router.get("/test", (req, res) => {
	res.json({ message: "Auth route working" });
});

router.post("/register", register);
router.post("/login", login);

module.exports = router;
