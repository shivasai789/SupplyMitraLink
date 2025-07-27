const routes = require('express').Router();

const cartRouter = require('./cart.routes');
const materialRouter = require('./material.router');
const reviewRouter = require('./review.router');
const userRouter = require('./user.router');
const authRouter = require('./auth.router');
const addressRouter = require('./address.router');
const orderRouter = require('./order.router');
const uploadRouter = require('./upload.routes');
const supplierRouter = require('./supplier.router');
const { protect } = require('../middlewares/auth.middleware');

// Public routes (no authentication required)
routes.use('/auth', authRouter);

// Protected routes (authentication required)
routes.use(protect);
routes.use('/cart', cartRouter);
routes.use('/material', materialRouter);
routes.use('/review', reviewRouter);
routes.use('/user', userRouter);
routes.use('/address', addressRouter);
routes.use('/order', orderRouter);
routes.use('/upload', uploadRouter);
routes.use('/supplier', supplierRouter);

module.exports = routes;