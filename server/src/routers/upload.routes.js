const uploadRouter = require('express').Router();
const uploadController = require('../controllers/upload.controller');
const { restrictTo } = require('../middlewares/auth.middleware');

// === Single Image Upload ===
// POST /api/upload/single
uploadRouter.post(
  '/single',
  restrictTo('supplier'), // Only suppliers can upload images
  uploadController.uploadSingleImage,
  uploadController.resizeSingleImage,
  uploadController.handleSingleUpload
);

// === Multiple Image Upload ===
// POST /api/upload/multiple
uploadRouter.post(
  '/multiple',
  restrictTo('supplier'), // Only suppliers can upload images
  uploadController.uploadMultipleImages,
  uploadController.resizeMultipleImages,
  uploadController.handleMultipleUpload
);

module.exports = uploadRouter;
