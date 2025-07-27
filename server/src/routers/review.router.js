const reviewRouter = require('express').Router();
const { getAllReviews, getReview, createReview, updateReview, deleteReview } = require('../controllers/review.controller');
const { restrictTo } = require('../middlewares/auth.middleware');

reviewRouter.get('/:id', getAllReviews);

reviewRouter.use(restrictTo('vendor'));

reviewRouter.post('/', createReview);
reviewRouter.put('/:id', updateReview);
reviewRouter.delete('/:id', deleteReview);

module.exports = reviewRouter;