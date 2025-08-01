const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const mongodb = require("./db");

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

// Load movie data
let movies = [];
try {
    movies = JSON.parse(fs.readFileSync('./movies.json'));
} catch (err) {
    console.error('❌ Failed to load movie data:', err);
}

// ✅ /start command
// bot.onText(/\/start/, (msg) => {
//     bot.sendMessage(msg.chat.id, `🎬 Welcome to Moviela Bot!\n\n🔎 Send a movie name to get its download link.`);
// });

bot.onText(/\/start(?:\s+(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const payload = match[1]?.trim().toLowerCase(); // e.g., 'kgf', 'pushpa'

    if (!payload) {
        return bot.sendMessage(chatId, `🎬 Welcome to Moviela Bot!\nSend a movie name or click download from website.`);
    }

    const movie = movies.find(m => m.slug === payload);

    if (!movie) {
        return bot.sendMessage(chatId, `❌ Movie not found for: ${payload}`);
    }

    // Send movie file dynamically
    bot.sendDocument(chatId, movie.file_id, {
        caption: `🎬 *${movie.title}*\n\n🕒 Duration: ${movie.duration}\n📁 Size: ${movie.size}\n🔗 Download and Enjoy!`,
        parse_mode: 'Markdown'
    }).then(() => {
        console.log(`✅ Sent: ${movie.title}`);
    }).catch(err => {
        console.error("❌ Error sending movie:", err.message);
        bot.sendMessage(chatId, `❌ Failed to send movie. Try again later.`);
    });
});

// ✅ Search & respond to movie name
// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;
//     const text = msg.text?.trim().toLowerCase();

//     if (!text || text.startsWith('/')) return;

//     const result = movies.find(m => m.title.toLowerCase().includes(text));

//     if (result) {
//         const link = `https://t.me/${result.channel}/${result.msg_id}`;
//         bot.sendMessage(chatId, `🎬 *${result.title}*\n\n📥 [Click to Download](${link})`, {
//             parse_mode: 'Markdown'
//         });
//     } else {
//         bot.sendMessage(chatId, `❌ Movie not found.\nTry again with correct name.`);
//     }
// });

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

    const chatId = msg.chat.id; // will be negative ID (e.g., -100xxxx)

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


// ✅ /sendmovie test command (for known fileId)
// bot.onText(/\/sendmovie/, async (msg) => {
//     // const fileId = 'BQACAgUAAyEFAASchteRAAMEaIouoOJxKlIlPXXK0lwodGP_iOIAAjkWAAKGOFFUV5EeDSKLHv82BA';
//     const movieMap = {
//         kgf: 'BQACAgUAAyEFAASchteRAAMEaIouoOJxKlIlPXXK0lwodGP_iOIAAjkWAAKGOFFUV5EeDSKLHv82BA',
//         // Add more as needed
//     };
//     try {
//         await bot.sendDocument(msg.chat.id, movieMap.kgf, {
//             caption: `🎬 *KGF Chapter 1*\n\n🕒 Duration: 2h 34m\n📁 Size: ~1.2GB\n🔗 Download and Enjoy the movie!`,
//             parse_mode: 'Markdown'
//         });
//     } catch (err) {
//         console.error("❌ Failed to send movie:", err.message);
//     }
// });

// ✅ Express: API endpoint to forward message
// app.get('/send-movie/:id', async (req, res) => {
//     const movieMap = {
//         kgf: 'BQACAgUAAyEFAASchteRAAMEaIouoOJxKlIlPXXK0lwodGP_iOIAAjkWAAKGOFFUV5EeDSKLHv82BA',
//         // Add more as needed
//     };

//     const fileId = movieMap[req.params.id];
//     if (!fileId) return res.status(404).send("❌ Movie not found");

//     try {
//         await bot.sendDocument('@movieladownload', fileId, {
//             caption: '🎬 Your requested movie 🎉',
//             parse_mode: 'Markdown'
//         });
//         res.send('✅ Movie sent');
//     } catch (err) {
//         res.status(500).send(`❌ Telegram Error: ${err.message}`);
//     }
// });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
