const cartRouter = require('express').Router();
const { 
    getAllCartItems, 
    getCartItem, 
    addToCart, 
    updateCartItem, 
    removeFromCart, 
    clearCart, 
    getCartSummary 
} = require('../controllers/cart.controller');
const { restrictTo } = require('../middlewares/auth.middleware');

// Cart operations
cartRouter.get('/', restrictTo('vendor'), getAllCartItems);
cartRouter.get('/summary', restrictTo('vendor'), getCartSummary);
cartRouter.get('/:id', restrictTo('vendor'), getCartItem);
cartRouter.post('/add', restrictTo('vendor'), addToCart);
cartRouter.put('/:id', restrictTo('vendor'), updateCartItem);
cartRouter.delete('/:id', restrictTo('vendor'), removeFromCart);
cartRouter.delete('/', restrictTo('vendor'), clearCart);

module.exports = cartRouter;