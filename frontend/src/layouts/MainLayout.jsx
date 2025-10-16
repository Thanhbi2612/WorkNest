import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import TaskSidebar from '../components/tasks/TaskSidebar';
import NotificationBell from '../components/common/NotificationBell';
import MessageDropdown from '../components/chat/MessageDropdown';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useSocket } from '../context/SocketContext';
import { useNotificationCounts } from '../hooks/useNotificationCounts';
import { useMessageNotifications } from '../hooks/useMessageNotifications';
import './MainLayout.css';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useSettings();
  const { socket } = useSocket();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showMessageDropdown, setShowMessageDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const messageDropdownRef = useRef(null);

  // Fetch notification counts by type
  const { counts } = useNotificationCounts(130000); // Refresh mỗi 30s

  // Message notifications hook
  const {
    notifications: messageNotifications,
    unreadCount: unreadMessageCount,
    loading: messageLoading,
    markAsRead: markMessageAsRead,
    markAllAsRead: markAllMessagesAsRead,
    fetchMessageNotifications
  } = useMessageNotifications(30000);

  // Close message dropdown when click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (messageDropdownRef.current && !messageDropdownRef.current.contains(event.target)) {
        setShowMessageDropdown(false);
      }
    };

    if (showMessageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMessageDropdown]);

  // Handle message notification click
  const handleMessageClick = (notification) => {
    markMessageAsRead(notification.id);
  };

  // Handle mark all messages as read
  const handleMarkAllMessagesRead = () => {
    markAllMessagesAsRead();
  };

  // Get icon filter based on theme mode
  const getIconFilter = () => {
    return settings.appearance.mode === 'light'
      ? 'brightness(0) saturate(100%)' // Dark color for light mode
      : 'brightness(0) invert(1)'; // White color for dark mode
  };

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

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

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
                color="#f59e0b"
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
              <Badge count={counts.byType.report} color="#8b5cf6" size="sm" />
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
                onClick={() => setShowMessageDropdown(!showMessageDropdown)}
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
                  height: '40px',
                  marginRight: '8px'
                }}
                title={`${unreadMessageCount} tin nhắn chưa đọc`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = settings.appearance.mode === 'light' ? '#e5e7eb' : '#374151';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <img
                  src="/chat_message.png"
                  alt="Messages"
                  style={{
                    width: '30px',
                    height: '30px',
                    filter: getIconFilter()
                  }}
                />
                {unreadMessageCount > 0 && (
                  <Badge
                    count={unreadMessageCount}
                    color="#8b5cf6"
                    size="sm"
                    rightOffset="-5px"
                    topOffset="-5px"
                  />
                )}
              </button>

              {/* Message Dropdown */}
              {showMessageDropdown && (
                <MessageDropdown
                  notifications={messageNotifications}
                  loading={messageLoading}
                  onNotificationClick={handleMessageClick}
                  onMarkAllRead={handleMarkAllMessagesRead}
                  onClose={() => setShowMessageDropdown(false)}
                />
              )}
            </div>

            <NotificationBell />
            <div className="user-profile-wrapper" ref={dropdownRef}>
              <div className={`user-profile ${userDropdownOpen ? 'active' : ''}`} onClick={toggleUserDropdown}>
                {/* Avatar */}
                {user?.avatar_url ? (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundImage: `url(${(() => {
                      const avatarUrl = user.avatar_url;
                      if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl;
                      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                      const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
                      return `${baseUrl}${avatarUrl}`;
                    })()})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    marginRight: '8px'
                  }} />
                ) : (
                  <img
                    src={isAdmin() ? "/user_admin.png" : "/user.png"}
                    alt="User Icon"
                    style={{ width: '24px', height: '24px', marginRight: '8px' }}
                  />
                )}
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