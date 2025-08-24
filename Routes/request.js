const express = require("express");
const MovieRequest = require("../Models/MovieRequest");
const RequireAdmin = require("../Middleware/RequireAdmin");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { movie_name, user_name, user_email, comment, reference_link } = req.body;

        if (!movie_name || !user_name) {
            return res.status(400).json({ message: "Please fill required fields" });
        }

        const newRequest = new MovieRequest({
            movie_name: movie_name.trim(),
            user_name: user_name.trim(),
            user_email: user_email.trim(),
            comment: comment?.trim(),
            reference_link: reference_link?.trim(),
        });

        await newRequest.save();

        res.status(201).json({
            success: true,
            message: "Movie request submitted successfully!",
            data: newRequest,
        });
    } catch (error) {
        console.error("Error creating movie request:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get("/", RequireAdmin, async (req, res) => {
    try {
        const requests = await MovieRequest.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (err) {
        console.error("Error fetching movie requests:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
