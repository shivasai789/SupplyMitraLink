const express = require('express');
const supplierController = require('../controllers/supplier.controller');
const { restrictTo } = require('../middlewares/auth.middleware');

const supplierRouter = express.Router();

// Apply supplier role restriction to all routes
supplierRouter.use(restrictTo('supplier'));

// Dashboard Analytics
supplierRouter.get('/dashboard/stats', supplierController.getSupplierDashboardStats);

// Inventory Management
supplierRouter.get('/inventory', supplierController.getSupplierInventory);
supplierRouter.post('/inventory/bulk-update', supplierController.bulkUpdateInventory);
supplierRouter.get('/inventory/alerts', supplierController.getLowStockAlerts);

// Customer Management
supplierRouter.get('/customers', supplierController.getSupplierCustomers);
supplierRouter.get('/customers/:customerId', supplierController.getCustomerDetails);

// Pricing Management
supplierRouter.get('/pricing', supplierController.getPricingStrategies);
supplierRouter.post('/pricing/bulk-update', supplierController.bulkUpdatePricing);

// Performance Metrics
supplierRouter.get('/performance', supplierController.getSupplierPerformance);

module.exports = supplierRouter; 