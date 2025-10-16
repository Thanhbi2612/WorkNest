const rateLimit = require('express-rate-limit');

// General API rate limiting
const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 1 minute',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '1 minute'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts from this IP, please try again after 1 minute',
        error: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiting for registration
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 registration attempts per hour
    message: {
        success: false,
        message: 'Too many registration attempts from this IP, please try again after 1 hour',
        error: 'REGISTER_RATE_LIMIT_EXCEEDED',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for password reset
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset attempts per hour
    message: {
        success: false,
        message: 'Too many password reset attempts from this IP, please try again after 1 hour',
        error: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for sensitive operations
const strictLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests for this operation, please try again after 1 minute',
        error: 'STRICT_RATE_LIMIT_EXCEEDED',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 upload requests per windowMs
    message: {
        success: false,
        message: 'Too many upload attempts from this IP, please try again after 1 minute',
        error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Create custom rate limiter
const createRateLimiter = (windowMs, max, message, options = {}) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message,
            error: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(windowMs / 1000 / 60) + ' minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        ...options
    });
};

module.exports = {
    generalLimiter,
    authLimiter,
    registerLimiter,
    passwordResetLimiter,
    strictLimiter,
    uploadLimiter,
    createRateLimiter
};