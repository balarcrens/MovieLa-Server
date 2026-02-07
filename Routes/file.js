const express = require("express");
const router = express.Router();
const File = require("../Models/File");

router.get("/all", async (req, res) => {
    try {
        const files = await File.find()
            .populate("movie", "movie_name slug type")
            .sort({ createdAt: -1 });

        res.json(files);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get("/movie/:id", async (req, res) => {
    try {
        const files = await File.find({ movie: req.params.id })
            .populate("movie", "movie_name slug type")
            .sort({ createdAt: -1 });

        res.json(files);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;