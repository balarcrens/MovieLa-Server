const express = require("express");
const Movie = require("../Models/Movie");
const router = express.Router();
const slugify = require("slugify");
const upload = require("../config/multer");
const { uploadToCloudinary } = require("../config/cloudinary");
const RequireAdmin = require("../Middleware/RequireAdmin");

// Add Movie
router.post("/add", RequireAdmin, upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "screenshots", maxCount: 10 }
]), async (req, res) => {
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
            categories
        } = req.body;

        const slug = slugify(movie_name, { lower: true, strict: true });
        const download_link = `https://t.me/movieladownload/start=${slug}`;

        // Upload poster directly
        let posterUrl = "";
        if (req.files.poster) {
            posterUrl = await uploadToCloudinary(req.files.poster[0], "movies/posters");
        }

        // Upload screenshots directly
        let screenshots = [];
        if (req.files.screenshots) {
            screenshots = await Promise.all(
                req.files.screenshots.map(file =>
                    uploadToCloudinary(file, "movies/screenshots")
                )
            );
        }

        const movie = new Movie({
            movie_name,
            fileid,
            slug,
            description,
            rating,
            posterUrl,
            download_link,
            trailer_link,
            summary,
            duration,
            size,
            categories: Array.isArray(categories) ? categories : [categories],
            screenshots,
        });

        const savedMovie = await movie.save();
        res.status(201).json({ success: true, movie: savedMovie });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch All Movie
router.get("/getmovie", async (req, res) => {
    try {
        const { search } = req.query;
        let movies;

        if (search && search.trim() !== "") {
            const regex = new RegExp(search.trim(), "i");
            movies = await Movie.find({ $or: [{ movie_name: regex }, { categories: regex }] });
        } else {
            movies = await Movie.find().sort({ createdAt: -1 });
        }
        res.status(200).json({ success: true, count: movies.length, movies });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch Movie By Id
router.get("/:id", async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ error: "Movie not found" });
        res.json({ movie });
    } catch (error) {
        res.status(500).json({ error: "Server error", message: error.message });
    }
});

// Fetch Movie By Genres
router.get("/:genres", async (req, res) => {
    try {
        const { genre } = req.params;
        const movie = await Movie.find({ categories: genre });
        if (!movie || movie.length === 0) {
            return res.status(404).json({ error: "No movies found for this genre" });
        }
        res.json({ movie });
    } catch (error) {
        res.status(500).json({ error: "Server error", message: error.message });
    }
});

// Delete Movie By Id
router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
        if (!deletedMovie) {
            return res.status(404).json({ error: "Movie not found" });
        }
        res.json({ success: true, message: "Movie deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
});

module.exports = router;