import  { useState, useEffect, useRef } from 'react';
import { notificationService } from '../../services/notificationService';
import { getTodayEvents } from '../../services/eventService';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import NotificationModal from './NotificationModal';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Get settings and auth context
  const { settings, filterNotifications } = useSettings();
  const { isAdmin } = useAuth();

  // Lấy số lượng thông báo chưa đọc
  const fetchUnreadCount = async () => {
    try {
      // Admin đếm: report_submitted + calendar notifications
      // User: đếm tất cả (không filter)
      const filters = isAdmin() ? {} : {}; // Tạm thời không filter, sẽ filter ở backend
      const response = await notificationService.getUnreadCount(filters);
      if (response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Lấy sự kiện trong ngày
  const fetchTodayEvents = async () => {
    try {
      const response = await getTodayEvents();
      if (response.success) {
        const todayEvents = response.data || [];
        // Lọc các event chưa đọc từ localStorage
        const readEvents = JSON.parse(localStorage.getItem('readEvents') || '[]');
        const unread = todayEvents.filter(event => !readEvents.includes(event.id));
        setEvents(unread);
      }
    } catch (error) {
      console.error('Failed to fetch today events:', error);
      setEvents([]);
    }
  };

  // Lấy thông báo chưa đọc
  const fetchUnreadNotifications = async () => {
    // Nếu notifications bị tắt hoàn toàn, không fetch
    if (!settings.notifications.enabled) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      // Admin: không filter (backend sẽ filter)
      // User: không filter
      const filters = {};
      const response = await notificationService.getUnreadNotifications(filters);
      if (response.success) {
        // Filter notifications dựa trên settings (cho user)
        const filtered = isAdmin()
          ? response.data.notifications
          : filterNotifications(response.data.notifications);
        setNotifications(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications khi component mount hoặc settings thay đổi
  useEffect(() => {
    fetchUnreadCount();
    fetchUnreadNotifications();

    // Không cần fetch events riêng nữa vì đã có calendar notifications
    // fetchTodayEvents(); // DISABLED

    // Refresh mỗi 30 giây để cập nhật real-time
    const interval = setInterval(() => {
      fetchUnreadCount();
      // Không cần fetch events riêng nữa
      // if (!isAdmin()) {
      //   fetchTodayEvents();
      // }
      if (showDropdown) {
        fetchUnreadNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [showDropdown, settings.notifications.enabled, settings.notifications.types]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Xử lý khi đánh dấu thông báo đã đọc
  const handleNotificationRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        // Cập nhật danh sách và số lượng
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Xử lý khi đánh dấu event đã đọc
  const handleEventRead = (eventId) => {
    const readEvents = JSON.parse(localStorage.getItem('readEvents') || '[]');
    if (!readEvents.includes(eventId)) {
      readEvents.push(eventId);
      localStorage.setItem('readEvents', JSON.stringify(readEvents));
      setEvents(prev => prev.filter(e => e.id !== eventId));
    }
  };

  // Xử lý khi đánh dấu tất cả đã đọc
  const handleMarkAllRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications([]);
        setUnreadCount(0);
      }

      // Đánh dấu tất cả events đã đọc
      const allEventIds = events.map(e => e.id);
      const readEvents = JSON.parse(localStorage.getItem('readEvents') || '[]');
      const updatedReadEvents = [...new Set([...readEvents, ...allEventIds])];
      localStorage.setItem('readEvents', JSON.stringify(updatedReadEvents));
      setEvents([]);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Xử lý khi xem tất cả
  const handleViewAll = () => {
    setShowDropdown(false);
    setShowModal(true);
  };

  // Tính toán số lượng notifications sau khi filter
  const filteredNotificationsCount = notifications.length;
  // Không cộng events nữa vì đã có calendar notifications trong bảng notifications
  const totalCount = filteredNotificationsCount;
  const hasNotifications = totalCount > 0 && settings.notifications.enabled;

  return (
    <div className="notification-bell relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px'
        }}
        title={settings.notifications.enabled ? `${totalCount} thông báo chưa đọc` : 'Thông báo đã tắt'}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#374151';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <img
          src="/noti_bell.png"
          alt="Notifications"
          style={{
            width: '40px',
            height: '40px',
            filter: hasNotifications ? 'none' : 'grayscale(100%) opacity(0.5)'
          }}
        />

        {/* Badge hiển thị số lượng */}
        {hasNotifications && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            backgroundColor: '#dc2626',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '20px'
          }}>
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <NotificationDropdown
          notifications={notifications}
          events={events}
          loading={loading}
          onNotificationRead={handleNotificationRead}
          onEventRead={handleEventRead}
          onMarkAllRead={handleMarkAllRead}
          onViewAll={handleViewAll}
          onClose={() => setShowDropdown(false)}
        />
      )}

      {/* Modal xem tất cả */}
      <NotificationModal
        isOpen={showModal}
        events={events}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default NotificationBell;