import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { notificationService } from '../services/notificationService';

/**
 * Hook để quản lý message notifications
 * Fetch từ API và listen socket events
 */
export const useMessageNotifications = (refreshInterval = 30000) => {
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch message notifications
    const fetchMessageNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationService.getUnreadNotifications({
                type: 'message_new'
            });

            if (response.success) {
                setNotifications(response.data.notifications || []);
                setUnreadCount(response.data.notifications?.length || 0);
            }
        } catch (error) {
            console.error('Failed to fetch message notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const response = await notificationService.getUnreadCount();
            if (response.success) {
                // Get message count from byType
                const messageCount = response.data.byType?.message || 0;
                setUnreadCount(messageCount);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    // Listen for new message notifications via socket
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (data) => {
            if (data.type === 'message_new') {
                // Refresh notifications
                fetchMessageNotifications();
                fetchUnreadCount();
            }
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket]);

    // Initial fetch and periodic refresh
    useEffect(() => {
        fetchMessageNotifications();
        fetchUnreadCount();

        if (refreshInterval > 0) {
            const interval = setInterval(() => {
                fetchUnreadCount();
            }, refreshInterval);

            return () => clearInterval(interval);
        }
    }, [refreshInterval]);

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            const response = await notificationService.markAsRead(notificationId);
            if (response.success) {
                // Remove from list
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            // Mark each notification as read
            await Promise.all(
                notifications.map(n => notificationService.markAsRead(n.id))
            );

            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        fetchMessageNotifications,
        markAsRead,
        markAllAsRead
    };
};
