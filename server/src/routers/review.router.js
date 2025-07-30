const reviewRouter = require('express').Router();
const { getAllReviews, getUserReviews, createReview, updateReview, deleteReview } = require('../controllers/review.controller');
const { restrictTo } = require('../middlewares/auth.middleware');

reviewRouter.get('/:id', getAllReviews);

reviewRouter.use(restrictTo('vendor'));

reviewRouter.get('/user', getUserReviews);
reviewRouter.post('/', createReview);
reviewRouter.put('/:id', updateReview);
reviewRouter.delete('/:id', deleteReview);

module.exports = reviewRouter;