const ImageKit = require("imagekit");
const dotenv = require("dotenv");

dotenv.config();

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Upload function
function uploadToImageKit(file, folder) {
    return new Promise((resolve, reject) => {
        imagekit.upload(
            {
                file: file.buffer,               // multer memory storage
                fileName: `${Date.now()}-${file.originalname}`,
                folder: folder,                  // e.g. /movies/posters
                useUniqueFileName: true,
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.url); // FULL ImageKit URL
                }
            }
        );
    });
}

module.exports = { imagekit, uploadToImageKit };