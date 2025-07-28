const Order = require('../models/order.model');
const Material = require('../models/material.model');
const User = require('../models/user.model');
const Address = require('../models/address.model');
const { getOneByFilter, updateOneByFilter, createOne, deleteOneByFilter, getAllByFilter } = require('./factory.controller');
const APPError = require('../utils/appError');

// 🔍 Get Vendor Orders
exports.getVendorOrders = (req, res, next) => {
    return getAllByFilter(Order, req => ({
        vendorId: req.user.id
    }), [
        {
            path: 'supplierId',
            select: 'fullname email phone'
        },
        {
            path: 'materialId',
            select: 'name pricePerUnit unit'
        },
        {
            path: 'vendorAddressId',
            select: 'street city state pincode'
        },
        {
            path: 'supplierAddressId',
            select: 'street city state pincode'
        }
    ])(req, res, next);
};

// 🔍 Get Supplier Orders
exports.getSupplierOrders = (req, res, next) => {
    return getAllByFilter(Order, req => ({
        supplierId: req.user.id
    }), [
        {
            path: 'vendorId',
            select: 'fullname email phone'
        },
        {
            path: 'materialId',
            select: 'name pricePerUnit unit'
        },
        {
            path: 'vendorAddressId',
            select: 'street city state pincode'
        },
        {
            path: 'supplierAddressId',
            select: 'street city state pincode'
        }
    ])(req, res, next);
};

// ➕ Create New Order (Vendor)
exports.createOrder = async (req, res, next) => {
    try {
        const { materialId, quantity, supplierId, vendorAddressId, supplierAddressId } = req.body;

        // Validate material exists and get price
        const material = await Material.findById(materialId);
        if (!material) {
            return next(new APPError('Material not found', 404));
        }

        // Validate supplier exists
        const supplier = await User.findById(supplierId);
        if (!supplier || supplier.role !== 'supplier') {
            return next(new APPError('Supplier not found', 404));
        }

        // Calculate total amount
        const totalAmount = material.pricePerUnit * quantity;

        // Create order
        const orderData = {
            vendorId: req.user.id,
            supplierId,
            materialId,
            quantity,
            totalAmount,
            vendorAddressId: vendorAddressId || undefined,
            supplierAddressId: supplierAddressId || undefined,
            status: 'pending'
        };

        // Set the order data in req.body for the factory controller
        req.body = orderData;
        return createOne(Order)(req, res, next);
    } catch (error) {
        next(error);
    }
};

// ✅ Accept Order (Supplier)
exports.acceptOrder = async (req, res, next) => {
    try {
        const { note } = req.body;
        const orderId = req.params.id;

        // Validate order exists and belongs to supplier
        const order = await Order.findOne({
            _id: orderId,
            supplierId: req.user.id,
            status: 'pending'
        });

        if (!order) {
            return next(new APPError('Order not found, access denied, or already processed', 404));
        }

        // Update status to accepted
        order.status = 'accepted';
        if (note) {
            order.notes = order.notes || [];
            order.notes.push({
                message: `Order accepted: ${note}`,
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        } else {
            order.notes = order.notes || [];
            order.notes.push({
                message: 'Order accepted by supplier',
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        }

        await order.save();

        res.status(200).json({
            status: 'success',
            message: 'Order accepted successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// ❌ Reject Order (Supplier)
exports.rejectOrder = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const orderId = req.params.id;

        if (!reason) {
            return next(new APPError('Rejection reason is required', 400));
        }

        // Validate order exists and belongs to supplier
        const order = await Order.findOne({
            _id: orderId,
            supplierId: req.user.id,
            status: 'pending'
        });

        if (!order) {
            return next(new APPError('Order not found, access denied, or already processed', 404));
        }

        // Update status to rejected
        order.status = 'rejected';
        order.notes = order.notes || [];
        order.notes.push({
            message: `Order rejected: ${reason}`,
            timestamp: new Date(),
            updatedBy: req.user.id
        });

        await order.save();

        res.status(200).json({
            status: 'success',
            message: 'Order rejected successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// 🔄 Start Preparing Order (Supplier)
exports.startPreparing = async (req, res, next) => {
    try {
        const { note } = req.body;
        const orderId = req.params.id;

        // Validate order exists and belongs to supplier
        const order = await Order.findOne({
            _id: orderId,
            supplierId: req.user.id,
            status: 'accepted'
        });

        if (!order) {
            return next(new APPError('Order not found, access denied, or not in accepted status', 404));
        }

        // Update status to preparing
        order.status = 'preparing';
        if (note) {
            order.notes = order.notes || [];
            order.notes.push({
                message: `Started preparing: ${note}`,
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        } else {
            order.notes = order.notes || [];
            order.notes.push({
                message: 'Order preparation started',
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        }

        await order.save();

        res.status(200).json({
            status: 'success',
            message: 'Order preparation started successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// 📦 Mark Order as Packed (Supplier)
exports.markAsPacked = async (req, res, next) => {
    try {
        const { note } = req.body;
        const orderId = req.params.id;

        // First, find the order without status restriction to see what the current status is
        const order = await Order.findOne({
            _id: orderId,
            supplierId: req.user.id
        });

        if (!order) {
            return next(new APPError('Order not found or access denied', 404));
        }

        // If order status is undefined, set it to pending (this is a fallback)
        if (!order.status) {
            order.status = 'pending';
            await order.save();
        }

        // Check if the order is in the correct status for packing
        if (order.status !== 'preparing') {
            // Provide helpful information about what actions are available
            let availableActions = [];
            switch (order.status) {
                case 'pending':
                    availableActions = ['accept', 'reject'];
                    break;
                case 'accepted':
                    availableActions = ['start preparing'];
                    break;
                case 'preparing':
                    availableActions = ['pack'];
                    break;
                case 'packed':
                    availableActions = ['start transit'];
                    break;
                case 'in_transit':
                    availableActions = ['out for delivery'];
                    break;
                case 'out_for_delivery':
                    availableActions = ['mark as delivered'];
                    break;
                default:
                    availableActions = ['check order status'];
            }
            
            return next(new APPError(
                `Order is in '${order.status}' status. Can only pack orders that are in 'preparing' status. ` +
                `Available actions for current status: ${availableActions.join(', ')}`, 
                400
            ));
        }

        // Update status to packed
        order.status = 'packed';
        if (note) {
            order.notes = order.notes || [];
            order.notes.push({
                message: `Order packed: ${note}`,
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        } else {
            order.notes = order.notes || [];
            order.notes.push({
                message: 'Order packed and ready for dispatch',
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        }

        await order.save();

        res.status(200).json({
            status: 'success',
            message: 'Order marked as packed successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// 🚚 Start Transit (Supplier)
exports.startTransit = async (req, res, next) => {
    try {
        const { note } = req.body;
        const orderId = req.params.id;

        // First, find the order without status restriction to see what the current status is
        const order = await Order.findOne({
            _id: orderId,
            supplierId: req.user.id
        });

        if (!order) {
            return next(new APPError('Order not found or access denied', 404));
        }

        // Check if the order is in the correct status for transit
        if (order.status !== 'packed') {
            return next(new APPError(`Order is in '${order.status}' status. Can only start transit for orders that are in 'packed' status.`, 400));
        }

        // Update status to in_transit
        order.status = 'in_transit';
        if (note) {
            order.notes = order.notes || [];
            order.notes.push({
                message: `Order in transit: ${note}`,
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        } else {
            order.notes = order.notes || [];
            order.notes.push({
                message: 'Order started in transit',
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        }

        await order.save();

        res.status(200).json({
            status: 'success',
            message: 'Order started in transit successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// 🛵 Out for Delivery (Supplier)
exports.outForDelivery = async (req, res, next) => {
    try {
        const { note } = req.body;
        const orderId = req.params.id;

        // First, find the order without status restriction to see what the current status is
        const order = await Order.findOne({
            _id: orderId,
            supplierId: req.user.id
        });

        if (!order) {
            return next(new APPError('Order not found or access denied', 404));
        }

        // Check if the order is in the correct status for delivery
        if (order.status !== 'in_transit') {
            return next(new APPError(`Order is in '${order.status}' status. Can only mark as out for delivery orders that are in 'in_transit' status.`, 400));
        }

        // Update status to out_for_delivery
        order.status = 'out_for_delivery';
        if (note) {
            order.notes = order.notes || [];
            order.notes.push({
                message: `Order out for delivery: ${note}`,
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        } else {
            order.notes = order.notes || [];
            order.notes.push({
                message: 'Order out for delivery',
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        }

        await order.save();

        res.status(200).json({
            status: 'success',
            message: 'Order marked as out for delivery successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// 🎉 Mark as Delivered (Supplier)
exports.markAsDelivered = async (req, res, next) => {
    try {
        const { note } = req.body;
        const orderId = req.params.id;

        // First, find the order without status restriction to see what the current status is
        const order = await Order.findOne({
            _id: orderId,
            supplierId: req.user.id
        });

        if (!order) {
            return next(new APPError('Order not found or access denied', 404));
        }

        // Check if the order is in the correct status for delivered
        if (order.status !== 'out_for_delivery') {
            return next(new APPError(`Order is in '${order.status}' status. Can only mark as delivered orders that are in 'out_for_delivery' status.`, 400));
        }

        // Update status to delivered
        order.status = 'delivered';
        if (note) {
            order.notes = order.notes || [];
            order.notes.push({
                message: `Order delivered: ${note}`,
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        } else {
            order.notes = order.notes || [];
            order.notes.push({
                message: 'Order delivered successfully',
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        }

        await order.save();

        res.status(200).json({
            status: 'success',
            message: 'Order marked as delivered successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// 🔍 Get Order Status (for debugging)
exports.getOrderStatus = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        
        const order = await Order.findById(orderId).populate('vendorId', 'fullname email phone');
        
        if (!order) {
            return next(new APPError('Order not found', 404));
        }
        
        res.status(200).json({
            status: 'success',
            data: {
                orderId: order._id,
                currentStatus: order.status,
                vendor: order.vendorId,
                supplierId: order.supplierId,
                createdAt: order.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// 📝 Update Order Status (Supplier) - General status update
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status, note } = req.body;
        const orderId = req.params.id;

        // Validate order exists and belongs to supplier
        const order = await Order.findOne({
            _id: orderId,
            supplierId: req.user.id
        });

        if (!order) {
            return next(new APPError('Order not found or access denied', 404));
        }

        // Validate status transition
        const validTransitions = {
            'pending': ['accepted', 'rejected'],
            'accepted': ['preparing', 'cancelled'],
            'preparing': ['packed', 'cancelled'],
            'packed': ['in_transit', 'cancelled'],
            'in_transit': ['out_for_delivery', 'cancelled'],
            'out_for_delivery': ['delivered', 'cancelled'],
            'delivered': [],
            'cancelled': [],
            'rejected': []
        };

        if (!validTransitions[order.status].includes(status)) {
            return next(new APPError(`Invalid status transition from ${order.status} to ${status}`, 400));
        }

        // Update status
        order.status = status;
        if (note) {
            order.notes = order.notes || [];
            order.notes.push({
                message: `Status updated to ${status}: ${note}`,
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        } else {
            order.notes = order.notes || [];
            order.notes.push({
                message: `Status updated to ${status}`,
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        }

        await order.save();

        res.status(200).json({
            status: 'success',
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// 🔍 Get Order Details
exports.getOrderDetails = (req, res, next) => {
    const filter = req.user.role === 'vendor' 
        ? { _id: req.params.id, vendorId: req.user.id }
        : { _id: req.params.id, supplierId: req.user.id };

    return getOneByFilter(Order, () => filter, [
        {
            path: 'vendorId',
            select: 'fullname email phone'
        },
        {
            path: 'supplierId',
            select: 'fullname email phone'
        },
        {
            path: 'materialId',
            select: 'name pricePerUnit unit description'
        },
        {
            path: 'vendorAddressId',
            select: 'street city state pincode'
        },
        {
            path: 'supplierAddressId',
            select: 'street city state pincode'
        }
    ])(req, res, next);
};

// 📊 Get Order Statistics
exports.getOrderStats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        const filter = userRole === 'vendor' ? { vendorId: userId } : { supplierId: userId };

        // Get all orders for the user
        const orders = await Order.find(filter);

        // Calculate statistics
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        const acceptedOrders = orders.filter(order => order.status === 'accepted').length;
        const preparingOrders = orders.filter(order => order.status === 'preparing').length;
        const packedOrders = orders.filter(order => order.status === 'packed').length;
        const inTransitOrders = orders.filter(order => order.status === 'in_transit').length;
        const outForDeliveryOrders = orders.filter(order => order.status === 'out_for_delivery').length;
        const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
        const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
        const rejectedOrders = orders.filter(order => order.status === 'rejected').length;
        const activeOrders = orders.filter(order => ['pending', 'accepted', 'preparing', 'packed', 'in_transit', 'out_for_delivery'].includes(order.status)).length;
        const completedOrders = orders.filter(order => order.status === 'delivered').length;
        const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;

        // Get monthly stats
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        });
        const monthlyAmount = monthlyOrders.reduce((sum, order) => sum + order.totalAmount, 0);

        res.status(200).json({
            status: 'success',
            data: {
                totalOrders,
                pendingOrders,
                acceptedOrders,
                preparingOrders,
                packedOrders,
                inTransitOrders,
                outForDeliveryOrders,
                deliveredOrders,
                cancelledOrders,
                rejectedOrders,
                activeOrders,
                completedOrders,
                totalAmount,
                averageOrderValue,
                monthlyOrders: monthlyOrders.length,
                monthlyAmount
            }
        });
    } catch (error) {
        next(error);
    }
};