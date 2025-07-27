// controllers/error.controller.js
const {
    statusBadRequest,
    statusUnauthorized,
    statusNotFound,
    statusError
} = require('../utils/response.util');

const APPError = require('../utils/appError');

const handleCastErrorDB = (err) => {
    return new APPError(`Invalid ${err.path}: ${err.value}`, 400);
};

const handleValidationErrorDB = (err) => {
    const messages = Object.values(err.errors).map(el => el.message);
    return new APPError(`Invalid input: ${messages.join('. ')}`, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return new APPError(`Duplicate field: ${field} = ${value}`, 400);
};

const globalErrorHandler = (err, req, res, next) => {
    // Transform known errors into operational APPErrors
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Respond using your status helpers
    switch (statusCode) {
        case 400:
            return statusBadRequest(res, message);
        case 401:
            return statusUnauthorized(res, message);
        case 404:
            return statusNotFound(res, message);
        default:
            return statusError(res, err, message);
    }
};

module.exports = globalErrorHandler;
