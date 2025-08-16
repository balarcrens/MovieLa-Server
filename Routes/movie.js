const express = require("express");
const Movie = require("../Models/Movie");
const router = express.Router();
const slugify = require("slugify");
const upload = require("../config/multer");
const cloudinary = require("../config/cloudinary");

router.post("/add", upload.fields([
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

        let posterUrl = "";
        if (req.files.poster) {
            const uploadRes = await cloudinary.uploader.upload(
                req.files.poster[0].path,
                { folder: "movies/posters" }
            );
            posterUrl = uploadRes.secure_url;
        }

        let screenshots = [];
        if (req.files.screenshots) {
            for (const file of req.files.screenshots) {
                const uploadRes = await cloudinary.uploader.upload(
                    file.path,
                    { folder: "movies/screenshots" }
                );
                screenshots.push(uploadRes.secure_url);
            }
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
            screenshots
        });

        const savedMovie = await movie.save();
        res.status(201).json({ success: true, movie: savedMovie });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

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
