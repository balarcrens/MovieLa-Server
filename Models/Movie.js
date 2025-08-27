const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
    movie_name: {
        type: String,
        required: true, trim: true
    },
    fileid: { type: String, required: true },
    description: { type: String, trim: true },
    summary: { type: String, trim: true },
    review: { type: String, trim: true },
    rating: {
        type: Number,
        min: 0, max: 10
    },
    slug: {
        type: String,
        required: true, unique: true
    },
    download_link: { type: String, trim: true },
    posterUrl: {
        type: String,
        required: true,
        trim: true
    },
    trailer_link: { type: String, trim: true },
    duration: { type: String, trim: true },
    size: { type: String, trim: true },
    releaseDate: { type: String, default: "N/A", trim: true },
    categories: [{ type: String, trim: true }],
    screenshots: [{ type: String, trim: true }],
    industry: {
        type: String,
        enum: ["Bollywood", "Hollywood", "South", "Tollywood", "Kollywood", "Other"],
        required: true
    },
    actors: [{ type: String, trim: true }],
    director: { type: String, trim: true },
    language: {
        type: String,
        default: "Hindi",
        trim: true
    },
    keywords: [{ type: String, trim: true }],
    meta_description: { type: String, trim: true },
    views: { type: Number, default: 0 }
}, {
    timestamps: true
});

const Movie = mongoose.model('Movie', MovieSchema);

module.exports = Movie;
