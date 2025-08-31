// Routes/notification.js
const express = require("express");
const router = express.Router();
const { saveSubscription, sendNotification } = require("../webpushService");

// Subscribe route
router.post("/subscribe", async (req, res) => {
    try {
        await saveSubscription(req.body);
        res.status(201).json({ message: "Subscription saved" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Trigger notification (for admin/testing)
router.post("/notify", async (req, res) => {
    try {
        const { title, body, url } = req.body;
        await sendNotification({ title, body, url: url || "https://moviela.vercel.app" });
        res.status(200).json({ message: "Notification sent" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;