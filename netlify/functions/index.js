const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const serverless = require("serverless-http");

const mongodb = require("../../db.js");
const Movie = require("../../Models/Movie.js");
const registerBotCommands = require("../../botCommands.js");
const TelegramBot = require("node-telegram-bot-api");

// Load environment variables
dotenv.config();

// Initialize MongoDB
mongodb();

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(process.cwd(), "public")));

// Telegram Bot (Polling)
const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log("🚀 Bot running in polling mode");

// Register Bot commands
registerBotCommands(bot);

// Routes
app.get("/.netlify/functions/index", (req, res) => {
    res.sendFile(path.join(process.cwd(), "views", "index.html"));
});

// API Routes with serverless prefix
app.use("/.netlify/functions/index/api/v1/movie", require("../../Routes/movie.js"));
app.use("/.netlify/functions/index/api/v1/auth", require("../../Routes/auth.js"));

// Export serverless handler
module.exports.handler = serverless(app);
