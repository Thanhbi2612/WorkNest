const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwt');

// Basic JWT authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required',
                error: 'MISSING_TOKEN'
            });
        }

        const decoded = verifyAccessToken(token);
        req.user = {
            ...decoded,
            userId: decoded.id, // Alias for convenience
            userType: decoded.userType || (decoded.role === 'admin' ? 'admin' : 'user')
        };
        next();
    } catch (error) {
        console.error('Authentication error:', error.message);

        return res.status(401).json({
            success: false,
            message: error.message,
            error: 'INVALID_TOKEN'
        });
    }
};

// Admin only middleware
const requireAdmin = async (req, res, next) => {
    try {
        // First authenticate
        await authenticateToken(req, res, () => {
            // Then check if user is admin
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required',
                    error: 'INSUFFICIENT_PERMISSIONS'
                });
            }
            next();
        });
    } catch (error) {
        console.error('Admin authorization error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Authorization error',
            error: 'AUTHORIZATION_ERROR'
        });
    }
};

// User only middleware (excludes admin)
const requireUser = async (req, res, next) => {
    try {
        await authenticateToken(req, res, () => {
            if (!req.user || req.user.role !== 'user') {
                return res.status(403).json({
                    success: false,
                    message: 'User access required',
                    error: 'INSUFFICIENT_PERMISSIONS'
                });
            }
            next();
        });
    } catch (error) {
        console.error('User authorization error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Authorization error',
            error: 'AUTHORIZATION_ERROR'
        });
    }
};

// Role-based access middleware
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            await authenticateToken(req, res, () => {
                if (!req.user || !allowedRoles.includes(req.user.role)) {
                    return res.status(403).json({
                        success: false,
                        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
                        error: 'INSUFFICIENT_PERMISSIONS'
                    });
                }
                next();
            });
        } catch (error) {
            console.error('Role authorization error:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Authorization error',
                error: 'AUTHORIZATION_ERROR'
            });
        }
    };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (token) {
            try {
                const decoded = verifyAccessToken(token);
                req.user = decoded;
            } catch (error) {
                // Token is invalid but we don't fail the request
                console.log('Optional auth failed:', error.message);
                req.user = null;
            }
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        console.error('Optional authentication error:', error.message);
        req.user = null;
        next();
    }
};

// Middleware to check if user owns resource
const requireOwnership = (resourceIdParam = 'id') => {
    return async (req, res, next) => {
        try {
            await authenticateToken(req, res, () => {
                const resourceId = req.params[resourceIdParam];
                const userId = req.user.id;

                // Admin can access any resource
                if (req.user.role === 'admin') {
                    return next();
                }

                // User can only access their own resources
                if (parseInt(resourceId) !== parseInt(userId)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied. You can only access your own resources',
                        error: 'INSUFFICIENT_PERMISSIONS'
                    });
                }

                next();
            });
        } catch (error) {
            console.error('Ownership authorization error:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Authorization error',
                error: 'AUTHORIZATION_ERROR'
            });
        }
    };
};

// Rate limiting helper (to be used with express-rate-limit)
const createRateLimitMessage = (windowMs, max) => {
    return (req, res) => {
        res.status(429).json({
            success: false,
            message: `Too many requests from this IP, please try again after ${windowMs / 1000} seconds`,
            error: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(windowMs / 1000)
        });
    };
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireUser,
    requireRole,
    optionalAuth,
    requireOwnership,
    createRateLimitMessage
};