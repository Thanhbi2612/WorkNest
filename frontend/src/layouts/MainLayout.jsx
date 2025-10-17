import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import TaskSidebar from '../components/tasks/TaskSidebar';
import NotificationBell from '../components/common/NotificationBell';
import MessageDropdown from '../components/chat/MessageDropdown';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useNotificationCounts } from '../hooks/useNotificationCounts';
import { notificationService } from '../services/notificationService';
import './MainLayout.css';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [messageDropdownOpen, setMessageDropdownOpen] = useState(false);
  const [messageNotifications, setMessageNotifications] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const dropdownRef = useRef(null);
  const messageDropdownRef = useRef(null);

  // Fetch notification counts by type
  const { counts, refetch: refetchCounts } = useNotificationCounts(130000); // Refresh mỗi 30s

  // Message notification count (from counts.byType.message)
  const messageCount = counts?.byType?.message || 0;

  // Listen for custom event to refresh counts
  useEffect(() => {
    const handleRefresh = () => {
      refetchCounts();
    };

    window.addEventListener('refreshNotificationCounts', handleRefresh);
    return () => window.removeEventListener('refreshNotificationCounts', handleRefresh);
  }, [refetchCounts]);

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserDropdownOpen(false);
  };

  // Fetch message notifications khi mở dropdown
  const fetchMessageNotifications = async () => {
    try {
      setLoadingMessages(true);
      const response = await notificationService.getUnreadNotifications({ type: 'message_new' });
      if (response.success) {
        setMessageNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch message notifications:', error);
      setMessageNotifications([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Fetch messages khi dropdown mở
  useEffect(() => {
    if (messageDropdownOpen) {
      fetchMessageNotifications();
    }
  }, [messageDropdownOpen]);

  // Handle message notification click
  const handleMessageNotificationClick = async (notification) => {
    try {
      await notificationService.markAsRead(notification.id);
      // Remove from list
      setMessageNotifications(prev => prev.filter(n => n.id !== notification.id));
      // Refresh counts để update badge
      refetchCounts();
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  // Handle mark all messages as read
  const handleMarkAllMessagesRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setMessageNotifications([]);
      // Refresh counts để update badge
      refetchCounts();
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
    }
  };

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (messageDropdownRef.current && !messageDropdownRef.current.contains(event.target)) {
        setMessageDropdownOpen(false);
      }
    };

    if (userDropdownOpen || messageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen, messageDropdownOpen]);

  return (
    <div className="main-layout">
      <nav className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-header">
          {!sidebarCollapsed && <h2>Task Manager</h2>}
        </div>

        <ul className="nav-menu">
          <li>
            <Link
              to="/"
              className={`nav-link ${isActiveRoute('/') ? 'active' : ''}`}
            >
               Dashboard
            </Link>
          </li>
          {isAdmin() && (
            <li>
              <Link
                to="/user-management"
                className={`nav-link ${isActiveRoute('/user-management') ? 'active' : ''}`}
              >
                 Quản lý Tài khoản
              </Link>
            </li>
          )}
          <li>
            <TaskSidebar
              isCollapsed={sidebarCollapsed}
              taskNotificationCount={counts.byType.task}
              taskByStatus={counts.taskByStatus}
            />
          </li>
          {isAdmin() && (
            <li>
              <Link
                to="/projects"
                className={`nav-link ${isActiveRoute('/projects') ? 'active' : ''}`}
              >
                 Dự án
              </Link>
            </li>
          )}
          <li>
            <Link
              to="/calendar"
              className={`nav-link ${isActiveRoute('/calendar') ? 'active' : ''}`}
              style={{ position: 'relative' }}
            >
               Lịch
              <Badge
                count={counts.byType.calendar}
                color="#3b82f6"
                size="sm"
                rightOffset="2px"
                topOffset="2px"
              />
            </Link>
          </li>
          <li>
            <Link
              to="/chat"
              className={`nav-link ${isActiveRoute('/chat') ? 'active' : ''}`}
            >
               Tin nhắn
            </Link>
          </li>
          <li>
            <Link
              to="/reports"
              className={`nav-link ${isActiveRoute('/reports') ? 'active' : ''}`}
              style={{ position: 'relative' }}
            >
               Báo cáo
              <Badge
                count={counts.byType.report}
                color="#8b5cf6"
                size="sm"
                rightOffset="2px"
                topOffset="2px"
              />
            </Link>
          </li>
          <li>
            <Link
              to="/settings"
              className={`nav-link ${isActiveRoute('/settings') ? 'active' : ''}`}
            >
               Cài đặt
            </Link>
          </li>
        </ul>
      </nav>

      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="top-header">
          <div className="header-left">
            <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
              {sidebarCollapsed ? '☰' : '✕'}
            </button>
            <h1>Quản lý công việc</h1>
          </div>
          <div className="header-right">
            {/* Chat Message Icon with Dropdown */}
            <div style={{ position: 'relative' }} ref={messageDropdownRef}>
              <button
                className="header-icon-btn"
                onClick={() => setMessageDropdownOpen(!messageDropdownOpen)}
                title={messageCount > 0 ? `${messageCount} tin nhắn chưa đọc` : 'Tin nhắn'}
                style={{
                  width: '40px',
                  height: '40px',
                  position: 'relative'
                }}
              >
                <img
                  src="/chat_message.png"
                  alt="Messages"
                  className="chat-message-icon"
                  style={{
                    width: '30px',
                    height: '30px'
                  }}
                />
                {/* Badge hiển thị số lượng */}
                {messageCount > 0 && (
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
                    {messageCount > 99 ? '99+' : messageCount}
                  </span>
                )}
              </button>

              {/* Message Dropdown */}
              {messageDropdownOpen && (
                <MessageDropdown
                  notifications={messageNotifications}
                  loading={loadingMessages}
                  onNotificationClick={handleMessageNotificationClick}
                  onMarkAllRead={handleMarkAllMessagesRead}
                  onClose={() => setMessageDropdownOpen(false)}
                />
              )}
            </div>

            <NotificationBell />
            <div className="user-profile-wrapper" ref={dropdownRef}>
              <div className={`user-profile ${userDropdownOpen ? 'active' : ''}`} onClick={toggleUserDropdown}>
                <img
                  src={isAdmin() ? "/user_admin.png" : "/user.png"}
                  alt="User Icon"
                  style={{ width: '24px', height: '24px', marginRight: '8px' }}
                />
                <span>{user?.first_name || user?.username || 'User'}</span>
              </div>
              {userDropdownOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-item user-info">
                    <div className="user-name">{user?.first_name || user?.username || 'User'}</div>
                    <div className="user-email">{user?.email || 'user@example.com'}</div>
                  </div>
                  <hr className="dropdown-divider" />
                  <Link
                    to="/profile"
                    className="dropdown-item profile-btn"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    Quản lý tài khoản 
                  </Link>
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;