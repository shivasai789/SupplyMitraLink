const User = require('../models/user.model');
const Material = require('../models/material.model');
const Review = require('../models/review.model');
const Address = require('../models/address.model');
const Order = require('../models/order.model');
const { getOneByFilter, updateOneByFilter, createOne, deleteOneByFilter, getAllByFilter } = require('./factory.controller');
const APPError = require('../utils/appError');

// 🔍 Get All Users
exports.getAllUsers = (req, res, next) => {
    return getAllByFilter(User, req => ({}), [])(req, res, next);
};

// 🔍 Get User by ID
exports.getUser = (req, res, next) => {
    return getOneByFilter(User, req => ({ _id: req.params.id }), [])(req, res, next);
};

// 📝 Update User
exports.updateUser = (req, res, next) => {
    return updateOneByFilter(User, req => ({ _id: req.params.id }))(req, res, next);
};

// ❌ Delete User
exports.deleteUser = (req, res, next) => {
    return deleteOneByFilter(User, req => ({ _id: req.params.id }))(req, res, next);
};

// 👤 Get User Profile
exports.getUserProfile = (req, res, next) => {
    console.log('🔍 getUserProfile called');
    console.log('👤 User ID:', req.user.id);
    
    return getOneByFilter(User, req => ({ _id: req.user.id }), null)(req, res, next);
};

// 📝 Update User Profile
exports.updateUserProfile = (req, res, next) => {
    console.log('🔍 updateUserProfile called');
    console.log('👤 User ID:', req.user.id);
    console.log('📦 Request body:', req.body);
    
    return updateOneByFilter(User, req => ({ _id: req.user.id }))(req, res, next);
};

// 🏪 Get Supplier Details (for vendors)
exports.getSupplierDetails = async (req, res, next) => {
    try {
        const supplierId = req.params.supplierId;

        // Get supplier info
        const supplier = await User.findById(supplierId).select('fullname email phone role createdAt');
        if (!supplier || supplier.role !== 'supplier') {
            return next(new APPError('Supplier not found', 404));
        }

        // Add memberSince field for frontend compatibility
        const supplierWithMemberSince = {
            ...supplier.toObject(),
            memberSince: supplier.createdAt
        };

        // Get supplier address
        const address = await Address.findOne({ userId: supplierId });

        // Get supplier performance stats
        const materials = await Material.find({ supplierId });
        const reviews = await Review.find({ supplierId });
        const orders = await Order.find({ supplierId });

        // Calculate performance metrics
        const totalMaterials = materials.length;
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
            : 0;

        // Get rating distribution
        const ratingDistribution = {
            5: reviews.filter(r => r.rating === 5).length,
            4: reviews.filter(r => r.rating === 4).length,
            3: reviews.filter(r => r.rating === 3).length,
            2: reviews.filter(r => r.rating === 2).length,
            1: reviews.filter(r => r.rating === 1).length
        };

        // Get recent reviews
        const recentReviews = await Review.find({ supplierId })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate('userId', 'fullname');

        const performance = {
            totalMaterials,
            totalReviews,
            averageRating: Math.round(averageRating * 10) / 10,
            ratingDistribution,
            recentReviews: recentReviews.map(review => ({
                _id: review._id,
                rating: review.rating,
                comment: review.comment,
                reviewer: review.userId?.fullname || 'Anonymous',
                createdAt: review.createdAt
            }))
        };

        res.status(200).json({
            status: 'success',
            data: {
                supplier: supplierWithMemberSince,
                address,
                performance
            }
        });
    } catch (error) {
        next(error);
    }
};

// 📦 Get Supplier Products
exports.getSupplierProducts = async (req, res, next) => {
    console.log('🚀 getSupplierProducts function called!');
    try {
        console.log('🔍 getSupplierProducts called');
        console.log('👤 User:', req.user.email, 'Role:', req.user.role);
        console.log('📦 Supplier ID:', req.params.supplierId);
        console.log('📦 Query params:', req.query);
        
        const supplierId = req.params.supplierId;
        const { page = 1, limit = 10, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        console.log('🔍 Looking for supplier with ID:', supplierId);
        console.log('🔍 Supplier ID type:', typeof supplierId);
        console.log('🔍 Supplier ID length:', supplierId.length);
        
        // Test if we can find the supplier with a different approach
        try {
            const mongoose = require('mongoose');
            const ObjectId = mongoose.Types.ObjectId;
            console.log('🔍 Testing ObjectId conversion...');
            const testId = new ObjectId(supplierId);
            console.log('🔍 ObjectId conversion successful:', testId);
        } catch (error) {
            console.log('❌ ObjectId conversion failed:', error.message);
        }
        
        // Validate supplier exists
        const supplier = await User.findById(supplierId).select('fullname role');
        console.log('🔍 Found supplier:', supplier);
        
        if (!supplier || supplier.role !== 'supplier') {
            console.log('❌ Supplier not found or not a supplier role');
            return next(new APPError('Supplier not found', 404));
        }
        
        console.log('✅ Supplier validated:', supplier.fullname);

        // Build filter
        const filter = { supplierId };
        if (category) {
            filter.category = category;
        }
        
        console.log('🔍 Material filter:', filter);

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        console.log('🔍 Sort options:', sort);

        // Get materials with pagination
        const skip = (page - 1) * limit;
        console.log('🔍 Pagination - skip:', skip, 'limit:', limit);
        
        const materials = await Material.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));
            
        console.log('🔍 Found materials count:', materials.length);

        // Get total count
        const total = await Material.countDocuments(filter);
        console.log('🔍 Total materials count:', total);

        // Calculate average ratings for materials
        console.log('🔍 Calculating ratings for materials...');
        const materialsWithRatings = await Promise.all(
            materials.map(async (material) => {
                const reviews = await Review.find({ materialId: material._id });
                const averageRating = reviews.length > 0 
                    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
                    : 0;
                const totalReviews = reviews.length;

                return {
                    ...material.toObject(),
                    averageRating: Math.round(averageRating * 10) / 10,
                    totalReviews
                };
            })
        );
        
        console.log('🔍 Materials with ratings calculated');

        console.log('🔍 Sending response with materials...');
        res.status(200).json({
            status: 'success',
            data: {
                supplier,
                materials: materialsWithRatings,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
        console.log('✅ Response sent successfully');
    } catch (error) {
        console.error('❌ Error in getSupplierProducts:', error);
        next(error);
    }
};

// 📊 Get Supplier Performance
exports.getSupplierPerformance = async (req, res, next) => {
    try {
        console.log('🔍 getSupplierPerformance called');
        console.log('👤 User:', req.user.email, 'Role:', req.user.role);
        console.log('📦 Supplier ID:', req.params.supplierId);
        console.log('📦 Query params:', req.query);
        
        const supplierId = req.params.supplierId;
        const { period = '1m' } = req.query;

        console.log('🔍 Looking for supplier with ID:', supplierId);
        
        // Validate supplier exists
        const supplier = await User.findById(supplierId).select('fullname role');
        console.log('🔍 Found supplier:', supplier);
        
        if (!supplier || supplier.role !== 'supplier') {
            console.log('❌ Supplier not found or not a supplier role');
            return next(new APPError('Supplier not found', 404));
        }
        
        console.log('✅ Supplier validated:', supplier.fullname);

        // Get all reviews
        const reviews = await Review.find({ supplierId })
            .populate('materialId', 'name')
            .populate('userId', 'fullname')
            .sort({ createdAt: -1 });

        // Calculate performance metrics
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
            : 0;

        // Get rating distribution
        const ratingDistribution = {
            5: reviews.filter(r => r.rating === 5).length,
            4: reviews.filter(r => r.rating === 4).length,
            3: reviews.filter(r => r.rating === 3).length,
            2: reviews.filter(r => r.rating === 2).length,
            1: reviews.filter(r => r.rating === 1).length
        };

        // Get recent reviews with material info
        const recentReviews = reviews.slice(0, 10).map(review => ({
            _id: review._id,
            rating: review.rating,
            comment: review.comment,
            reviewer: review.userId?.fullname || 'Anonymous',
            material: review.materialId?.name || 'Unknown Product',
            createdAt: review.createdAt
        }));

        res.status(200).json({
            status: 'success',
            data: {
                performance: {
                    totalReviews,
                    averageRating: Math.round(averageRating * 10) / 10,
                    ratingDistribution
                },
                reviews: recentReviews
            }
        });
    } catch (error) {
        next(error);
    }
};

// 🔍 Search Suppliers
exports.searchSuppliers = async (req, res, next) => {
    try {
        const { q, category, rating, page = 1, limit = 10 } = req.query;

        // Build filter
        const filter = { role: 'supplier' };
        if (q) {
            filter.fullname = { $regex: q, $options: 'i' };
        }

        // Get suppliers
        const skip = (page - 1) * limit;
        const suppliers = await User.find(filter)
            .select('fullname email phone createdAt')
            .skip(skip)
            .limit(parseInt(limit));

        // Get performance data for each supplier
        const suppliersWithPerformance = await Promise.all(
            suppliers.map(async (supplier) => {
                const reviews = await Review.find({ supplierId: supplier._id });
                const materials = await Material.find({ supplierId: supplier._id });

                const averageRating = reviews.length > 0 
                    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
                    : 0;

                return {
                    ...supplier.toObject(),
                    totalMaterials: materials.length,
                    totalReviews: reviews.length,
                    averageRating: Math.round(averageRating * 10) / 10
                };
            })
        );

        // Filter by rating if specified
        let filteredSuppliers = suppliersWithPerformance;
        if (rating) {
            filteredSuppliers = suppliersWithPerformance.filter(
                supplier => supplier.averageRating >= parseFloat(rating)
            );
        }

        // Filter by category if specified
        if (category) {
            const suppliersWithCategory = await Promise.all(
                filteredSuppliers.map(async (supplier) => {
                    const materials = await Material.find({ 
                        supplierId: supplier._id, 
                        category: category 
                    });
                    return materials.length > 0 ? supplier : null;
                })
            );
            filteredSuppliers = suppliersWithCategory.filter(supplier => supplier !== null);
        }

        const total = filteredSuppliers.length;

        res.status(200).json({
            status: 'success',
            data: {
                suppliers: filteredSuppliers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// 🔍 Get All Suppliers Performance (for vendor dashboard)
exports.getAllSuppliersPerformance = async (req, res, next) => {
  try {
    const suppliers = await User.find({ role: 'supplier' }).select('_id fullname email phone');
    const performances = await Promise.all(
      suppliers.map(async (supplier) => {
        const reviews = await Review.find({ supplierId: supplier._id });
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
          : 0;
        return {
          supplier: {
            _id: supplier._id,
            fullname: supplier.fullname,
            email: supplier.email,
            phone: supplier.phone,
          },
          performance: {
            totalReviews,
            averageRating: Math.round(averageRating * 10) / 10,
          }
        };
      })
    );
    res.status(200).json({ status: 'success', data: performances });
  } catch (error) {
    next(error);
  }
};