const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
    movie_name: { type: String, required: true, trim: true },
    fileid: { type: String, required: true, trim: true },
    caption: { type: String, trim: true },
    type: { type: String, enum: ["Movie", "WebSeries"], default: "Movie" },
    episode_number: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("File", FileSchema);