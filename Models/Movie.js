const mongoose = require("mongoose");

const EpisodeSchema = new mongoose.Schema({
    episode_number: { type: Number, required: true },
    title: { type: String, trim: true },
    duration: { type: String, trim: true },
    size: { type: String, trim: true },
    fileid: { type: String, required: true, trim: true }, // store Telegram file_id
    releaseDate: { type: String, trim: true }
});

const MovieSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["Movie", "WebSeries"],
        default: "Movie",
        required: true
    },
    movie_name: { type: String, required: true, trim: true },
    fileid: { type: String, required: function () { return this.type === "Movie"; }, trim: true }, // for movies
    description: { type: String, trim: true },
    summary: { type: String, trim: true },
    review: { type: String, trim: true },
    rating: { type: Number, min: 0, max: 10 },
    slug: { type: String, required: true, unique: true },
    download_link: { type: String, trim: true }, // for movies only (deep link to bot)
    episodes: [EpisodeSchema], // for web series (each episode has file_id)
    posterUrl: { type: String, required: true, trim: true },
    trailer_link: { type: String, trim: true },
    duration: { type: String, trim: true },
    size: { type: String, trim: true },
    releaseDate: { type: String, default: "N/A", trim: true },
    categories: [{ type: String, trim: true }],
    screenshots: [{ type: String, trim: true }],
    industry: {
        type: String,
        enum: ["Bollywood", "Hollywood", "South", "Tollywood", "Kollywood", "Gujarati", "Other"],
        required: true
    },
    actors: [{ type: String, trim: true }],
    director: { type: String, trim: true },
    language: { type: String, default: "Hindi", trim: true },
    keywords: [{ type: String, trim: true }],
    meta_description: { type: String, trim: true },
    views: { type: Number, default: 0 }
}, { timestamps: true });

const Movie = mongoose.model("Movie", MovieSchema);
module.exports = Movie;