import api from './api';

const notificationService = {
    // Get notifications for current user
    getNotifications: async (page = 1, limit = 20, filters = {}) => {
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', limit);

            // Thêm filters nếu có
            if (filters.type) {
                params.append('type', filters.type);
            }
            if (filters.is_read !== undefined) {
                params.append('is_read', filters.is_read);
            }

            const response = await api.get(`/notifications?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error getting notifications:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Get unread notifications for current user
    getUnreadNotifications: async (filters = {}) => {
        try {
            const params = new URLSearchParams();

            // Thêm filters nếu có
            if (filters.type) {
                params.append('type', filters.type);
            }

            const queryString = params.toString();
            const url = queryString ? `/notifications/unread?${queryString}` : '/notifications/unread';

            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error('Error getting unread notifications:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Get unread notification count
    getUnreadCount: async (filters = {}) => {
        try {
            const params = new URLSearchParams();

            // Thêm filters nếu có
            if (filters.type) {
                params.append('type', filters.type);
            }

            const queryString = params.toString();
            const url = queryString ? `/notifications/unread/count?${queryString}` : '/notifications/unread/count';

            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Get unread notification count grouped by type (task, calendar, report)
    getUnreadCountByType: async () => {
        try {
            const response = await api.get('/notifications/unread/count?groupByType=true');
            return response.data;
        } catch (error) {
            console.error('Error getting unread count by type:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Get all notifications (read and unread)
    getAllNotifications: async (page = 1, limit = 50) => {
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', limit);

            const response = await api.get(`/notifications?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error getting all notifications:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
        try {
            const response = await api.put(`/notifications/${notificationId}/read`, {}, {
                headers: { 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        try {
            const response = await api.put('/notifications/mark-all-read', {}, {
                headers: { 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Format notification for display
    formatNotificationForDisplay: (notification) => {
        return {
            ...notification,
            formattedCreatedAt: notificationService.formatDate(notification.created_at),
            typeLabel: notificationService.getTypeLabel(notification.type)
        };
    },

    getTypeLabel: (type) => {
        const labels = {
            task_assigned: 'Task được giao',
            task_updated: 'Task được cập nhật',
            task_completed: 'Task hoàn thành',
            deadline_reminder: 'Nhắc nhở deadline',
            report_submitted: 'Báo cáo mới'
        };
        return labels[type] || type;
    },

    formatDate: (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInHours = diffInMs / (1000 * 60 * 60);
        const diffInDays = diffInHours / 24;

        if (diffInHours < 1) {
            const diffInMinutes = diffInMs / (1000 * 60);
            return `${Math.floor(diffInMinutes)} phút trước`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)} giờ trước`;
        } else if (diffInDays < 7) {
            return `${Math.floor(diffInDays)} ngày trước`;
        } else {
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    },

    getTypeIcon: (type) => {
        const icons = {
            task_assigned: '📋',
            task_updated: '🔄',
            task_completed: '✅',
            deadline_reminder: '⏰',
            report_submitted: '📊'
        };
        return icons[type] || '📢';
    },

    getTypeColor: (type) => {
        const colors = {
            task_assigned: '#3b82f6',
            task_updated: '#f59e0b',
            task_completed: '#10b981',
            deadline_reminder: '#ef4444',
            report_submitted: '#8b5cf6'
        };
        return colors[type] || '#6b7280';
    }
};

export { notificationService };