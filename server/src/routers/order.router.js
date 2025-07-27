const orderRouter = require('express').Router();
const { 
    getVendorOrders, 
    getSupplierOrders, 
    createOrder, 
    updateOrderStatus, 
    getOrderDetails, 
    getOrderStats,
    acceptOrder,
    rejectOrder,
    startPreparing,
    markAsPacked,
    startTransit,
    outForDelivery,
    markAsDelivered,
    getOrderStatus
} = require('../controllers/order.controller');
const { restrictTo } = require('../middlewares/auth.middleware');

// Vendor routes
orderRouter.get('/vendor', restrictTo('vendor'), getVendorOrders);
orderRouter.post('/vendor', restrictTo('vendor'), createOrder);
orderRouter.get('/vendor/stats', restrictTo('vendor'), getOrderStats);

// Order status management routes (Supplier only) - Must come before /supplier routes
orderRouter.post('/supplier/:id/accept', restrictTo('supplier'), acceptOrder);
orderRouter.post('/supplier/:id/reject', restrictTo('supplier'), rejectOrder);
orderRouter.post('/supplier/:id/prepare', restrictTo('supplier'), startPreparing);
orderRouter.post('/supplier/:id/pack', restrictTo('supplier'), markAsPacked);
orderRouter.post('/supplier/:id/transit', restrictTo('supplier'), startTransit);
orderRouter.post('/supplier/:id/delivery', restrictTo('supplier'), outForDelivery);
orderRouter.post('/supplier/:id/delivered', restrictTo('supplier'), markAsDelivered);
orderRouter.patch('/supplier/:id/status', restrictTo('supplier'), updateOrderStatus);

// Supplier routes
orderRouter.get('/supplier', restrictTo('supplier'), getSupplierOrders);
orderRouter.get('/supplier/stats', restrictTo('supplier'), getOrderStats);

// Debug route to check order status
orderRouter.get('/:id/status', getOrderStatus);

// Common routes
orderRouter.get('/:id', getOrderDetails);

module.exports = orderRouter;