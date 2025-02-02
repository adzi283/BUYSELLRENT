const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set up storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'iiit-buy-sell', // Images will be stored in this folder
    allowed_formats: ['jpg', 'jpeg', 'png'] // Only allow these formats
  }
});

// Create multer upload middleware
const upload = multer({ storage: storage });

module.exports = { upload, cloudinary }; 