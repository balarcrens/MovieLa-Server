const Movie = require("./Models/Movie");

function registerBotCommands(bot) {
    bot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(
            chatId,
            `🤖 *Moviela Bot Help*\n
/help - Show this help menu
/websitelink - Get the official Moviela website
/moviela <movie-slug> - Download a specific movie or webseries
/latest - Get the latest uploaded movies`,
            { parse_mode: "Markdown" }
        );
    });

    bot.onText(/\/websitelink/, async (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(
            chatId,
            `🌐 Visit our website for more movies:\n👉 https://moviela.vercel.app`
        );
    });

    // ---------------- LATEST ----------------
    bot.onText(/\/latest/, async (msg) => {
        const chatId = msg.chat.id;

        try {
            const latestMovies = await Movie.find()
                .sort({ createdAt: -1 })
                .limit(5);

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

    // ---------------- START ----------------
    bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const payload = match[1]?.trim();

        if (!payload) {
            return bot.sendMessage(
                chatId,
                `🎬 Welcome to Moviela Bot!\nDownload Your Favourite Movie or WebSeries From The Website.\n👉 https://moviela.vercel.app`
            );
        }

        try {
            let movie;
            if (payload.startsWith("episode_")) {
                const parts = payload.split("_"); // ["episode", "slug", "number"]
                const slug = parts[1];
                const episodeNumber = parseInt(parts[2]);

                movie = await Movie.findOne({ slug });
                if (!movie || movie.type !== "WebSeries") {
                    return bot.sendMessage(chatId, "❌ Series not found.");
                }

                const episode = movie.episodes.find(ep => ep.episode_number === episodeNumber);
                if (!episode) {
                    return bot.sendMessage(chatId, "❌ Episode not found.");
                }

                // ✅ Send episode in movie-style caption
                return bot.sendDocument(chatId, episode.fileid, {
                    caption: `━━━━━━━━━━━━━━
                        🎬 *${movie.movie_name}*
                        ━━━━━━━━━━━━━━
                        💡 Title: _${episode.title || "Untitled Episode"}_
                        🕒 Duration: *${episode.duration || "N/A"}*
                        📁 Size: *${episode.size || "N/A"}*
                        ━━━━━━━━━━━━━━
                        ⚡ Download & Enjoy!`,
                    parse_mode: "Markdown"
                });
            }

            movie = await Movie.findOne({ fileid: payload }) || await Movie.findOne({ slug: payload.toLowerCase() });
            if (!movie) return bot.sendMessage(chatId, `❌ Content not found for: ${payload}`);

            if (movie.type === "Movie") {
                return bot.sendDocument(chatId, movie.fileid, {
                    caption: `━━━━━━━━━━━━━━
                        🎬 *${movie.movie_name}*
                        ━━━━━━━━━━━━━━
                        🕒 Duration: *${movie.duration || "N/A"}*
                        📁 Size: *${movie.size || "N/A"}*
                        ⭐ Rating: *${movie.rating || "N/A"}*
                        ━━━━━━━━━━━━━━
                        ⚡ Download & Enjoy!`,
                    parse_mode: "Markdown"
                });
            } else if (movie.type === "WebSeries") {
                if (!movie.episodes || movie.episodes.length === 0) {
                    return bot.sendMessage(chatId, `❌ No episodes available for *${movie.movie_name}*`, { parse_mode: "Markdown" });
                }

                // ✅ Send first episode in movie-style caption
                const firstEpisode = movie.episodes[0];
                return bot.sendDocument(chatId, firstEpisode.fileid, {
                    caption: `━━━━━━━━━━━━━━
                        🎬 *${movie.movie_name}*
                        ━━━━━━━━━━━━━━
                        💡 Title: _${firstEpisode.title || "Untitled Episode"}_
                        🕒 Duration: *${firstEpisode.duration || "N/A"}*
                        📁 Size: *${firstEpisode.size || "N/A"}*
                        ━━━━━━━━━━━━━━
                        ⚡ Download & Enjoy!`,
                    parse_mode: "Markdown"
                });
            }

        } catch (err) {
            console.error("❌ Error:", err.message);
            bot.sendMessage(chatId, `❌ Something went wrong. Try again later.`);
        }
    });

    // ---------------- EPISODE DOWNLOAD ----------------
    bot.onText(/\/episode_(.+)_(\d+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const slug = match[1];
        const episodeNumber = parseInt(match[2]);

        try {
            const movie = await Movie.findOne({ slug });
            if (!movie || movie.type !== "WebSeries") {
                return bot.sendMessage(chatId, "❌ Series not found.");
            }

            const episode = movie.episodes.find(ep => ep.episode_number === episodeNumber);
            if (!episode) {
                return bot.sendMessage(chatId, "❌ Episode not found.");
            }

            // Send Episode File
            return bot.sendDocument(chatId, episode.fileid, {
                caption: `📺 *${movie.movie_name}* - Ep ${episode.episode_number}\n${episode.title || ""}\n\n🕒 Duration: ${episode.duration || "N/A"}\n📁 Size: ${episode.size || "N/A"}`,
                parse_mode: "Markdown"
            });
        } catch (err) {
            console.error("❌ Error:", err.message);
            bot.sendMessage(chatId, "❌ Something went wrong.");
        }
    });

    // ---------------- CHANNEL POST (FileID Capture) ----------------
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
}

module.exports = registerBotCommands;