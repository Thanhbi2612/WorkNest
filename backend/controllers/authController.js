const { UserAdmin, User, RefreshToken } = require('../models');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { validateLogin } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware');

// Admin Login - Only checks admin table
const adminLogin = asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    // Validate input
    const validation = validateLogin({ identifier, password });
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validation.errors
        });
    }

    // Try to authenticate as admin
    const authResult = await UserAdmin.authenticate(identifier, password);

    if (!authResult.success) {
        // Check if account is deactivated
        if (authResult.message === 'Admin account is disabled') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ với admin để được hỗ trợ.',
                error: 'ACCOUNT_DEACTIVATED'
            });
        }

        // Return specific error to help frontend determine if should try user login
        return res.status(401).json({
            success: false,
            message: 'Sai tên đăng nhập hoặc mật khẩu',
            error: 'ADMIN_AUTH_FAILED',
            shouldTryUser: true // Hint for frontend to try user login
        });
    }

    const adminData = authResult.admin;

    // Generate tokens
    const tokens = generateTokenPair(adminData);

    // Save refresh token to database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await RefreshToken.createRefreshToken({
        user_id: adminData.id,
        token: tokens.refreshToken,
        user_type: 'admin',
        expires_at: expiresAt
    });

    res.status(200).json({
        success: true,
        message: 'Admin login successful',
        data: {
            admin: adminData,
            tokens
        }
    });
});

// User Login - Only checks user table
const userLogin = asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    // Validate input
    const validation = validateLogin({ identifier, password });
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validation.errors
        });
    }

    // Try to authenticate as user
    const authResult = await User.authenticate(identifier, password);

    if (!authResult.success) {
        // Check if account is deactivated
        if (authResult.message === 'User account is disabled') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ với admin để được hỗ trợ.',
                error: 'ACCOUNT_DEACTIVATED'
            });
        }

        // Return specific error to help frontend determine if should try admin login
        return res.status(401).json({
            success: false,
            message: 'Sai tên đăng nhập hoặc mật khẩu',
            error: 'USER_AUTH_FAILED',
            shouldTryAdmin: true // Hint for frontend to try admin login
        });
    }

    const userData = authResult.user;

    // Generate tokens
    const tokens = generateTokenPair(userData);

    // Save refresh token to database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await RefreshToken.createRefreshToken({
        user_id: userData.id,
        token: tokens.refreshToken,
        user_type: 'user',
        expires_at: expiresAt
    });

    res.status(200).json({
        success: true,
        message: 'User login successful',
        data: {
            user: userData,
            tokens
        }
    });
});


// Refresh Token
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken: token } = req.body;

    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'Refresh token is required'
        });
    }

    // Verify refresh token in database
    const storedToken = await RefreshToken.findByToken(token);
    if (!storedToken) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }

    // Verify JWT signature
    let decoded;
    try {
        decoded = verifyRefreshToken(token);
    } catch (error) {
        // Revoke the invalid token
        await RefreshToken.revokeToken(token);
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }

    // Get user data based on user type
    let user;
    if (storedToken.user_type === 'admin') {
        user = await UserAdmin.findById(storedToken.user_id);
    } else {
        user = await User.findById(storedToken.user_id);
    }

    if (!user || !user.is_active) {
        await RefreshToken.revokeToken(token);
        return res.status(401).json({
            success: false,
            message: 'User not found or inactive'
        });
    }

    // Generate new token pair
    const newTokens = generateTokenPair(user);

    // Revoke old refresh token and create new one
    await RefreshToken.revokeToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.createRefreshToken({
        user_id: user.id,
        token: newTokens.refreshToken,
        user_type: storedToken.user_type,
        expires_at: expiresAt
    });

    res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            tokens: newTokens
        }
    });
});

// Logout (revoke refresh token)
const logout = asyncHandler(async (req, res) => {
    const { refreshToken: token } = req.body;

    if (token) {
        await RefreshToken.revokeToken(token);
    }

    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
});

// Logout from all devices (revoke all user tokens)
const logoutAll = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userType = req.user.userType;

    await RefreshToken.revokeUserTokens(userId, userType);

    res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully'
    });
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userType = req.user.userType;

    let user;
    if (userType === 'admin') {
        user = await UserAdmin.findById(userId);
    } else {
        user = await User.findById(userId);
    }

    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
            user
        }
    });
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const userType = req.user.userType;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Current password and new password are required'
        });
    }

    // Get user with current password
    let user;
    if (userType === 'admin') {
        user = await UserAdmin.findById(userId);
    } else {
        user = await User.findById(userId);
    }

    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    let isCurrentPasswordValid;
    if (userType === 'admin') {
        isCurrentPasswordValid = await UserAdmin.validatePassword(user, currentPassword);
    } else {
        isCurrentPasswordValid = await User.validatePassword(user, currentPassword);
    }

    if (!isCurrentPasswordValid) {
        return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }

    // Update password
    let updatedUser;
    if (userType === 'admin') {
        updatedUser = await UserAdmin.updatePassword(userId, newPassword);
    } else {
        updatedUser = await User.updatePassword(userId, newPassword);
    }

    // Revoke all refresh tokens to force re-login
    await RefreshToken.revokeUserTokens(userId, userType);

    res.status(200).json({
        success: true,
        message: 'Password changed successfully. Please login again.',
        data: {
            user: updatedUser
        }
    });
});

// Verify token (for checking if token is still valid)
const verifyToken = asyncHandler(async (req, res) => {
    // If we reach here, token is valid (handled by middleware)
    // But req.user from JWT might be outdated (no avatar_url, etc)
    // So fetch fresh user data from database
    const userId = req.user.id;
    const userType = req.user.userType;

    let user;
    if (userType === 'admin') {
        user = await UserAdmin.findById(userId);
    } else {
        user = await User.findById(userId);
    }

    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
            user
        }
    });
});

// Google OAuth Login
const googleLogin = asyncHandler(async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({
            success: false,
            message: 'Google credential is required',
            error: 'MISSING_CREDENTIAL'
        });
    }

    try {
        // Verify Google token
        const { verifyGoogleToken } = require('../utils/googleAuth');
        const googleData = await verifyGoogleToken(credential);

        // Check if email is verified
        if (!googleData.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email not verified by Google',
                error: 'EMAIL_NOT_VERIFIED'
            });
        }

        // Find or create user
        const user = await User.findOrCreateGoogleUser(googleData);

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ với admin để được hỗ trợ.',
                error: 'ACCOUNT_DEACTIVATED'
            });
        }

        // Generate tokens
        const tokens = generateTokenPair(user);

        // Save refresh token to database
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await RefreshToken.createRefreshToken({
            user_id: user.id,
            token: tokens.refreshToken,
            user_type: 'user',
            expires_at: expiresAt
        });

        res.status(200).json({
            success: true,
            message: 'Google login successful',
            data: {
                user,
                tokens
            }
        });
    } catch (error) {
        console.error('Google login error:', error);

        if (error.message === 'Invalid Google token') {
            return res.status(401).json({
                success: false,
                message: 'Invalid Google credential',
                error: 'INVALID_GOOGLE_TOKEN'
            });
        }

        if (error.message === 'Email already exists') {
            return res.status(409).json({
                success: false,
                message: 'Email đã được sử dụng với tài khoản Google khác',
                error: 'EMAIL_ALREADY_EXISTS'
            });
        }

        throw error;
    }
});

module.exports = {
    adminLogin,
    userLogin,
    refreshToken,
    logout,
    logoutAll,
    getProfile,
    changePassword,
    verifyToken,
    googleLogin
};