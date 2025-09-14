const express = require("express");
const Movie = require("../Models/Movie");
const router = express.Router();
const slugify = require("slugify");
const upload = require("../config/multer");
const { uploadToCloudinary } = require("../config/cloudinary");
const RequireAdmin = require("../Middleware/RequireAdmin");

// ------------------- ADD MOVIE OR WEBSERIES -------------------
router.post("/add", RequireAdmin,
    upload.fields([
        { name: "poster", maxCount: 1 },
        { name: "screenshots", maxCount: 10 }
    ]),
    async (req, res) => {
        try {
            const {
                type, movie_name, fileid, description, rating, trailer_link, summary,
                duration, size, categories, releaseDate, industry, actors,
                director, language, keywords, meta_description, review, episodes
            } = req.body;

            const slug = slugify(movie_name, { lower: true, strict: true });

            let posterUrl = "";
            if (req.files.poster) {
                posterUrl = await uploadToCloudinary(req.files.poster[0], "movies/posters");
            }

            let screenshots = [];
            if (req.files.screenshots) {
                screenshots = await Promise.all(req.files.screenshots.map(file =>
                    uploadToCloudinary(file, "movies/screenshots")
                ));
            }

            let download_link = "";
            let parsedEpisodes = [];

            if (type === "Movie") {
                download_link = `https://t.me/movieladownload?start=${fileid || slug}`;
            } else if (type === "WebSeries" && episodes) {
                try {
                    parsedEpisodes = JSON.parse(episodes);
                } catch (err) {
                    return res.status(400).json({ error: "Invalid episodes format, must be JSON" });
                }
            }

            const movie = new Movie({
                type,
                movie_name,
                fileid,
                slug,
                description,
                rating,
                posterUrl,
                download_link,
                episodes: parsedEpisodes,
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
                keywords: keywords ? (Array.isArray(keywords) ? keywords : [keywords]) : [],
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

// ------------------- ADD EPISODE TO A SERIES -------------------
router.post("/addepisode/:id", RequireAdmin, async (req, res) => {
    try {
        const { episode_number, title, duration, size, fileid, releaseDate } = req.body;

        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ error: "WebSeries not found" });
        if (movie.type !== "WebSeries") return res.status(400).json({ error: "Only WebSeries can have episodes" });

        movie.episodes.push({ episode_number, title, duration, size, fileid, releaseDate });
        await movie.save();

        res.json({ success: true, message: "Episode added successfully", series: movie });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
});

// ------------------- GET MOVIES/WEBSERIES -------------------
router.get("/getmovie", async (req, res) => {
    try {
        const { search } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let query = {};
        if (search && search.trim() !== "") {
            const regex = new RegExp(search.trim(), "i");
            query = { $or: [{ movie_name: regex }, { categories: regex }] };
        }

        const movies = await Movie.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalMovies = await Movie.countDocuments(query);

        res.status(200).json({
            success: true,
            movies,
            count: movies.length,
            totalMovies,
            totalPages: Math.ceil(totalMovies / limit),
            currentPage: page
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ------------------- CATEGORY -------------------
router.get("/category/:category", async (req, res) => {
    try {
        const category = req.params.category;
        const movies = await Movie.find({
            categories: { $in: [new RegExp("^" + category + "$", "i")] }
        }).sort({ createdAt: -1 });

        if (!movies.length) return res.status(404).json({ error: "No movies/webseries found for this category" });
        res.json({ success: true, movies });
    } catch (error) {
        res.status(500).json({ error: "Server error", message: error.message });
    }
});

// ------------------- FILTER -------------------
router.get("/filter", async (req, res) => {
    try {
        const { sortBy, industry } = req.query;
        let filter = {};
        if (industry) filter.industry = new RegExp(`^${industry}$`, "i");

        let sort = {};
        if (sortBy === "latest") sort = { releaseDate: -1 };
        else if (sortBy === "popular") sort = { views: -1 };
        else if (sortBy === "rating") sort = { rating: -1 };

        const movies = await Movie.find(filter).sort(sort);
        res.json({ movies });

    } catch (error) {
        res.status(500).json({ error: "Server error", message: error.message });
    }
});

// ------------------- GET MOVIE/WEBSERIES BY SLUG -------------------
router.get("/slug/:slug", async (req, res) => {
    try {
        const movie = await Movie.findOneAndUpdate(
            { slug: req.params.slug },
            { $inc: { views: 1 } },
            { new: true }
        );
        if (!movie) return res.status(404).json({ error: "Not found" });
        res.json({ movie });
    } catch (error) {
        res.status(500).json({ error: "Server error", message: error.message });
    }
});

// ------------------- DELETE MOVIE/WEBSERIES -------------------
router.delete("/delete/:id", RequireAdmin, async (req, res) => {
    try {
        const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
        if (!deletedMovie) return res.status(404).json({ error: "Not found" });
        res.json({ success: true, message: "Deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error", message: err.message });
    }
});

module.exports = router;