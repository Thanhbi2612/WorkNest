import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';
import './TaskSidebar.css';

const TaskSidebar = ({ isCollapsed, taskNotificationCount = 0, taskByStatus = {} }) => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const { isAdmin } = useAuth();

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const taskMenuItems = [
    {
      path: '/tasks/not-started',
      name: 'Not Started',
      vietnameseName: 'Chưa bắt đầu',
      color: '#f59e0b',
      status: 'not-started',
      badgeCount: taskByStatus['not-started'] || 0
    },
    {
      path: '/tasks/in-progress',
      name: 'In Progress',
      vietnameseName: 'Đang làm',
      color: '#f59e0b',
      status: 'in-progress',
      badgeCount: taskByStatus['in-progress'] || 0
    },
    {
      path: '/tasks/completed',
      name: 'Completed',
      vietnameseName: 'Đã hoàn thành',
      color: '#f59e0b',
      status: 'completed',
      badgeCount: taskByStatus['completed'] || 0
    },
    {
      path: '/tasks/overdue',
      name: 'Overdue',
      vietnameseName: 'Quá hạn',
      color: '#f59e0b',
      status: 'overdue',
      badgeCount: taskByStatus['overdue'] || 0
    }
  ];

  return (
    <div className="task-sidebar-wrapper">
      {isAdmin() ? (
        // Admin: Kiểm soát task là một link đến trang riêng
        <Link
          to="/admin/task-control"
          className={`nav-link ${isActiveRoute('/admin/task-control') ? 'active' : ''}`}
          style={{ position: 'relative' }}
        >
          {!isCollapsed && 'Kiểm soát task'}
          <Badge
            count={taskNotificationCount}
            color="#f59e0b"
            size="sm"
            rightOffset="2px"
            topOffset="2px"
          />
        </Link>
      ) : (
        // User thường: Tasks của tôi với dropdown
        <>
          <div
            className="task-sidebar-header"
            onClick={() => !isCollapsed && setIsExpanded(!isExpanded)}
            style={{ position: 'relative' }}
          >
            <div className="task-sidebar-title">
              <span>{isCollapsed ? '' : 'Tasks của tôi'}</span>
              <Badge
                count={taskNotificationCount}
                color="#f59e0b"
                size="sm"
                rightOffset="2px"
                topOffset="2px"
              />
            </div>
            {!isCollapsed && (
              <span className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
            )}
          </div>

          {isExpanded && !isCollapsed && (
            <div className="task-submenu">
              {taskMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`task-submenu-item ${isActiveRoute(item.path) ? 'active' : ''}`}
                  style={{ position: 'relative' }}
                >
                  <span className="task-item-name">{item.vietnameseName}</span>
                  <Badge
                    count={item.badgeCount}
                    color={item.color}
                    size="sm"
                    rightOffset="2px"
                    topOffset="2px"
                  />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskSidebar;