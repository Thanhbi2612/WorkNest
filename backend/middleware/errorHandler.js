// Global error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let error = {
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR'
    };

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = {
            success: false,
            message: 'Invalid token',
            error: 'INVALID_TOKEN'
        };
        return res.status(401).json(error);
    }

    if (err.name === 'TokenExpiredError') {
        error = {
            success: false,
            message: 'Token has expired',
            error: 'TOKEN_EXPIRED'
        };
        return res.status(401).json(error);
    }

    // Database errors
    if (err.code === '23505') { // PostgreSQL unique violation
        error = {
            success: false,
            message: 'Resource already exists',
            error: 'DUPLICATE_RESOURCE'
        };
        return res.status(409).json(error);
    }

    if (err.code === '23503') { // PostgreSQL foreign key violation
        error = {
            success: false,
            message: 'Referenced resource does not exist',
            error: 'FOREIGN_KEY_VIOLATION'
        };
        return res.status(400).json(error);
    }

    if (err.code === '23502') { // PostgreSQL not null violation
        error = {
            success: false,
            message: 'Missing required field',
            error: 'MISSING_REQUIRED_FIELD'
        };
        return res.status(400).json(error);
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        error = {
            success: false,
            message: err.message,
            error: 'VALIDATION_ERROR',
            details: err.details || []
        };
        return res.status(400).json(error);
    }

    // Custom application errors
    if (err.statusCode) {
        error = {
            success: false,
            message: err.message || 'An error occurred',
            error: err.code || 'APPLICATION_ERROR'
        };
        return res.status(err.statusCode).json(error);
    }

    // Default 500 error
    return res.status(500).json(error);
};

// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
    const error = {
        success: false,
        message: `Route ${req.originalUrl} not found`,
        error: 'ROUTE_NOT_FOUND'
    };
    res.status(404).json(error);
};

// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Custom error class
class AppError extends Error {
    constructor(message, statusCode, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError
};