const File = require("./Models/File");
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
                response += `${i + 1}. 🎬 *${m.movie_name}* \n🔗 [📥 Click to Download](https://t.me/movieladownloadbot?start=${m.slug}) \n\n`;
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

    bot.on("channel_post", async (msg) => {
        const adminChatId = 1364566134;
        let fileId, fileName, caption, type;

        // Detect file type
        if (msg.document) {
            fileId = msg.document.file_id;
            fileName = msg.document.file_name || "Unnamed Document";
            type = "Movie";
        } else if (msg.video) {
            fileId = msg.video.file_id;
            fileName = msg.video.file_name || "Unnamed Video";
            type = "Movie";
        } else if (msg.photo) {
            fileId = msg.photo[msg.photo.length - 1].file_id;
            fileName = "Photo Upload";
            type = "Movie";
        }

        caption = msg.caption || "";

        if (!fileId) return;

        // Extract movie name from first line of caption
        let movieName = caption.split("\n")[0].replace(/🎬/g, "").trim();
        let movie = await Movie.findOne({ movie_name: movieName });

        // Escape markdown for admin message
        // function escapeMarkdown(text) {
        //     if (!text) return "";
        //     return text.replace(/([_*[\]()~`>#+-=|{}.!])/g, "\\$1");
        // }

        // Send admin message
        const message = `
📄 *File Captured!*
📛 *Name:* ${fileName}
${caption ? `📝 *Caption:* ${caption}` : ""}
🆔 *File ID:* \`${fileId}\`
        `;
        bot.sendMessage(adminChatId, message, { parse_mode: "Markdown" });

        // Save file in DB
        const newFile = new File({
            movie: movie ? movie._id : null,
            movie_name: fileName,
            fileid: fileId,
            caption,
            type: movie ? movie.type : "Movie"
        });

        await newFile.save();
        console.log(`File saved: ${fileName} linked to movie: ${movie ? movie?.movie_name : "N/A"}`);
    });
}

module.exports = registerBotCommands;