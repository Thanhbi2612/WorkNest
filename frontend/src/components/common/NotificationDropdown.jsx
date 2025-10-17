import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './NotificationDropdown.css';

const NotificationDropdown = ({
    notifications,
    events = [],
    loading,
    onNotificationRead,
    onEventRead,
    onMarkAllRead,
    onViewAll,
    onClose
}) => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const handleNotificationClick = (notification) => {
        // Đánh dấu đã đọc khi click
        if (!notification.is_read) {
            onNotificationRead(notification.id);
        }

        // Navigate based on notification type
        if (notification.type === 'message_new' && notification.conversation_id) {
            // Navigate to chat with conversation opened
            navigate('/chat', {
                state: { openConversationId: notification.conversation_id }
            });
            onClose(); // Close dropdown
        } else if (notification.task_id) {
            // Admin: Chỉ đánh dấu đã đọc, không navigate
            if (isAdmin()) {
                // Notification đã được mark as read ở trên, chỉ cần đóng dropdown
                // Badge sẽ tự động cập nhật
                return;
            }

            // User: Navigate to tasks page with task opened
            let tasksPath = '/tasks/not-started'; // Default
            navigate(tasksPath, {
                state: { openTaskId: notification.task_id }
            });
            onClose(); // Close dropdown
        }
    };

    const handleEventClick = (event) => {
        // Đánh dấu đã đọc khi click
        onEventRead(event.id);
    };

    const formatDate = (dateString) => {
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
    };

    const getTypeIcon = (type) => {
        const icons = {
            task_assigned: '📋',
            task_updated: '🔄',
            task_completed: '✅',
            deadline_reminder: '⏰',
            message_new: '💬'
        };
        return icons[type] || '📢';
    };

    const getTypeColor = (type) => {
        const colors = {
            task_assigned: '#3b82f6',
            task_updated: '#f59e0b',
            task_completed: '#10b981',
            deadline_reminder: '#ef4444',
            message_new: '#8b5cf6'
        };
        return colors[type] || '#6b7280';
    };

    const getTypeLabel = (type) => {
        const labels = {
            task_assigned: 'Task được giao',
            task_updated: 'Task được cập nhật',
            task_completed: 'Task hoàn thành',
            deadline_reminder: 'Nhắc nhở deadline',
            calendar_event: 'Sự kiện lịch',
            message_new: 'Tin nhắn mới'
        };
        return labels[type] || type;
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    // Kết hợp notifications và events, sắp xếp theo thời gian
    const combinedItems = [
        ...notifications.map(n => ({ ...n, itemType: 'notification' })),
        ...events.map(e => ({ ...e, itemType: 'event', type: 'calendar_event', created_at: e.start_date }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return (
        <div className="notification-dropdown">
            {/* Header */}
            <div className="notification-header">
                <div className="header-content">
                    <h3>Thông báo</h3>
                    <p>{combinedItems.length} thông báo chưa đọc</p>
                </div>
                <div className="notification-actions">
                    {combinedItems.length > 0 && (
                        <button
                            className="action-btn mark-all-btn"
                            onClick={onMarkAllRead}
                            title="Đánh dấu tất cả đã đọc"
                        >
                             Đánh dấu đã đọc
                        </button>
                    )}
                    <button
                        className="action-btn view-all-btn"
                        onClick={onViewAll}
                        title="Xem tất cả thông báo"
                    >
                         Xem tất cả
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="notification-content">
                {loading ? (
                    <div className="notification-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải thông báo...</p>
                    </div>
                ) : combinedItems.length === 0 ? (
                    <div className="no-notifications">
                        <h4>Không có thông báo mới</h4>
                        <p>Bạn đã đọc hết tất cả thông báo</p>
                    </div>
                ) : (
                    <div className="notifications-list">
                        {combinedItems.map((item) => (
                            <div
                                key={`${item.itemType}-${item.id}`}
                                className={`notification-item ${item.itemType === 'notification' && !item.is_read ? 'unread' : ''} ${item.itemType === 'event' ? 'event-item' : ''}`}
                                onClick={() => item.itemType === 'notification' ? handleNotificationClick(item) : handleEventClick(item)}
                            >

                                <div className="notification-body">
                                    <div className="notification-title">
                                        {item.title}
                                    </div>

                                    {(item.message || item.description) && (
                                        <div className="notification-message">
                                            {item.message || item.description}
                                        </div>
                                    )}

                                    <div className="notification-meta">
                                        <span className="notification-type" style={item.itemType === 'event' ? { background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', color: '#065f46' } : {}}>
                                            {getTypeLabel(item.type)}
                                        </span>
                                        {item.itemType === 'event' && (
                                            <>
                                                <span className="meta-separator">•</span>
                                                <span className="event-time">
                                                     {formatTime(item.start_date)}
                                                    {item.end_date && ` - ${formatTime(item.end_date)}`}
                                                </span>
                                            </>
                                        )}
                                        {item.task_title && (
                                            <>
                                                <span className="meta-separator">•</span>
                                                <span className="task-title">
                                                    {item.task_title}
                                                </span>
                                            </>
                                        )}
                                        <span className="meta-separator">•</span>
                                        <span className="notification-time">
                                            {formatDate(item.created_at)}
                                        </span>
                                    </div>
                                </div>

                                {item.itemType === 'notification' && !item.is_read && (
                                    <div className="unread-dot"></div>
                                )}
                                {item.itemType === 'event' && (
                                    <div className="unread-dot" style={{ background: '#10b981', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.15)' }}></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationDropdown;