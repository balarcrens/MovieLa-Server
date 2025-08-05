const mongoose = require('mongoose');
const URI = 'mongodb://localhost:27017/MovieDb';
// const URI = 'mongodb+srv://balarcrens188:crens446@cluster0.xzu7dp3.mongodb.net/moviedb';

const mongodb = async () => {
    try {
        await mongoose.connect(URI);
        console.log("mongoDb connected Successfully");
    } catch (err) {
        console.log(err);
    }
}

module.exports = mongodb;