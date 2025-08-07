const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");

const mongodb = require("./db.js");
const Movie = require("./Models/Movie.js");

dotenv.config();
mongodb();

const app = express();
const BOT_TOKEN = process.env.BOT_TOKEN;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Middleware
app.use(
    cors({
        origin: ["https://movie-la.vercel.app", "http://localhost:5173", "https://moviela.vercel.app"],
        credentials: true,
    })
);
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const payload = match[1]?.trim().toLowerCase();

    if (!payload) {
        return bot.sendMessage(
            chatId,
            `🎬 Welcome to Moviela Bot!\nSend a movie name or click download from the website.`
        );
    }

    try {
        const movie = await Movie.findOne({ slug: payload });

        if (!movie) {
            return bot.sendMessage(chatId, `❌ Movie not found for: ${payload}`);
        }

        await bot.sendDocument(chatId, movie.fileid, {
            caption: `🎬 *${movie.movie_name}*\n\n🕒 Duration: ${movie.duration || "N/A"}\n📁 Size: ${movie.size || "N/A"}\n🔗 Download and Enjoy!`,
            parse_mode: "Markdown",
        });
    } catch (err) {
        console.error("❌ Error sending movie:", err.message);
        bot.sendMessage(chatId, `❌ Failed to send movie. Try again later.`);
    }
});

bot.on("channel_post", (msg) => {
    console.log("📨 New message from channel:", JSON.stringify(msg, null, 2));
    const chatId = msg.chat.id;

    if (msg.video) {
        const fileId = msg.video.file_id;
        bot.sendMessage(chatId, `🎬 Video File ID:\n${fileId}`);
    } else if (msg.document) {
        const fileId = msg.document.file_id;
        bot.sendMessage(chatId, `📄 Document File ID:\n${fileId}`);
    } else if (msg.photo) {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        bot.sendMessage(chatId, `🖼️ Photo File ID:\n${fileId}`);
    } else if (msg.text) {
        console.log("📝 Text message from channel:", msg.text);
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.use("/api/v1/movie", require("./Routes/movie.js"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
