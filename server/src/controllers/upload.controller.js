const sharp = require('sharp');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const APPError = require('../utils/appError');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', 'public', 'img', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Utility function to generate proper image URLs
const generateImageUrl = (req, filename) => {
    // Use environment variable for domain or fallback to host
    const domain = process.env.DEPLOYED_DOMAIN || req.get('host');
    
    // If we have a domain, use it; otherwise, use relative path
    if (domain) {
        return `${req.protocol}://${domain}/public/img/uploads/${filename}`;
    } else {
        // Fallback to relative path
        return `/public/img/uploads/${filename}`;
    }
};

// === 1. Multer Setup ===
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) cb(null, true);
    else cb(new APPError('Only image files are allowed!', 400), false);
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

// === 2. Middleware for Uploading ===
exports.uploadSingleImage = upload.single('image'); // expects field 'image'
exports.uploadMultipleImages = upload.array('images', 5); // expects field 'images'

// === 3. Resize Single Image ===
exports.resizeSingleImage = async (req, res, next) => {
    if (!req.file) {
        return next(new APPError('No file uploaded', 400));
    }

    const filename = `user-${Date.now()}.jpeg`;
    req.file.filename = filename;

    try {
        const filePath = path.join(uploadDir, filename);
        
        await sharp(req.file.buffer)
            .resize(500, 500)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(filePath);

        next();
    } catch (error) {
        next(new APPError('Error processing image: ' + error.message, 500));
    }
};

// === 4. Resize Multiple Images ===
exports.resizeMultipleImages = async (req, res, next) => {
    if (!req.files || !req.files.length) {
        return next(new APPError('No files uploaded', 400));
    }

    req.body.images = [];

    try {
        await Promise.all(
            req.files.map(async (file, i) => {
                const filename = `gallery-${Date.now()}-${i + 1}.jpeg`;
                const filePath = path.join(uploadDir, filename);
                
                await sharp(file.buffer)
                    .resize(500, 500)
                    .toFormat('jpeg')
                    .jpeg({ quality: 90 })
                    .toFile(filePath);

                req.body.images.push(filename);
            })
        );

        next();
    } catch (error) {
        next(new APPError('Error processing images: ' + error.message, 500));
    }
};

// === 5. Final Controllers to Send Response ===
exports.handleSingleUpload = (req, res) => {
    const fileUrl = generateImageUrl(req, req.file.filename);

    res.status(200).json({
        status: 'success',
        file: fileUrl,
    });
};


exports.handleMultipleUpload = (req, res) => {
    const fileUrls = req.body.images.map(filename => {
        return generateImageUrl(req, filename);
    });

    res.status(200).json({
        status: 'success',
        files: fileUrls,
    });
};

