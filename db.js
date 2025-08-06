const mongoose = require('mongoose');
// const URI = 'mongodb://localhost:27017/MovieDb';
const dotenv = require('dotenv');

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