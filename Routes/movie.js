const express = require("express");
// const { body, validationResult } = require("express-validator");
const Movie = require("../Models/Movie");
const multer = require("multer");
const router = express.Router();
const slugify = require("slugify");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/add", upload.single('poster_image'), async (req, res) => {
    try {
        const {
            movie_name,
            fileid,
            description,
            rating,
            trailer_link,
            summary,
            duration,
            size,
            categories,
            screenshots
        } = req.body;
        const slug = slugify(movie_name, { lower: true, strict: true });
        const download_link = `https://t.me/movieladownload/start=${slug}`;

        const existing = await Movie.findOne({ slug });
        if (existing) {
            return res.status(400).json({ error: "Movie with this slug already exists" });
        }

        const movie = new Movie({
            movie_name,
            fileid,
            slug,
            description,
            rating,
            poster_image: req.file ? {
                data: req.file.buffer,
                contentType: req.file.mimetype
            } : undefined,
            download_link,
            trailer_link,
            summary,
            duration,
            size,
            categories: Array.isArray(categories) ? categories : [categories],
            screenshots
        });

        const savedMovie = await movie.save();
        res.status(201).json({ success: true, movie: savedMovie });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/all", async (req, res) => {
    try {
        const movies = await Movie.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: movies.length, movies });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ error: "Movie not found" });
        res.json({ movie });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedMovie = await Movie.findByIdAndDelete(req.params.id);

        if (!deletedMovie) {
            return res.status(404).json({ error: "Movie not found" });
        }

        res.json({ success: true, message: "Movie deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
