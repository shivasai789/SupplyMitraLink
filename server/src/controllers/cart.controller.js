const Cart = require('../models/cart.model');
const Material = require('../models/material.model');
const { getOneByFilter, updateOneByFilter, createOne, deleteOneByFilter, getAllByFilter } = require('./factory.controller');
const APPError = require('../utils/appError');

// 🔍 Get All Cart Items for Vendor
exports.getAllCartItems = (req, res, next) => {
    return getAllByFilter(Cart, req => ({
        vendorId: req.user.id
    }), [
        {
            path: 'materialId',
            select: 'name pricePerUnit unit description availableQuantity'
        },
        {
            path: 'supplierId',
            select: 'fullname email phone'
        }
    ])(req, res, next);
};

// 🔍 Get Specific Cart Item
exports.getCartItem = (req, res, next) => {
    return getOneByFilter(Cart, req => ({
        _id: req.params.id,
        vendorId: req.user.id
    }), [
        {
            path: 'materialId',
            select: 'name pricePerUnit unit description availableQuantity'
        },
        {
            path: 'supplierId',
            select: 'fullname email phone'
        }
    ])(req, res, next);
};

// ➕ Add Item to Cart
exports.addToCart = async (req, res, next) => {
    try {
        const { materialId, quantity } = req.body;
        const vendorId = req.user.id;

        // Validate material exists
        const material = await Material.findById(materialId);
        if (!material) {
            return next(new APPError('Material not found', 404));
        }

        // Check if quantity is available
        if (material.availableQuantity < quantity) {
            return next(new APPError('Requested quantity not available', 400));
        }

        // Check if item already exists in cart
        const existingCartItem = await Cart.findOne({
            vendorId,
            materialId,
            supplierId: material.supplierId
        });

        if (existingCartItem) {
            // Update quantity
            existingCartItem.quantity += quantity;
            await existingCartItem.save();

            return res.status(200).json({
                status: 'success',
                message: 'Cart item updated successfully',
                data: existingCartItem
            });
        }

        // Create new cart item
        const cartData = {
            vendorId,
            materialId,
            supplierId: material.supplierId,
            quantity
        };

        req.body = cartData;
        return createOne(Cart)(req, res, next);
    } catch (error) {
        next(error);
    }
};

// 📝 Update Cart Item Quantity
exports.updateCartItem = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        const cartItemId = req.params.id;

        // Find cart item
        const cartItem = await Cart.findOne({
            _id: cartItemId,
            vendorId: req.user.id
        });

        if (!cartItem) {
            return next(new APPError('Cart item not found', 404));
        }

        // Validate material availability
        const material = await Material.findById(cartItem.materialId);
        if (!material) {
            return next(new APPError('Material not found', 404));
        }

        if (material.availableQuantity < quantity) {
            return next(new APPError('Requested quantity not available', 400));
        }

        // Update quantity
        cartItem.quantity = quantity;
        await cartItem.save();

        res.status(200).json({
            status: 'success',
            message: 'Cart item updated successfully',
            data: cartItem
        });
    } catch (error) {
        next(error);
    }
};

// ❌ Remove Item from Cart
exports.removeFromCart = (req, res, next) => {
    return deleteOneByFilter(Cart, req => ({
        _id: req.params.id,
        vendorId: req.user.id
    }))(req, res, next);
};

// 🗑️ Clear Cart
exports.clearCart = async (req, res, next) => {
    try {
        await Cart.deleteMany({ vendorId: req.user.id });

        res.status(200).json({
            status: 'success',
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        next(error);
    }
};

// 📊 Get Cart Summary
exports.getCartSummary = async (req, res, next) => {
    try {
        const cartItems = await Cart.find({ vendorId: req.user.id })
            .populate('materialId', 'name pricePerUnit unit')
            .populate('supplierId', 'fullname');

        const summary = {
            totalItems: cartItems.length,
            totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
            totalAmount: cartItems.reduce((sum, item) => {
                return sum + (item.materialId.pricePerUnit * item.quantity);
            }, 0),
            items: cartItems.map(item => ({
                _id: item._id,
                material: item.materialId.name,
                supplier: item.supplierId.fullname,
                quantity: item.quantity,
                unit: item.materialId.unit,
                pricePerUnit: item.materialId.pricePerUnit,
                totalPrice: item.materialId.pricePerUnit * item.quantity
            }))
        };

        res.status(200).json({
            status: 'success',
            data: summary
        });
    } catch (error) {
        next(error);
    }
};
