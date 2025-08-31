// /webpushService.js
const webPush = require("web-push");
const Subscription = require("./Models/Subscription");
require("dotenv").config();

// Set your VAPID keys
webPush.setVapidDetails(
    "mailto:balarcrens@gmail.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Save subscription to MongoDB
async function saveSubscription(subscription) {
    try {
        const existing = await Subscription.findOne({ endpoint: subscription.endpoint });

        if (!existing) {
            await Subscription.create(subscription);
            console.log("✅ Subscription saved");
        } else {
            console.log("Subscription already exists");
        }
    } catch (err) {
        console.error("❌ Error saving subscription:", err.message);
        throw err;
    }
}

// Send real push notifications to all subscribers
async function sendNotification(title, body) {
    try {
        const subs = await Subscription.find();
        const payload = JSON.stringify({ title, body, url: "https://moviela.vercel.app" });

        subs.forEach((sub) => {
            webPush.sendNotification(sub, payload).catch(err => {
                console.error("❌ Failed to send notification to:", sub.endpoint);
                console.error(err.message);
            });
        });

        console.log("📢 Notifications sent to all subscribers");
    } catch (err) {
        console.error("❌ Error sending notifications:", err.message);
        throw err;
    }
}

module.exports = { saveSubscription, sendNotification };
