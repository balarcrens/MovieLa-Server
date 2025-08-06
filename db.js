const mongoose = require('mongoose');
// const URI = 'mongodb://localhost:27017/MovieDb';
const dotenv = require('dotenv');

dotenv.config();

const mongodb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    }
}

module.exports = mongodb;