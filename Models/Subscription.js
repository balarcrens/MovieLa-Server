// models/Subscription.js
const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    endpoint: { type: String, required: true },
    expirationTime: { type: Date, default: null },
    keys: {
        p256dh: { type: String },
        auth: { type: String },
    },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
