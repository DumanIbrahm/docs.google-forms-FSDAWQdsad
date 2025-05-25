// cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config(); // Bu şart

// ✅ ENV'den Cloudinary ayarlarını al
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'cv_uploads',
        resource_type: 'raw',
        allowed_formats: ['pdf', 'doc', 'docx'],
    },
});

module.exports = { cloudinary, storage };
