const express = require("express");
const MovieRequest = require("../Models/MovieRequest");
const RequireAdmin = require("../Middleware/RequireAdmin");
const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { movie_name, user_name, user_email, comment, link } = req.body;

        if (!movie_name || !user_name) {
            return res.status(400).json({ message: "Please fill required fields" });
        }

        const newRequest = new MovieRequest({
            movie_name: movie_name.trim(),
            user_name: user_name.trim(),
            user_email: user_email.trim(),
            comment: comment?.trim(),
            link: link?.trim(),
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

router.delete("/:id", RequireAdmin, async (req, res) => {
    try {
        const request = await MovieRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }
        else {
            await MovieRequest.findByIdAndDelete(req.params.id);
            res.json({ success: true, message: "Request deleted successfully" });
        }
    } catch (err) {
        console.error("Error deleting movie request:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
