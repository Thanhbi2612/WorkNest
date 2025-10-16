import { useNavigate } from 'react-router-dom';
import './MessageDropdown.css';

const MessageDropdown = ({
    notifications,
    loading,
    onNotificationClick,
    onMarkAllRead,
    onClose
}) => {
    const navigate = useNavigate();

    const handleNotificationClick = (notification) => {
        // Call parent handler to mark as read
        if (onNotificationClick) {
            onNotificationClick(notification);
        }

        // Navigate to chat with conversation opened
        if (notification.conversation_id) {
            navigate('/chat', {
                state: { openConversationId: notification.conversation_id }
            });
            onClose();
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMinutes = diffInMs / (1000 * 60);
        const diffInHours = diffInMinutes / 60;
        const diffInDays = diffInHours / 24;

        if (diffInMinutes < 1) {
            return 'Vừa xong';
        } else if (diffInMinutes < 60) {
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

    // Extract sender name from message
    const getSenderName = (notification) => {
        if (!notification.message) return 'Ai đó';

        // Message format: "John Doe đã gửi cho bạn 1 tin nhắn"
        const match = notification.message.match(/^(.+?)\s+đã gửi/);
        return match ? match[1] : 'Ai đó';
    };

    return (
        <div className="message-dropdown">
            {/* Header */}
            <div className="message-dropdown-header">
                <div className="header-content">
                    <h3> Tin nhắn</h3>
                    <p>{notifications.length} tin nhắn chưa đọc</p>
                </div>
                <div className="message-dropdown-actions">
                    {notifications.length > 0 && (
                        <button
                            className="action-btn mark-all-btn"
                            onClick={onMarkAllRead}
                            title="Đánh dấu tất cả đã đọc"
                        >
                             Đánh dấu đã đọc
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="message-dropdown-content">
                {loading ? (
                    <div className="message-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải tin nhắn...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="no-messages">
                        <h4>Không có tin nhắn mới</h4>
                        <p>Bạn đã đọc hết tất cả tin nhắn</p>
                    </div>
                ) : (
                    <div className="messages-list">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`message-item ${!notification.is_read ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                {/* Sender Avatar */}
                                <div className="message-avatar">
                                    <div className="avatar-circle">
                                        {getSenderName(notification).charAt(0).toUpperCase()}
                                    </div>
                                    {!notification.is_read && (
                                        <div className="unread-indicator"></div>
                                    )}
                                </div>

                                {/* Message Body */}
                                <div className="message-body">
                                    <div className="message-sender">
                                        {getSenderName(notification)}
                                    </div>
                                    <div className="message-preview">
                                        đã nhắn tin cho bạn
                                    </div>
                                    <div className="message-time">
                                        {formatDate(notification.created_at)}
                                    </div>
                                </div>

                                {/* Arrow icon */}
                                <div className="message-arrow">
                                    →
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="message-dropdown-footer">
                    <button
                        className="view-all-btn"
                        onClick={() => {
                            navigate('/chat');
                            onClose();
                        }}
                    >
                        Xem tất cả tin nhắn 
                    </button>
                </div>
            )}
        </div>
    );
};

export default MessageDropdown;
