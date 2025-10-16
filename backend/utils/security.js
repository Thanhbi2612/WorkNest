const crypto = require('crypto');
const { ROLES } = require('../config/roles');

// Generate secure random string
const generateSecureToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Hash sensitive data (not passwords - use bcrypt for passwords)
const hashData = (data, algorithm = 'sha256') => {
    return crypto.createHash(algorithm).update(data).digest('hex');
};

// Sanitize user input to prevent XSS
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
};

// Sanitize object with multiple properties
const sanitizeObject = (obj) => {
    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
};

// Check if email is valid format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Check if password meets security requirements
const isStrongPassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength &&
           hasUpperCase &&
           hasLowerCase &&
           hasNumbers &&
           hasSpecialChar;
};

// Generate password strength score
const getPasswordStrength = (password) => {
    let score = 0;
    const feedback = [];

    if (password.length >= 8) {
        score += 20;
    } else {
        feedback.push('Password should be at least 8 characters long');
    }

    if (/[a-z]/.test(password)) {
        score += 15;
    } else {
        feedback.push('Add lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
        score += 15;
    } else {
        feedback.push('Add uppercase letters');
    }

    if (/\d/.test(password)) {
        score += 15;
    } else {
        feedback.push('Add numbers');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score += 15;
    } else {
        feedback.push('Add special characters');
    }

    if (password.length >= 12) {
        score += 10;
    }

    if (password.length >= 16) {
        score += 10;
    }

    let strength;
    if (score >= 80) strength = 'strong';
    else if (score >= 60) strength = 'medium';
    else if (score >= 40) strength = 'weak';
    else strength = 'very weak';

    return {
        score,
        strength,
        feedback
    };
};

// Rate limiting key generators
const getRateLimitKey = (req, identifier = 'ip') => {
    switch (identifier) {
        case 'ip':
            return req.ip || req.connection.remoteAddress;
        case 'user':
            return req.user ? `user_${req.user.id}` : req.ip;
        case 'email':
            return req.body.email || req.ip;
        default:
            return req.ip;
    }
};

// Check if user agent looks suspicious
const isSuspiciousUserAgent = (userAgent) => {
    if (!userAgent) return true;

    const suspiciousPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python/i,
        /java/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
};

// Generate CSRF token
const generateCSRFToken = () => {
    return generateSecureToken(32);
};

// Validate CSRF token
const validateCSRFToken = (token, sessionToken) => {
    return token && sessionToken && token === sessionToken;
};

// IP address utilities
const isValidIP = (ip) => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

// Check if IP is from private network
const isPrivateIP = (ip) => {
    const privateRanges = [
        /^10\./,
        /^172\.(1[6-9]|2\d|3[01])\./,
        /^192\.168\./,
        /^127\./,
        /^::1$/,
        /^fc00:/,
        /^fe80:/
    ];

    return privateRanges.some(range => range.test(ip));
};

// Security headers helper
const getSecurityHeaders = () => {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    };
};

// Log security events
const logSecurityEvent = (event, details, req = null) => {
    const timestamp = new Date().toISOString();
    const ip = req ? (req.ip || req.connection.remoteAddress) : 'unknown';
    const userAgent = req ? req.get('User-Agent') : 'unknown';
    const userId = req && req.user ? req.user.id : 'anonymous';

    console.log('🔒 SECURITY EVENT:', {
        timestamp,
        event,
        details,
        ip,
        userAgent,
        userId
    });
};

module.exports = {
    generateSecureToken,
    hashData,
    sanitizeInput,
    sanitizeObject,
    isValidEmail,
    isStrongPassword,
    getPasswordStrength,
    getRateLimitKey,
    isSuspiciousUserAgent,
    generateCSRFToken,
    validateCSRFToken,
    isValidIP,
    isPrivateIP,
    getSecurityHeaders,
    logSecurityEvent
};