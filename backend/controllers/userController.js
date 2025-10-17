const { User, UserAdmin } = require('../models');
const { validateUserRegistration } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// User Registration
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, first_name, last_name } = req.body;

    // Validate input
    const validation = validateUserRegistration({
        username,
        email,
        password,
        first_name,
        last_name
    });

    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validation.errors
        });
    }

    try {
        // Create user
        const newUser = await User.createUser({
            username,
            email,
            password,
            first_name,
            last_name
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: newUser
            }
        });
    } catch (error) {
        if (error.message === 'Username already exists') {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        if (error.message === 'Email already exists') {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

        throw error;
    }
});

// Update user profile (for authenticated users)
const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { username, email, first_name, last_name } = req.body;

    // Only allow user to update their own profile (unless admin)
    if (req.user.role !== 'admin' && parseInt(req.params.id) !== userId) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    const targetUserId = req.params.id || userId;

    try {
        const updatedUser = await User.updateProfile(targetUserId, {
            username,
            email,
            first_name,
            last_name
        });

        if (!updatedUser) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedUser
            }
        });
    } catch (error) {
        if (error.message === 'Username already exists') {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        if (error.message === 'Email already exists') {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

        throw error;
    }
});

// Get current user profile or user by ID
const getUserById = asyncHandler(async (req, res) => {
    // If route is /profile, use current user's ID
    const userId = req.params.id ? parseInt(req.params.id) : req.user.id;
    const requesterId = req.user.id;

    // Only allow admin or user accessing their own profile
    if (req.user.role !== 'admin' && userId !== requesterId) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: {
            user
        }
    });
});

// Get all users (admin only)
const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let users;
    if (search) {
        users = await User.searchUsers(search, parseInt(limit), offset);
    } else {
        users = await User.findAll(parseInt(limit), offset);
    }

    const totalUsers = await User.count();

    res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
            users,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(totalUsers / limit),
                total_users: totalUsers,
                users_per_page: parseInt(limit)
            }
        }
    });
});

// Toggle user active status (admin only)
const toggleUserStatus = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);

    const updatedUser = await User.toggleActiveStatus(userId);

    if (!updatedUser) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.status(200).json({
        success: true,
        message: `User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully`,
        data: {
            user: updatedUser
        }
    });
});

// Delete user (admin only)
const deleteUser = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);

    const deletedUser = await User.deleteById(userId);

    if (!deletedUser) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: {
            user: deletedUser
        }
    });
});

// Get users for dropdown (admin only) - lightweight version
const getUsersForDropdown = asyncHandler(async (req, res) => {
    const users = await User.getUsersForDropdown();

    res.status(200).json({
        success: true,
        message: 'Users for dropdown retrieved successfully',
        data: {
            users
        }
    });
});

// Get user statistics (admin only)
const getUserStats = asyncHandler(async (req, res) => {
    const stats = await User.getUserStats();

    res.status(200).json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: {
            stats
        }
    });
});

// Update current user profile (no email/role change)
const updateCurrentUserProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { username, first_name, last_name } = req.body;

    try {
        const updatedUser = await User.updateProfile(userId, {
            username,
            first_name,
            last_name
        });

        if (!updatedUser) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedUser
            }
        });
    } catch (error) {
        if (error.message === 'Username already exists') {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        throw error;
    }
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
        throw new AppError('Current password and new password are required', 400, 'VALIDATION_ERROR');
    }

    if (newPassword.length < 6) {
        throw new AppError('New password must be at least 6 characters', 400, 'VALIDATION_ERROR');
    }

    // Get user with password
    const user = await User.findByIdWithPassword(userId);

    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD');
    }

    // Update password (updatePassword will hash it)
    await User.updatePassword(userId, newPassword);

    res.status(200).json({
        success: true,
        message: 'Password changed successfully'
    });
});

// Delete current user account
const deleteCurrentUserAccount = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const deletedUser = await User.deleteById(userId);

    if (!deletedUser) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
        data: {
            user: deletedUser
        }
    });
});

// Reset user password (admin only)
const resetUserPassword = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;

    // Validate input
    if (!newPassword) {
        throw new AppError('New password is required', 400, 'VALIDATION_ERROR');
    }

    if (newPassword.length < 6) {
        throw new AppError('New password must be at least 6 characters', 400, 'VALIDATION_ERROR');
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Update password (updatePassword will hash it)
    await User.updatePassword(userId, newPassword);

    res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        data: {
            newPassword: newPassword // Return the new password so admin can share with user
        }
    });
});

// Upload avatar
const uploadAvatar = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userType = req.user.userType || req.user.role; // Get user type (admin or user)

    // Check if file was uploaded
    if (!req.file) {
        throw new AppError('No file uploaded', 400, 'NO_FILE');
    }

    try {
        // Get old avatar to delete later (check both admin and user tables)
        let user;
        if (userType === 'admin') {
            user = await UserAdmin.findById(userId);
        } else {
            user = await User.findById(userId);
        }
        const oldAvatarUrl = user?.avatar_url;

        // Process image with sharp (resize to 200x200, optimize)
        const filename = req.file.filename;
        const filepath = req.file.path;
        const outputPath = path.join(path.dirname(filepath), `optimized_${filename}`);

        await sharp(filepath)
            .resize(200, 200, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 90 })
            .toFile(outputPath);

        // Delete original file
        fs.unlinkSync(filepath);

        // Rename optimized file to original name
        fs.renameSync(outputPath, filepath);

        // Generate URL for avatar
        const avatarUrl = `/uploads/avatars/${filename}`;

        // Update avatar_url in database (admin or user table)
        let updatedUser;
        if (userType === 'admin') {
            updatedUser = await UserAdmin.updateById(userId, {
                avatar_url: avatarUrl
            });
        } else {
            updatedUser = await User.updateById(userId, {
                avatar_url: avatarUrl
            });
        }

        // Delete old avatar file if exists
        if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
            const oldFilePath = path.join(__dirname, '../public', oldAvatarUrl);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // Add userType to response so frontend can preserve it in localStorage
        const userWithType = {
            ...updatedUser,
            userType: userType
        };

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                avatar_url: avatarUrl,
                user: userWithType
            }
        });
    } catch (error) {
        // If error occurs, delete uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        throw error;
    }
});

module.exports = {
    registerUser,
    updateProfile,
    updateCurrentUserProfile,
    getUserById,
    getAllUsers,
    getUsersForDropdown,
    toggleUserStatus,
    deleteUser,
    deleteCurrentUserAccount,
    getUserStats,
    changePassword,
    resetUserPassword,
    uploadAvatar
};