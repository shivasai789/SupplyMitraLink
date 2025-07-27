const userRouter = require('express').Router();
const { 
    getAllUsers, 
    getUser, 
    updateUser, 
    deleteUser,
    getUserProfile, 
    updateUserProfile, 
    getSupplierDetails, 
    getSupplierProducts, 
    getSupplierPerformance,
    searchSuppliers,
    getAllSuppliersPerformance
} = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

userRouter.use(protect);

// User profile routes
userRouter.get('/profile', getUserProfile);
userRouter.put('/profile', updateUserProfile);

// Admin routes (commented out - not used in current app)
// userRouter.get('/', restrictTo('admin'), getAllUsers);
// userRouter.get('/admin/:id', restrictTo('admin'), getUser);
// userRouter.put('/admin/:id', restrictTo('admin'), updateUser);
// userRouter.delete('/admin/:id', restrictTo('admin'), deleteUser);

// Debug route to check current user role
userRouter.get('/debug/role', (req, res) => {
    res.json({
        status: 'success',
        data: {
            userId: req.user._id,
            email: req.user.email,
            role: req.user.role,
            fullname: req.user.fullname
        }
    });
});

// Test route to verify router is working
userRouter.get('/test', (req, res) => {
    res.json({
        status: 'success',
        message: 'User router is working!',
        timestamp: new Date().toISOString()
    });
});

// Debug route to check supplier exists
userRouter.get('/debug/supplier/:supplierId', async (req, res) => {
    try {
        const supplier = await require('../models/user.model').findById(req.params.supplierId);
        res.json({
            status: 'success',
            data: {
                supplier: supplier ? {
                    _id: supplier._id,
                    fullname: supplier.fullname,
                    email: supplier.email,
                    role: supplier.role
                } : null,
                exists: !!supplier,
                isSupplier: supplier && supplier.role === 'supplier'
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Search suppliers (must come before supplier/:supplierId routes)
userRouter.get('/search/suppliers', searchSuppliers);

// Test route to verify supplier routes are working
userRouter.get('/supplier/:supplierId/test', (req, res) => {
    res.json({
        status: 'success',
        message: 'Supplier route is working!',
        supplierId: req.params.supplierId,
        timestamp: new Date().toISOString()
    });
});

// Debug route to test supplier lookup
userRouter.get('/supplier/:supplierId/debug', async (req, res) => {
    try {
        const User = require('../models/user.model');
        const supplierId = req.params.supplierId;
        
        console.log('🔍 Debug route - Supplier ID:', supplierId);
        console.log('🔍 Debug route - Supplier ID type:', typeof supplierId);
        console.log('🔍 Debug route - Supplier ID length:', supplierId.length);
        
        // Test ObjectId conversion
        const mongoose = require('mongoose');
        const ObjectId = mongoose.Types.ObjectId;
        let testId;
        try {
            testId = new ObjectId(supplierId);
            console.log('🔍 Debug route - ObjectId conversion successful:', testId);
        } catch (error) {
            console.log('❌ Debug route - ObjectId conversion failed:', error.message);
        }
        
        // Try to find the supplier
        const supplier = await User.findById(supplierId).select('fullname role');
        console.log('🔍 Debug route - Found supplier:', supplier);
        
        // Test Material model
        const Material = require('../models/material.model');
        const materials = await Material.find({ supplierId }).limit(5);
        console.log('🔍 Debug route - Found materials count:', materials.length);
        
        res.json({
            status: 'success',
            data: {
                supplierId,
                supplierIdType: typeof supplierId,
                supplierIdLength: supplierId.length,
                objectIdConversion: testId ? 'success' : 'failed',
                supplier: supplier ? {
                    _id: supplier._id,
                    fullname: supplier.fullname,
                    role: supplier.role
                } : null,
                exists: !!supplier,
                isSupplier: supplier && supplier.role === 'supplier',
                materialsCount: materials.length
            }
        });
    } catch (error) {
        console.error('❌ Debug route error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Test route to call controller function directly
userRouter.get('/supplier/:supplierId/test-controller', async (req, res, next) => {
    console.log('🧪 Test route calling controller function...');
    try {
        await getSupplierProducts(req, res, next);
    } catch (error) {
        console.error('❌ Error in test route:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Supplier details routes (for vendors)
userRouter.get('/supplier/:supplierId/details', getSupplierDetails);
userRouter.get('/supplier/:supplierId/products', getSupplierProducts);
userRouter.get('/supplier/:supplierId/performance', getSupplierPerformance);
userRouter.get('/suppliers/performance', getAllSuppliersPerformance);

module.exports = userRouter;