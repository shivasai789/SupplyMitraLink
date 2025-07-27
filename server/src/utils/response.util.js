// utils/response.util.js

// ✅ 200 OK
exports.statusOK = (res, data = {}, message = 'Success') => {
    return res.status(200).json({
        status: 'success',
        message,
        data
    });
};

// ✅ 201 Created
exports.statusCreated = (res, data = {}, message = 'Resource created successfully') => {
    return res.status(201).json({
        status: 'success',
        message,
        data
    });
};

// ❌ 400 Bad Request
exports.statusBadRequest = (res, message = 'Bad Request') => {
    return res.status(400).json({
        status: 'fail',
        message
    });
};

// ❌ 401 Unauthorized
exports.statusUnauthorized = (res, message = 'Unauthorized') => {
    return res.status(401).json({
        status: 'fail',
        message
    });
};

// ❌ 403 Forbidden
exports.statusForbidden = (res, message = 'Forbidden') => {
    return res.status(403).json({
        status: 'fail',
        message
    });
};

// ❌ 404 Not Found
exports.statusNotFound = (res, message = 'Resource not found') => {
    return res.status(404).json({
        status: 'fail',
        message
    });
};

// ❌ 409 Conflict
exports.statusConflict = (res, message = 'Conflict') => {
    return res.status(409).json({
        status: 'fail',
        message
    });
};

// ❌ 500 Internal Server Error
exports.statusError = (res, error = {}, message = 'Internal Server Error') => {
    return res.status(500).json({
        status: 'error',
        message,
        error: error.message || 'An unexpected error occurred'
    });
};
