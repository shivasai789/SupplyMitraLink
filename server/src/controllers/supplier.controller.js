const Order = require('../models/order.model');
const Material = require('../models/material.model');
const User = require('../models/user.model');
const { getOneByFilter, getAllByFilter } = require('./factory.controller');
const APPError = require('../utils/appError');

// 📊 Get Supplier Dashboard Analytics
exports.getSupplierDashboardStats = async (req, res, next) => {
    try {
        const supplierId = req.user.id;

        // Get all materials for the supplier
        const materials = await Material.find({ supplierId });
        
        // Get all orders for the supplier
        const orders = await Order.find({ supplierId });

        // Calculate material statistics
        const totalMaterials = materials.length;
        const activeMaterials = materials.filter(m => m.availableQuantity > 0).length;
        const lowStockMaterials = materials.filter(m => m.availableQuantity <= 10).length;
        const outOfStockMaterials = materials.filter(m => m.availableQuantity === 0).length;

        // Calculate order statistics
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
        const activeOrders = orders.filter(o => ['pending', 'confirmed', 'packed', 'in_transit', 'out_for_delivery'].includes(o.status)).length;
        const completedOrders = orders.filter(o => o.status === 'delivered').length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calculate monthly statistics
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        });
        const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.totalAmount, 0);

        // Calculate performance metrics
        const orderCompletionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
        const averageResponseTime = 2.5; // Mock data - would need to track actual response times

        res.status(200).json({
            status: 'success',
            data: {
                // Material stats
                totalMaterials,
                activeMaterials,
                lowStockMaterials,
                outOfStockMaterials,
                
                // Order stats
                totalOrders,
                pendingOrders,
                confirmedOrders,
                activeOrders,
                completedOrders,
                
                // Financial stats
                totalRevenue,
                averageOrderValue,
                monthlyOrders: monthlyOrders.length,
                monthlyRevenue,
                
                // Performance metrics
                orderCompletionRate: Math.round(orderCompletionRate * 100) / 100,
                averageResponseTime
            }
        });
    } catch (error) {
        next(error);
    }
};

// 📦 Get Supplier Inventory Overview
exports.getSupplierInventory = async (req, res, next) => {
    try {
        const supplierId = req.user.id;
        const { category, lowStock, outOfStock } = req.query;

        let filter = { supplierId };

        // Apply filters
        if (category) {
            filter.category = category;
        }
        if (lowStock === 'true') {
            filter.availableQuantity = { $lte: 10, $gt: 0 };
        }
        if (outOfStock === 'true') {
            filter.availableQuantity = 0;
        }

        const materials = await Material.find(filter).sort({ availableQuantity: 1 });

        // Calculate inventory summary
        const totalItems = materials.length;
        const totalValue = materials.reduce((sum, material) => sum + (material.pricePerUnit * material.availableQuantity), 0);
        const lowStockItems = materials.filter(m => m.availableQuantity <= 10 && m.availableQuantity > 0).length;
        const outOfStockItems = materials.filter(m => m.availableQuantity === 0).length;

        res.status(200).json({
            status: 'success',
            data: {
                materials,
                summary: {
                    totalItems,
                    totalValue,
                    lowStockItems,
                    outOfStockItems
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// 🔄 Bulk Update Inventory
exports.bulkUpdateInventory = async (req, res, next) => {
    try {
        const supplierId = req.user.id;
        const { updates } = req.body;

        if (!Array.isArray(updates) || updates.length === 0) {
            return next(new APPError('Updates array is required', 400));
        }

        const results = [];
        const errors = [];

        for (const update of updates) {
            try {
                const { materialId, availableQuantity, pricePerUnit } = update;

                if (!materialId) {
                    errors.push({ materialId, error: 'Material ID is required' });
                    continue;
                }

                const material = await Material.findOne({
                    _id: materialId,
                    supplierId
                });

                if (!material) {
                    errors.push({ materialId, error: 'Material not found or access denied' });
                    continue;
                }

                const updateData = {};
                if (availableQuantity !== undefined) updateData.availableQuantity = availableQuantity;
                if (pricePerUnit !== undefined) updateData.pricePerUnit = pricePerUnit;

                const updatedMaterial = await Material.findByIdAndUpdate(
                    materialId,
                    updateData,
                    { new: true }
                );

                results.push(updatedMaterial);
            } catch (error) {
                errors.push({ materialId: update.materialId, error: error.message });
            }
        }

        res.status(200).json({
            status: 'success',
            data: {
                updated: results,
                errors
            },
            message: `Successfully updated ${results.length} materials${errors.length > 0 ? `, ${errors.length} failed` : ''}`
        });
    } catch (error) {
        next(error);
    }
};

// 🚨 Get Low Stock Alerts
exports.getLowStockAlerts = async (req, res, next) => {
    try {
        const supplierId = req.user.id;
        const { threshold = 10 } = req.query;

        const lowStockMaterials = await Material.find({
            supplierId,
            availableQuantity: { $lte: parseInt(threshold), $gt: 0 }
        }).sort({ availableQuantity: 1 });

        const outOfStockMaterials = await Material.find({
            supplierId,
            availableQuantity: 0
        });

        res.status(200).json({
            status: 'success',
            data: {
                lowStock: lowStockMaterials,
                outOfStock: outOfStockMaterials,
                totalAlerts: lowStockMaterials.length + outOfStockMaterials.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// 👥 Get Supplier Customers
exports.getSupplierCustomers = async (req, res, next) => {
    try {
        const supplierId = req.user.id;
        const { limit = 20, page = 1 } = req.query;

        // Get unique customers who have placed orders
        const orders = await Order.find({ supplierId })
            .populate('vendorId', 'fullname email phone')
            .sort({ createdAt: -1 });

        // Group orders by customer and calculate stats
        const customerMap = new Map();

        orders.forEach(order => {
            const customerId = order.vendorId._id.toString();
            if (!customerMap.has(customerId)) {
                customerMap.set(customerId, {
                    customer: order.vendorId,
                    totalOrders: 0,
                    totalSpent: 0,
                    lastOrderDate: null,
                    orderHistory: []
                });
            }

            const customerData = customerMap.get(customerId);
            customerData.totalOrders++;
            customerData.totalSpent += order.totalAmount;
            
            if (!customerData.lastOrderDate || order.createdAt > customerData.lastOrderDate) {
                customerData.lastOrderDate = order.createdAt;
            }

            customerData.orderHistory.push({
                orderId: order._id,
                totalAmount: order.totalAmount,
                status: order.status,
                createdAt: order.createdAt
            });
        });

        const customers = Array.from(customerMap.values())
            .sort((a, b) => b.totalSpent - a.totalSpent);

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedCustomers = customers.slice(startIndex, endIndex);

        res.status(200).json({
            status: 'success',
            data: {
                customers: paginatedCustomers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(customers.length / limit),
                    totalCustomers: customers.length,
                    hasNextPage: endIndex < customers.length,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// 👤 Get Customer Details
exports.getCustomerDetails = async (req, res, next) => {
    try {
        const supplierId = req.user.id;
        const { customerId } = req.params;

        // Get customer info
        const customer = await User.findById(customerId);
        if (!customer) {
            return next(new APPError('Customer not found', 404));
        }

        // Get all orders from this customer
        const orders = await Order.find({
            supplierId,
            vendorId: customerId
        }).populate('materialId', 'name pricePerUnit unit')
          .sort({ createdAt: -1 });

        // Calculate customer statistics
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        const completedOrders = orders.filter(o => o.status === 'delivered').length;
        const orderCompletionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

        // Get order status distribution
        const statusDistribution = {};
        orders.forEach(order => {
            statusDistribution[order.status] = (statusDistribution[order.status] || 0) + 1;
        });

        res.status(200).json({
            status: 'success',
            data: {
                customer,
                statistics: {
                    totalOrders,
                    totalSpent,
                    averageOrderValue,
                    completedOrders,
                    orderCompletionRate: Math.round(orderCompletionRate * 100) / 100,
                    statusDistribution
                },
                orderHistory: orders
            }
        });
    } catch (error) {
        next(error);
    }
};

// 💰 Get Pricing Strategies
exports.getPricingStrategies = async (req, res, next) => {
    try {
        const supplierId = req.user.id;

        // Get all materials with pricing info
        const materials = await Material.find({ supplierId })
            .select('name pricePerUnit unit category availableQuantity');

        // Calculate pricing statistics
        const pricingStats = {
            totalProducts: materials.length,
            averagePrice: materials.length > 0 ? materials.reduce((sum, m) => sum + m.pricePerUnit, 0) / materials.length : 0,
            priceRange: {
                min: materials.length > 0 ? Math.min(...materials.map(m => m.pricePerUnit)) : 0,
                max: materials.length > 0 ? Math.max(...materials.map(m => m.pricePerUnit)) : 0
            },
            categoryPricing: {}
        };

        // Calculate average price by category
        const categoryGroups = {};
        materials.forEach(material => {
            if (!categoryGroups[material.category]) {
                categoryGroups[material.category] = [];
            }
            categoryGroups[material.category].push(material.pricePerUnit);
        });

        Object.keys(categoryGroups).forEach(category => {
            const prices = categoryGroups[category];
            pricingStats.categoryPricing[category] = {
                averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
                productCount: prices.length
            };
        });

        res.status(200).json({
            status: 'success',
            data: {
                materials,
                pricingStats
            }
        });
    } catch (error) {
        next(error);
    }
};

// 📈 Bulk Update Pricing
exports.bulkUpdatePricing = async (req, res, next) => {
    try {
        const supplierId = req.user.id;
        const { updates, strategy } = req.body;

        if (!Array.isArray(updates) || updates.length === 0) {
            return next(new APPError('Updates array is required', 400));
        }

        const results = [];
        const errors = [];

        for (const update of updates) {
            try {
                const { materialId, newPrice, percentageChange } = update;

                if (!materialId) {
                    errors.push({ materialId, error: 'Material ID is required' });
                    continue;
                }

                const material = await Material.findOne({
                    _id: materialId,
                    supplierId
                });

                if (!material) {
                    errors.push({ materialId, error: 'Material not found or access denied' });
                    continue;
                }

                let newPriceValue;
                if (newPrice !== undefined) {
                    newPriceValue = newPrice;
                } else if (percentageChange !== undefined) {
                    newPriceValue = material.pricePerUnit * (1 + percentageChange / 100);
                } else {
                    errors.push({ materialId, error: 'Either newPrice or percentageChange is required' });
                    continue;
                }

                const updatedMaterial = await Material.findByIdAndUpdate(
                    materialId,
                    { pricePerUnit: newPriceValue },
                    { new: true }
                );

                results.push(updatedMaterial);
            } catch (error) {
                errors.push({ materialId: update.materialId, error: error.message });
            }
        }

        res.status(200).json({
            status: 'success',
            data: {
                updated: results,
                errors,
                strategy: strategy || 'manual'
            },
            message: `Successfully updated pricing for ${results.length} materials${errors.length > 0 ? `, ${errors.length} failed` : ''}`
        });
    } catch (error) {
        next(error);
    }
};

// 📊 Get Performance Metrics
exports.getSupplierPerformance = async (req, res, next) => {
    try {
        const supplierId = req.user.id;
        const { period = '1m' } = req.query; // 1w, 1m, 3m, 6m, 1y

        // Calculate date range based on period
        const now = new Date();
        let startDate;
        switch (period) {
            case '1w':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '1m':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '3m':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '6m':
                startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Get orders in the period
        const orders = await Order.find({
            supplierId,
            createdAt: { $gte: startDate }
        });

        // Calculate performance metrics
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const completedOrders = orders.filter(o => o.status === 'delivered').length;
        const orderCompletionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calculate response time (mock data - would need to track actual response times)
        const averageResponseTime = 2.5; // hours

        // Calculate customer satisfaction (mock data - would need review system)
        const customerSatisfaction = 4.2; // out of 5

        res.status(200).json({
            status: 'success',
            data: {
                period,
                metrics: {
                    totalOrders,
                    totalRevenue,
                    completedOrders,
                    orderCompletionRate: Math.round(orderCompletionRate * 100) / 100,
                    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
                    averageResponseTime,
                    customerSatisfaction
                },
                trends: {
                    // Mock trend data - would need historical data
                    orderGrowth: 12.5,
                    revenueGrowth: 8.3,
                    customerGrowth: 15.2
                }
            }
        });
    } catch (error) {
        next(error);
    }
}; 