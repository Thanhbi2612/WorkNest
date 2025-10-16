import { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { useSettings } from '../../context/SettingsContext';
import Pagination from './Pagination';
import './NotificationModal.css';

const NotificationModal = ({ isOpen, events = [], onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const { settings, filterNotifications } = useSettings();

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10; // 10 thông báo mỗi trang

    useEffect(() => {
        if (isOpen) {
            fetchAllNotifications();
        }
    }, [isOpen, currentPage, settings.notifications.enabled, settings.notifications.types]);

    const fetchAllNotifications = async () => {
        if (!settings.notifications.enabled) {
            setNotifications([]);
            setTotalItems(0);
            setTotalPages(1);
            return;
        }

        try {
            setLoading(true);
            // Sử dụng pagination từ backend
            const response = await notificationService.getAllNotifications(currentPage, itemsPerPage);

            if (response.success) {
                const filtered = filterNotifications(response.data.notifications);
                setNotifications(filtered);

                // Update pagination info nếu backend trả về
                if (response.data.pagination) {
                    setTotalPages(response.data.pagination.totalPages || response.data.pagination.total_pages || 1);
                    setTotalItems(response.data.pagination.totalItems || response.data.pagination.total_notifications || filtered.length);
                } else {
                    // Fallback nếu backend chưa có pagination format mới
                    setTotalItems(filtered.length);
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };


    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleEventRead = (eventId) => {
        const readEvents = JSON.parse(localStorage.getItem('readEvents') || '[]');
        if (!readEvents.includes(eventId)) {
            readEvents.push(eventId);
            localStorage.setItem('readEvents', JSON.stringify(readEvents));
            // Force re-render
            setNotifications(prev => [...prev]);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTypeIcon = (type) => {
        const icons = {
            task_assigned: '📋',
            task_updated: '🔄',
            task_completed: '✅',
            deadline_reminder: '⏰'
        };
        return icons[type] || '📢';
    };

    const getTypeBadge = (type) => {
        const badges = {
            task_assigned: { label: 'Mới', color: '#3b82f6' },
            task_updated: { label: 'Cập nhật', color: '#f59e0b' },
            task_completed: { label: 'Hoàn thành', color: '#10b981' },
            deadline_reminder: { label: 'Nhắc nhở', color: '#ef4444' },
            calendar_event: { label: 'Sự kiện', color: '#10b981' }
        };
        return badges[type] || { label: 'Khác', color: '#6b7280' };
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    // Kết hợp notifications và events
    const readEvents = JSON.parse(localStorage.getItem('readEvents') || '[]');
    const combinedItems = [
        ...notifications.map(n => ({ ...n, itemType: 'notification' })),
        ...events.map(e => ({
            ...e,
            itemType: 'event',
            type: 'calendar_event',
            created_at: e.start_date,
            is_read: readEvents.includes(e.id),
            message: e.description
        }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const unreadCount = combinedItems.filter(n => !n.is_read).length;

    if (!isOpen) return null;

    return (
        <div className="notification-modal-overlay" onClick={onClose}>
            <div className="notification-modal-compact" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header-compact">
                    <div className="header-title">
                        <h3>Tất cả thông báo</h3>
                        {unreadCount > 0 && (
                            <span className="unread-badge">{unreadCount} chưa đọc</span>
                        )}
                    </div>
                    <div className="header-actions">
                        <button className="close-btn-compact" onClick={onClose}>✕</button>
                    </div>
                </div>

                {/* Table */}
                <div className="modal-content-compact">
                    {loading ? (
                        <div className="loading-state-compact">
                            <div className="loading-spinner-compact"></div>
                            <p>Đang tải...</p>
                        </div>
                    ) : combinedItems.length === 0 ? (
                        <div className="empty-state-compact">
                            <p>Không có thông báo nào</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="notifications-table">
                                <thead>
                                    <tr>
                                        <th className="col-status"></th>
                                        <th className="col-type">Loại</th>
                                        <th className="col-title">Tiêu đề</th>
                                        <th className="col-message">Nội dung</th>
                                        <th className="col-time">Thời gian</th>
                                        <th className="col-action">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {combinedItems.map((item) => {
                                        const badge = getTypeBadge(item.type);
                                        return (
                                            <tr
                                                key={`${item.itemType}-${item.id}`}
                                                className={!item.is_read ? 'unread-row' : 'read-row'}
                                            >
                                                <td className="col-status">
                                                    {!item.is_read && (
                                                        <span className="status-dot"></span>
                                                    )}
                                                </td>
                                                <td className="col-type">
                                                    <span className="type-badge" style={{ backgroundColor: badge.color }}>
                                                        {item.itemType === 'event' ? '📅' : getTypeIcon(item.type)} {badge.label}
                                                    </span>
                                                </td>
                                                <td className="col-title">
                                                    <span className="notification-title-text">
                                                        {item.title}
                                                        {item.itemType === 'event' && item.start_date && (
                                                            <span style={{ marginLeft: '8px', color: '#10b981', fontSize: '12px' }}>
                                                                🕐 {formatTime(item.start_date)}
                                                                {item.end_date && ` - ${formatTime(item.end_date)}`}
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="col-message">
                                                    <span className="notification-message-text">
                                                        {item.message || '—'}
                                                    </span>
                                                </td>
                                                <td className="col-time">
                                                    <span className="time-text">
                                                        {formatDate(item.created_at)}
                                                    </span>
                                                </td>
                                                <td className="col-action">
                                                    {!item.is_read && (
                                                        <button
                                                            className="mark-read-btn"
                                                            onClick={() => item.itemType === 'notification' ? handleMarkAsRead(item.id) : handleEventRead(item.id)}
                                                            title="Đánh dấu đã đọc"
                                                        >
                                                            Đọc
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!loading && combinedItems.length > 0 && totalPages > 1 && (
                    <div style={{ padding: '0 20px' }}>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            onPageChange={handlePageChange}
                            loading={loading}
                        />
                    </div>
                )}

               
            </div>
        </div>
    );
};

export default NotificationModal;
