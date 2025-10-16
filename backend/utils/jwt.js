const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

// Generate access token
const generateAccessToken = (payload) => {
    try {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'task-management-app'
        });
    } catch (error) {
        console.error('Error generating access token:', error);
        throw error;
    }
};

// Generate refresh token
const generateRefreshToken = (payload) => {
    try {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_REFRESH_EXPIRES_IN,
            issuer: 'task-management-app'
        });
    } catch (error) {
        console.error('Error generating refresh token:', error);
        throw error;
    }
};

// Generate token pair (access + refresh)
const generateTokenPair = (user) => {
    try {
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            userType: user.role === 'admin' ? 'admin' : 'user'
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken({
            id: user.id,
            userType: payload.userType
        });

        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: JWT_EXPIRES_IN
        };
    } catch (error) {
        console.error('Error generating token pair:', error);
        throw error;
    }
};

// Verify access token
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Access token has expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid access token');
        } else {
            console.error('Error verifying access token:', error);
            throw new Error('Token verification failed');
        }
    }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Refresh token has expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid refresh token');
        } else {
            console.error('Error verifying refresh token:', error);
            throw new Error('Token verification failed');
        }
    }
};

// Extract token from Authorization header
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader) {
        return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
};

// Decode token without verification (useful for getting expired token data)
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

// Check if token is expired
const isTokenExpired = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) {
            return true;
        }

        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
    } catch (error) {
        return true;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
    verifyAccessToken,
    verifyRefreshToken,
    extractTokenFromHeader,
    decodeToken,
    isTokenExpired,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN
};