const express = require("express");
const Movie = require("../Models/Movie");
const router = express.Router();
const slugify = require("slugify");
const upload = require("../config/multer");
const { uploadToImageKit } = require("../config/imagekit");
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

            // Poster upload
            let posterUrl = "";
            if (req.files.poster) {
                posterUrl = await uploadToImageKit(req.files.poster[0], "movies/posters");
            }

            // Screenshots upload
            let screenshots = [];
            if (req.files.screenshots) {
                screenshots = await Promise.all(req.files.screenshots.map(file =>
                    uploadToImageKit(file, "movies/screenshots")
                ));
            }

            let download_link = "";
            let parsedEpisodes = [];

            if (type === "Movie") {
                download_link = `https://t.me/movieladownload?start=${slug}`;
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
                fileid: type === "Movie" ? fileid : undefined,
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

        const [movies, totalMovies] = await Promise.all([
            Movie.find(query, { movie_name: 1, posterUrl: 1, rating: 1, slug: 1, description: 1, categories: 1, type: 1 })
                .sort({ createdAt: -1 }).skip(skip).limit(limit),
            Movie.countDocuments(query)
        ]);

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

        const movies = await Movie.find(
            { categories: { $in: [new RegExp("^" + category + "$", "i")] } },
            { movie_name: 1, posterUrl: 1, rating: 1, slug: 1, description: 1, categories: 1, type: 1 }
        ).sort({ createdAt: -1 });

        if (!movies.length)
            return res.status(404).json({ error: "No movies/webseries found for this category" });

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

        const movies = await Movie.find(filter, { movie_name: 1, posterUrl: 1, rating: 1, slug: 1, description: 1, categories: 1, type: 1 })
            .sort(sort);

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

// ------------------- GET MOVIE/WEBSERIES BY ID -------------------
router.get("/getmovie/:id", async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);

        if (!movie) {
            return res.status(404).json({ success: false, error: "Movie not found" });
        }

        res.status(200).json({ success: true, movie });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: "Invalid ID or Server Error" });
    }
});

// ------------------- UPDATE MOVIE/WEBSERIES -------------------
router.put("/update/:id", RequireAdmin,
    upload.fields([
        { name: "poster", maxCount: 1 },
        { name: "screenshots", maxCount: 10 }
    ]),
    async (req, res) => {
        try {
            const movie = await Movie.findById(req.params.id);
            if (!movie) {
                return res.status(404).json({ success: false, error: "Movie not found" });
            }

            const { type, movie_name, fileid, description, rating, trailer_link, summary, duration, size, categories, releaseDate,
                industry, actors, director, language, keywords, meta_description, review, episodes
            } = req.body;

            // Update slug if movie name changes
            if (movie_name && movie_name !== movie.movie_name) {
                movie.movie_name = movie_name;
                movie.slug = slugify(movie_name, { lower: true, strict: true });
            }

            // Poster update (optional)
            if (req.files?.poster) {
                movie.posterUrl = await uploadToImageKit(
                    req.files.poster[0],
                    "movies/posters"
                );
            }

            // Screenshots update (optional – replaces old ones)
            if (req.files?.screenshots) {
                movie.screenshots = await Promise.all(
                    req.files.screenshots.map(file =>
                        uploadToImageKit(file, "movies/screenshots")
                    )
                );
            }

            // Episodes update (WebSeries only)
            if (type === "WebSeries" && episodes) {
                try {
                    movie.episodes = JSON.parse(episodes);
                } catch (err) {
                    return res.status(400).json({ error: "Invalid episodes JSON" });
                }
            }

            // Assign remaining fields
            movie.type = type ?? movie.type;
            movie.fileid = type === "Movie" ? fileid : undefined;
            movie.description = description ?? movie.description;
            movie.rating = rating ?? movie.rating;
            movie.trailer_link = trailer_link ?? movie.trailer_link;
            movie.summary = summary ?? movie.summary;
            movie.duration = duration ?? movie.duration;
            movie.size = size ?? movie.size;
            movie.releaseDate = releaseDate ?? movie.releaseDate;
            movie.industry = industry ?? movie.industry;
            movie.director = director ?? movie.director;
            movie.language = language ?? movie.language;
            movie.meta_description = meta_description ?? movie.meta_description;
            movie.review = review ?? movie.review;

            // Array fields handling
            if (categories) {
                movie.categories = Array.isArray(categories) ? categories : [categories];
            }

            if (actors) {
                movie.actors = Array.isArray(actors) ? actors : [actors];
            }

            if (keywords) {
                movie.keywords = Array.isArray(keywords) ? keywords : [keywords];
            }

            await movie.save();

            res.status(200).json({
                success: true,
                message: "Movie updated successfully",
                movie
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
);

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