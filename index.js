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
const DOMAIN = process.env.DOMAIN;
const NODE_ENV = process.env.NODE_ENV || "development";

let bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log("🚀 Bot running in polling mode");

// Middleware
app.use(
    cors({
        origin: ["http://localhost:5173", "https://moviela.vercel.app"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ======================= BOT COMMANDS =======================
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(
        chatId,
        `🤖 *Moviela Bot Help*\n
Here are the available commands:\n
/help - Show this help menu
/websitelink - Get the official Moviela website
/moviela <movie-slug> - Download a specific movie
/latest - Get the latest uploaded movies`,
        { parse_mode: "Markdown" }
    );
});

bot.onText(/\/websitelink/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `🌐 Visit our website for more movies:\n👉 https://moviela.vercel.app`);
});

bot.onText(/\/latest/, async (msg) => {
    const chatId = msg.chat.id;

    try {
        const latestMovies = await Movie.find().sort({ createdAt: -1 }).limit(5);

        if (latestMovies.length === 0) {
            return bot.sendMessage(chatId, "❌ No movies uploaded yet.");
        }

        let response = "🔥 *Latest Movies Uploaded:*\n\n";
        latestMovies.forEach((m, i) => {
            response += `${i + 1}. 🎬 *${m.movie_name}* \n🔗 /moviela ${m.slug}\n\n`;
        });

        bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (err) {
        console.error(err.message);
        bot.sendMessage(chatId, "❌ Failed to fetch latest movies.");
    }
});

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const payload = match[1]?.trim().toLowerCase();

    if (!payload) {
        return bot.sendMessage(
            chatId,
            `🎬 Welcome to Moviela Bot!\nDownload Your Favourite Movie From The Website.\n https://moviela.vercel.app`
        );
    }

    try {
        const movie = await Movie.findOne({ slug: payload });

        if (!movie) {
            return bot.sendMessage(chatId, `❌ Movie not found for: ${payload}`);
        }

        await bot.sendDocument(chatId, movie.fileid, {
            caption: `🎬 *${movie.movie_name}*\n\n🕒 Duration: ${movie.duration || "N/A"}\n📁 Size: ${movie.size || "N/A"}\n🔗 Download and Enjoy! \n\n Explore All Movies 🔗👇 \n https://moviela.vercel.app`,
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
