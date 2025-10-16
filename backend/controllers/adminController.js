const { UserAdmin, User, RefreshToken, Task } = require('../models');
const { asyncHandler } = require('../middleware');


// Dashboard stats (admin only)
const getDashboardStats = asyncHandler(async (req, res) => {
    // Get user stats
    const userStats = await User.getUserStats();

    // Get admin stats
    const totalAdmins = await UserAdmin.count();
    const activeAdmins = await UserAdmin.getAllActiveAdmins();

    // Get token stats
    const tokenStats = await RefreshToken.getTokenStats();

    // Get task stats
    const taskStats = await Task.getTaskStats();

    const stats = {
        users: {
            total: parseInt(userStats.total_users),
            active: parseInt(userStats.active_users),
            inactive: parseInt(userStats.inactive_users),
            new_last_30_days: parseInt(userStats.new_users_30_days)
        },
        admins: {
            total: totalAdmins,
            active: activeAdmins.length
        },
        tokens: {
            total: parseInt(tokenStats.total_tokens),
            active: parseInt(tokenStats.active_tokens),
            revoked: parseInt(tokenStats.revoked_tokens),
            expired: parseInt(tokenStats.expired_tokens)
        },
        tasks: {
            total: parseInt(taskStats.total_tasks),
            completed: parseInt(taskStats.completed_tasks),
            in_progress: parseInt(taskStats.in_progress_tasks),
            not_started: parseInt(taskStats.not_started_tasks),
            overdue: parseInt(taskStats.overdue_tasks)
        }
    };

    res.status(200).json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: {
            stats
        }
    });
});

// Clean up expired tokens (admin only)
const cleanupTokens = asyncHandler(async (req, res) => {
    const cleanedCount = await RefreshToken.cleanupExpiredTokens();

    res.status(200).json({
        success: true,
        message: `Cleaned up ${cleanedCount} expired/revoked tokens`,
        data: {
            cleaned_count: cleanedCount
        }
    });
});

// Get system health (admin only)
const getSystemHealth = asyncHandler(async (req, res) => {
    const { testConnection } = require('../config/database');

    const dbHealth = await testConnection();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    const health = {
        status: 'healthy',
        database: dbHealth ? 'connected' : 'disconnected',
        uptime: Math.floor(uptime),
        memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
        },
        timestamp: new Date().toISOString()
    };

    res.status(200).json({
        success: true,
        message: 'System health retrieved successfully',
        data: {
            health
        }
    });
});

// Get admins for dropdown/chat (authenticated users)
const getAdminsForDropdown = asyncHandler(async (req, res) => {
    const admins = await UserAdmin.getAllActiveAdmins();

    res.status(200).json({
        success: true,
        message: 'Admins retrieved successfully',
        data: {
            admins: admins.map(admin => ({
                id: admin.id,
                username: admin.username,
                email: admin.email,
                avatar_url: admin.avatar_url
            }))
        }
    });
});

module.exports = {
    getDashboardStats,
    cleanupTokens,
    getSystemHealth,
    getAdminsForDropdown
};