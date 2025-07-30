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
    getAllSuppliersPerformance,
    getAllSuppliers
} = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

userRouter.use(protect);

// User profile routes
userRouter.get('/profile', getUserProfile);
userRouter.put('/profile', updateUserProfile);

// Get all suppliers (for vendors to browse)
userRouter.get('/suppliers', getAllSuppliers);

// Debug: Get all suppliers regardless of onboarding status
userRouter.get('/suppliers/debug', async (req, res, next) => {
    try {
        const suppliers = await require('../models/user.model').find({ 
            role: 'supplier'
        }).select('fullname businessName businessType businessAddress city state pincode latitude longitude phone rating createdAt onboardingCompleted');

        // Transform the data to include location information
        const suppliersWithLocation = suppliers.map(supplier => ({
            _id: supplier._id,
            fullname: supplier.fullname,
            businessName: supplier.businessName,
            businessType: supplier.businessType,
            businessAddress: supplier.businessAddress,
            city: supplier.city,
            state: supplier.state,
            pincode: supplier.pincode,
            latitude: supplier.latitude,
            longitude: supplier.longitude,
            phone: supplier.phone,
            rating: supplier.rating || 0,
            memberSince: supplier.createdAt,
            onboardingCompleted: supplier.onboardingCompleted
        }));

        res.status(200).json({
            status: 'success',
            data: suppliersWithLocation
        });
    } catch (error) {
        next(new require('../utils/appError')(error.message, 500));
    }
});

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
                    role: supplier.role,
                    onboardingCompleted: supplier.onboardingCompleted
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

// Debug route to check all suppliers and their onboarding status
userRouter.get('/debug/suppliers', async (req, res) => {
    try {
        const User = require('../models/user.model');
        const allSuppliers = await User.find({ role: 'supplier' }).select('fullname email role onboardingCompleted businessName createdAt');
        const completedSuppliers = await User.find({ 
            role: 'supplier',
            onboardingCompleted: true 
        }).select('fullname email role onboardingCompleted businessName createdAt');
        
        res.json({
            status: 'success',
            data: {
                totalSuppliers: allSuppliers.length,
                completedSuppliers: completedSuppliers.length,
                allSuppliers: allSuppliers,
                completedSuppliersList: completedSuppliers
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
        

        
        // Test ObjectId conversion
        const mongoose = require('mongoose');
        const ObjectId = mongoose.Types.ObjectId;
        let testId;
        try {
            testId = new ObjectId(supplierId);
        } catch (error) {
            // ObjectId conversion failed
        }
        
        // Try to find the supplier
        const supplier = await User.findById(supplierId).select('fullname role');
        
        // Test Material model
        const Material = require('../models/material.model');
        const materials = await Material.find({ supplierId }).limit(5);
        
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
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Test route to call controller function directly
userRouter.get('/supplier/:supplierId/test-controller', async (req, res, next) => {
    try {
        await getSupplierProducts(req, res, next);
    } catch (error) {
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