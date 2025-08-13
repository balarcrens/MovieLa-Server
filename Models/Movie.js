const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
    movie_name: {
        type: String,
        required: true,
        trim: true
    },
    fileid: {
        type: String,
        required: true
    },
    description: String,
    rating: {
        type: Number,
        min: 0,
        max: 10
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    download_link: String,

    posterUrl: {
        type: String,
        required: true,
        trim: true
    },

    trailer_link: String,
    summary: String,
    duration: String,
    size: String,
    categories: {
        type: [String],
        trim: true
    },
    screenshots: {
        type: [String],
    }
}, {
    timestamps: true
});

const Movie = mongoose.model('Movie', MovieSchema);

module.exports = Movie;