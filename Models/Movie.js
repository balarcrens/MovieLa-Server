const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
    movie_name: {
        type: String,
        required: true,
        trim: true
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
    poster_image: Buffer,
    trailer_link: String,
    summary: String,
    categories: {
        type: [String],
        trim: true
    },
    screenshots: [{
        screenshot: Buffer,
        created_at: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

const Movie = mongoose.model('Movie', MovieSchema);

module.exports = Movie;