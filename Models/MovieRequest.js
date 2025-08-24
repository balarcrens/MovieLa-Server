const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        movie_name: { type: String, required: true },
        user_name: { type: String, required: true },
        user_email: { type: String },
        comment: { type: String },
        link: { type: String },
    },
    { timestamps: true }
);

const MovieRequest = mongoose.model("Request", requestSchema);

module.exports = MovieRequest;
