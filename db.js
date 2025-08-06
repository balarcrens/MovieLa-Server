const mongoose = require('mongoose');
// const URI = 'mongodb://localhost:27017/MovieDb';
import dotenv from 'dotenv';

dotenv.config();

const mongodb = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log("mongoDb connected Successfully");
    } catch (err) {
        console.log(err);
    }
}

module.exports = mongodb;