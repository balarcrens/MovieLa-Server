const express = require("express");
const mongodb = require("./db.js");
const cors = require("cors");
mongodb();
const dotenv = require("dotenv");
const path = require("path");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");
const registerBotCommands = require("./botCommands.js");

dotenv.config();

const app = express();
const BOT_TOKEN = process.env.BOT_TOKEN;

// ======================= MIDDLEWARE =======================
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ======================= INIT BOT (Polling only) =======================
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log("🚀 Bot running in polling mode");

// Register commands
registerBotCommands(bot);

// ======================= ROUTES =======================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.use("/api/v1/movie", require("./Routes/movie.js"));
app.use("/api/v1/auth", require("./Routes/auth.js"));
app.use("/api/v1/requests", require("./Routes/request.js"));

// ======================= SERVER =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});