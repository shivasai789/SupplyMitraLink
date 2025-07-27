const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const APPError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.protect = catchAsync(async (req, res, next) => {
    let token;

    console.log('🔍 Auth Headers:', req.headers);
    console.log('🔍 Authorization Header:', req.headers.authorization);

    // 1️⃣ Get token from headers or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        console.log('🔍 Token extracted:', token ? `${token.substring(0, 20)}...` : 'null');
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
        console.log('🔍 Token from cookies:', token ? `${token.substring(0, 20)}...` : 'null');
    }

    // 2️⃣ If no token, deny access
    if (!token) {
        console.log('❌ No token found');
        return next(new APPError('You are not logged in! Please log in to get access.', 401));
    }

    // 3️⃣ Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // will throw if invalid
        console.log('🔍 Token decoded successfully, user ID:', decoded.id);
        console.log('🔍 User role:', decoded.role);

        // 4️⃣ Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            console.log('❌ User not found in database');
            return next(new APPError('The user belonging to this token no longer exists.', 401));
        }

        // 5️⃣ Grant access
        req.user = currentUser;
        console.log('✅ User authenticated successfully:', currentUser.email, 'Role:', currentUser.role);
        next();
    } catch (error) {
        console.log('❌ Token verification failed:', error.message);
        return next(new APPError('Invalid token', 401));
    }
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        console.log('🔍 Role check - User role:', req.user.role, 'Required roles:', roles);
        if (!roles.includes(req.user.role)) {
            console.log('❌ Role access denied');
            return res.status(403).json({
                status: 'fail',
                message: 'You do not have permission to perform this action'
            });
        }
        console.log('✅ Role access granted');
        next();
    };
};