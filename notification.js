// notification.js
const express = require("express");
const dotenv = require("dotenv");
const mongodb = require("./db");
const { saveSubscription, sendNotification } = require("./webpushService");

dotenv.config();

const app = express();
app.use(express.json());

// Connect to MongoDB
mongodb();

// Routes
app.post("/subscribe", async (req, res) => {
    try {
        await saveSubscription(req.body);
        res.status(201).json({ message: "Subscription saved" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/notify", async (req, res) => {
    try {
        const { title, body } = req.body;
        await sendNotification(title, body);
        res.status(200).json({ message: "Notification sent" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
