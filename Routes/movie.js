const express = require("express");
const Movie = require("../Models/Movie");
const router = express.Router();
const slugify = require("slugify");
const upload = require("../config/multer");
const { uploadToCloudinary } = require("../config/cloudinary");
const RequireAdmin = require("../Middleware/RequireAdmin");

// Add Movie
router.post(
    "/add",
    RequireAdmin,
    upload.fields([
        { name: "poster", maxCount: 1 },
        { name: "screenshots", maxCount: 10 }
    ]),
    async (req, res) => {
        try {
            const { movie_name, fileid, description, rating, trailer_link, summary, duration, size, categories, releaseDate, industry, actors, director, language, keywords, meta_description, review } = req.body;

            const slug = slugify(movie_name, { lower: true, strict: true });
            const download_link = `https://t.me/movieladownload/start=${slug}`;

            // Upload poster
            let posterUrl = "";
            if (req.files.poster) {
                posterUrl = await uploadToCloudinary(
                    req.files.poster[0],
                    "movies/posters"
                );
            }

            // Upload screenshots
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
                releaseDate: releaseDate || "N/A",
                industry,
                actors: actors ? (Array.isArray(actors) ? actors : [actors]) : [],
                director,
                language: language || "Hindi",
                keywords: keywords
                    ? Array.isArray(keywords) ? keywords : [keywords]
                    : [],
                meta_description,
                review
            });

            const savedMovie = await movie.save();
            res.status(201).json({ success: true, movie: savedMovie });
        } catch (error) {
            console.log(error.message);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
);

// GET /api/v1/movie/getmovie
router.get("/getmovie", async (req, res) => {
    try {
        const { search } = req.query;
        let movies;

        if (search && search.trim() !== "") {
            const regex = new RegExp(search.trim(), "i");
            movies = await Movie.find({
                $or: [{ movie_name: regex }, { categories: regex }]
            }).sort({ createdAt: -1 });
        } else {
            movies = await Movie.find().sort({ createdAt: -1 });
        }
        res.status(200).json({ success: true, count: movies.length, movies });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/v1/movie/category/:category
router.get("/category/:category", async (req, res) => {
    try {
        const category = req.params.category;

        const movies = await Movie.find({
            categories: { $in: [new RegExp("^" + category + "$", "i")] }
        }).sort({ createdAt: -1 });

        if (!movies.length) {
            return res.status(404).json({ error: "No movies found for this category" });
        }

        res.json({ success: true, movies });
    } catch (error) {
        res.status(500).json({ error: "Server error", message: error.message });
    }
});

// GET /api/v1/movie/filter
router.get("/filter", async (req, res) => {
    try {
        const { sortBy, industry } = req.query;

        let filter = {};
        if (industry) {
            filter.industry = new RegExp(`^${industry}$`, "i");
        }

        let sort = {};
        if (sortBy === "latest") {
            sort = { releaseDate: -1 };
        } else if (sortBy === "popular") {
            sort = { views: -1 };
        } else if (sortBy === "rating") {
            sort = { rating: -1 };
        }

        const movies = await Movie.find(filter).sort(sort);
        res.json({ movies });

    } catch (error) {
        res.status(500).json({ error: "Server error", message: error.message });
    }
});

// GET /api/v1/movie/:slug
router.get("/:slug", async (req, res) => {
    try {
        const movie = await Movie.findOneAndUpdate(
            { slug: req.params.slug },
            { $inc: { views: 1 } },
            { new: true }
        );
        if (!movie) return res.status(404).json({ error: "Movie not found" });
        res.json({ movie });
    } catch (error) {
        res.status(500).json({ error: "Server error", message: error.message });
    }
});

// DELETE /api/v1/movie/delete/:id
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