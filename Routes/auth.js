const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();

// ------------------- CORS -------------------
const corsOptions = {
    origin: ["https://moviela.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
};
router.use(cors(corsOptions));
router.options("*", cors(corsOptions));

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
        const token = jwt.sign({ role: "admin" }, JWT_SECRET);
        return res.json({ success: true, token });
    } else {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

module.exports = router;
