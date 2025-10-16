const { Notification } = require('../models');
const { asyncHandler, AppError } = require('../middleware');

// Get notifications for current user (with filters)
const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, is_read, type } = req.query;
    const offset = (page - 1) * limit;

    // Build filters
    const filters = {};
    if (is_read !== undefined) {
        filters.is_read = is_read === 'true' || is_read === true;
    }
    if (type) {
        filters.type = type;
    }

    const notifications = await Notification.findByUserId(userId, parseInt(limit), offset, filters);
    const totalNotifications = await Notification.countByUserId(userId, filters);

    res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
            notifications,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(totalNotifications / limit),
                total_notifications: totalNotifications,
                notifications_per_page: parseInt(limit)
            }
        }
    });
});

// Get unread notifications for current user
const getUnreadNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { type } = req.query;

    // Build filters
    const filters = { is_read: false };
    if (type) {
        filters.type = type;
    }

    const notifications = await Notification.findByUserId(userId, 100, 0, filters);

    res.status(200).json({
        success: true,
        message: 'Unread notifications retrieved successfully',
        data: {
            notifications
        }
    });
});

// Get unread notification count
const getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { groupByType } = req.query;

    // Nếu request muốn group by type/category
    if (groupByType === 'true') {
        const countData = await Notification.getUnreadCountByCategory(userId);

        return res.status(200).json({
            success: true,
            message: 'Unread count by type retrieved successfully',
            data: countData
        });
    }

    // Mặc định: chỉ trả về tổng số (backward compatible)
    const count = await Notification.getUnreadCount(userId);

    res.status(200).json({
        success: true,
        message: 'Unread count retrieved successfully',
        data: {
            count
        }
    });
});

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    const notification = await Notification.markAsRead(notificationId, userId);

    if (!notification) {
        throw new AppError('Notification not found or access denied', 404, 'NOTIFICATION_NOT_FOUND');
    }

    res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: {
            notification
        }
    });
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const result = await Notification.markAllAsRead(userId);

    res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: {
            updated_count: result.updated_count || 0
        }
    });
});

module.exports = {
    getNotifications,
    getUnreadNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};