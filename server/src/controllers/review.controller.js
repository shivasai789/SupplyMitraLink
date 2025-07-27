const Review = require('../models/review.model');
const { getOneByFilter, updateOneByFilter, createOne, deleteOneByFilter, getAllByFilter } = require('./factory.controller');

// 🔍 Get All Reviews for a Material
exports.getAllReviews = (req, res, next) => {
    const filter = {
        materialId: req.params.id,
        ...(req.user.role === 'supplier'
            ? { supplierId: req.user.id }
            : { userId: req.user.id })
    };

    return getAllByFilter(
        Review,
        () => filter,
        [
            {
                path: 'userId',
                select: 'fullname'
            },
            {
                path: 'supplierId',
                select: 'fullname'
            }
        ]
    )(req, res, next);
};


// ➕ Create a New Review
exports.createReview = (req, res, next) => {
    req.body.userId = req.user.id; // Set userId from authenticated user
    return createOne(Review)(req, res, next);
}

// 📝 Update Review by ID
exports.updateReview = (req, res, next) => {
    return updateOneByFilter(Review, req => ({
        _id: req.params.id,
        userId: req.user.id // Ensure only user can update their review
    }))(req, res, next);
}

// ✅ Delete Review by ID
exports.deleteReview = (req, res, next) => {
    return deleteOneByFilter(Review, req => ({
        _id: req.params.id,
        userId: req.user.id // Ensure only user can delete their review
    }))(req, res, next);
}