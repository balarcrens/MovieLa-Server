const mongoose = require('mongoose');
// const URI = 'mongodb://localhost:27017/MovieDb';
const dotenv = require('dotenv');

dotenv.config();

const mongodb = async () => {
    const mongoURI = process.env.DB_URI;

    mongoose.connect(mongoURI, {
        dbName: "MovieDb",
    })
        .then(() => console.log("MongoDB connected"))
        .catch((err) => console.error("MongoDB connection error:", err.message));
}

module.exports = mongodb;