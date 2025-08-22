const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();
const stream = require("stream");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djkyswpve',
    api_key: process.env.CLOUDINARY_API_KEY || '372668489675622',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'pghx8f1RzTByjpCGeaPEzpgSHdg',
});

function uploadToCloudinary(file, folder) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: file.originalname.split(".")[0], // file name without extension
                resource_type: "auto", // auto-detect image/video
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url); // ✅ return Cloudinary URL
            }
        );

        const bufferStream = new stream.PassThrough();
        bufferStream.end(file.buffer);
        bufferStream.pipe(uploadStream);
    });
}

module.exports = { cloudinary, uploadToCloudinary };
