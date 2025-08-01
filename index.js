const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const mongodb = require("./db");
const Movie = require("./Models/Movie.js");

mongodb();
dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Telegram Bot Config
const BOT_TOKEN = process.env.BOT_TOKEN || '7937713026:AAGq9aVv0iFi9SulxeiyngvFHBxUudOMye4';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const CHANNEL_ID = -1002626082705;

// ✅ /start command
// bot.onText(/\/start/, (msg) => {
//     bot.sendMessage(msg.chat.id, `🎬 Welcome to Moviela Bot!\n\n🔎 Send a movie name to get its download link.`);
// });

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const payload = match[1]?.trim().toLowerCase();

    if (!payload) {
        return bot.sendMessage(chatId, `🎬 Welcome to Moviela Bot!\nSend a movie name or click download from website.`);
    }

    try {
        const movie = await Movie.findOne({ slug: payload });
        
        if (!movie) {
            return bot.sendMessage(chatId, `❌ Movie not found for: ${payload}`);
        }

        await bot.sendDocument(chatId, movie.fileid, {
            caption: `🎬 *${movie.movie_name}*\n\n🕒 Duration: ${movie.duration || "N/A"}\n📁 Size: ${movie.size || "N/A"}\n🔗 Download and Enjoy!`,
            parse_mode: "Markdown"
        });

        // console.log(`✅ Sent: ${movie.movie_name}`);
    } catch (err) {
        console.error("❌ Error sending movie:", err.message);
        bot.sendMessage(chatId, `❌ Failed to send movie. Try again later.`);
    }
});

// ✅ Optional: Reply with file_id (for testing uploads)
// bot.on('message', (msg) => {
//     if (msg.video) {
//         bot.sendMessage(msg.chat.id, `🎬 Video File ID:\n${msg.video.file_id}`);
//     } else if (msg.document) {
//         bot.sendMessage(msg.chat.id, `📄 Document File ID:\n${msg.document.file_id}`);
//     } else if (msg.photo) {
//         const fileId = msg.photo[msg.photo.length - 1].file_id;
//         bot.sendMessage(msg.chat.id, `🖼️ Photo File ID:\n${fileId}`);
//     }
// });

bot.on('channel_post', (msg) => {
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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.use('/api/v1/movie', require('./Routes/movie.js'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
