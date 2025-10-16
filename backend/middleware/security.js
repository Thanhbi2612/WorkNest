const { getSecurityHeaders, logSecurityEvent, isSuspiciousUserAgent } = require('../utils/security');

// Apply security headers to all responses
const securityHeaders = (req, res, next) => {
    const headers = getSecurityHeaders();

    Object.entries(headers).forEach(([header, value]) => {
        res.setHeader(header, value);
    });

    next();
};

// Log and block suspicious user agents
const userAgentFilter = (req, res, next) => {
    const userAgent = req.get('User-Agent');

    if (isSuspiciousUserAgent(userAgent)) {
        logSecurityEvent('SUSPICIOUS_USER_AGENT', {
            userAgent,
            path: req.path,
            method: req.method
        }, req);

        // Optionally block the request
        // return res.status(403).json({
        //     success: false,
        //     message: 'Access denied',
        //     error: 'SUSPICIOUS_USER_AGENT'
        // });
    }

    next();
};

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173', // Vite default
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173'
        ];

        // In production, add your actual domain
        if (process.env.NODE_ENV === 'production') {
            allowedOrigins.push('https://yourdomain.com');
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logSecurityEvent('CORS_VIOLATION', {
                origin,
                blocked: true
            });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400 // Cache preflight for 24 hours
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Log request
    console.log(`📝 ${req.method} ${req.path} - ${ip} - ${userAgent}`);

    // Log response when it finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const userId = req.user ? req.user.id : 'anonymous';

        console.log(`✅ ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - User: ${userId}`);

        // Log security-relevant events
        if (res.statusCode === 401) {
            logSecurityEvent('UNAUTHORIZED_ACCESS', {
                path: req.path,
                method: req.method,
                statusCode: res.statusCode
            }, req);
        } else if (res.statusCode === 403) {
            logSecurityEvent('FORBIDDEN_ACCESS', {
                path: req.path,
                method: req.method,
                statusCode: res.statusCode
            }, req);
        } else if (res.statusCode === 429) {
            logSecurityEvent('RATE_LIMIT_EXCEEDED', {
                path: req.path,
                method: req.method,
                statusCode: res.statusCode
            }, req);
        }
    });

    next();
};

// Content-Type validation
const validateContentType = (req, res, next) => {
    // Only check POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('Content-Type');
        const contentLength = req.get('Content-Length');

        // Bỏ qua kiểm tra nếu request không có body (Content-Length = 0 hoặc undefined)
        if (!contentLength || parseInt(contentLength) === 0) {
            return next();
        }

        // Cho phép application/json và multipart/form-data (cho file upload)
        const isValidContentType = contentType && (
            contentType.includes('application/json') ||
            contentType.includes('multipart/form-data')
        );

        if (!isValidContentType) {
            return res.status(400).json({
                success: false,
                message: 'Content-Type must be application/json or multipart/form-data',
                error: 'INVALID_CONTENT_TYPE'
            });
        }
    }

    next();
};

// Request size limiter
const requestSizeLimiter = (req, res, next) => {
    const contentLength = req.get('Content-Length');

    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
        logSecurityEvent('REQUEST_TOO_LARGE', {
            contentLength,
            path: req.path,
            method: req.method
        }, req);

        return res.status(413).json({
            success: false,
            message: 'Request too large',
            error: 'REQUEST_TOO_LARGE'
        });
    }

    next();
};

// IP whitelist/blacklist (placeholder for future implementation)
const ipFilter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;

    // Placeholder for IP filtering logic
    // const blacklistedIPs = ['1.2.3.4'];
    // const whitelistedIPs = ['127.0.0.1'];

    // if (blacklistedIPs.includes(ip)) {
    //     logSecurityEvent('BLACKLISTED_IP_ACCESS', { ip }, req);
    //     return res.status(403).json({
    //         success: false,
    //         message: 'Access denied',
    //         error: 'IP_BLOCKED'
    //     });
    // }

    next();
};

// Security event tracking
const trackSecurityEvents = (req, res, next) => {
    // Track login attempts
    if (req.path.includes('/login')) {
        req.isLoginAttempt = true;
    }

    // Track password changes
    if (req.path.includes('/change-password')) {
        req.isPasswordChange = true;
    }

    // Track admin actions
    if (req.path.includes('/admin/')) {
        req.isAdminAction = true;
    }

    next();
};

module.exports = {
    securityHeaders,
    userAgentFilter,
    corsOptions,
    requestLogger,
    validateContentType,
    requestSizeLimiter,
    ipFilter,
    trackSecurityEvents
};