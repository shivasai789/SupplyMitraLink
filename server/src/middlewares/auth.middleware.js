const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const APPError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.protect = catchAsync(async (req, res, next) => {
    let token;

    // 1️⃣ Get token from headers or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    // 2️⃣ If no token, deny access
    if (!token) {
        return next(new APPError('You are not logged in! Please log in to get access.', 401));
    }

    // 3️⃣ Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // will throw if invalid

        // 4️⃣ Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(new APPError('The user belonging to this token no longer exists.', 401));
        }

        // 5️⃣ Grant access
        req.user = currentUser;
        next();
    } catch (error) {
        return next(new APPError('Invalid token', 401));
    }
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'fail',
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};