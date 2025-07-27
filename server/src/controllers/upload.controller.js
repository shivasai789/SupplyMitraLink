const sharp = require('sharp');
const multer = require('multer');
const APPError = require('../utils/appError');

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
        await sharp(req.file.buffer)
            .resize(500, 500)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/uploads/${filename}`);

        next();
    } catch (error) {
        next(new APPError('Error processing image', 500));
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
                await sharp(file.buffer)
                    .resize(500, 500)
                    .toFormat('jpeg')
                    .jpeg({ quality: 90 })
                    .toFile(`public/img/uploads/${filename}`);

                req.body.images.push(filename);
            })
        );

        next();
    } catch (error) {
        next(new APPError('Error processing images', 500));
    }
};

// === 5. Final Controllers to Send Response ===
exports.handleSingleUpload = (req, res) => {
    const fileUrl = `${req.protocol}://${req.get('host')}/public/img/uploads/${req.file.filename}`;

    res.status(200).json({
        status: 'success',
        file: fileUrl,
    });
};


exports.handleMultipleUpload = (req, res) => {
    const fileUrls = req.body.images.map(filename => {
        return `${req.protocol}://${req.get('host')}/public/img/uploads/${filename}`;
    });

    res.status(200).json({
        status: 'success',
        files: fileUrls,
    });
};

