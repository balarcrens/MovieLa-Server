const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();

// Credientials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "balarcrens";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "crens446";
// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "moviela@secret";

// Admin Login
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Generate token
        const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "2h" });
        return res.json({ success: true, token });
    } else {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

module.exports = router;
