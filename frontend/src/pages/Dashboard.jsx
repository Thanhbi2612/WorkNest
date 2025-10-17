import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';
import TaskStatusPieChart from '../components/tasks/TaskStatusPieChart';
import TaskCompletionRadialChart from '../components/tasks/TaskCompletionRadialChart';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch dashboard stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                let response;

                if (isAdmin()) {
                    response = await dashboardService.getAdminDashboardStats();
                } else {
                    response = await dashboardService.getUserDashboardStats();
                }

                if (response.success) {
                    setStats(response.data.stats);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [isAdmin]);

    // Quick Task Overview Component (Only for non-admin users)
    const TaskOverviewSection = () => {
        const taskStats = [
            {
                type: 'not-started',
                label: 'Chưa bắt đầu',
                color: '#6b7280',
                path: '/tasks/not-started',
                count: stats?.tasks?.not_started || 0
            },
            {
                type: 'in-progress',
                label: 'Đang làm',
                color: '#3b82f6',
                path: '/tasks/in-progress',

                count: stats?.tasks?.in_progress || 0
            },
            {
                type: 'overdue',
                label: 'Quá hạn',
                color: '#f59e0b',
                path: '/tasks/overdue',

                count: stats?.tasks?.overdue || 0
            },
            {
                type: 'completed',
                label: 'Hoàn thành',
                color: '#10b981',
                path: '/tasks/completed',

                
                count: stats?.tasks?.completed || 0
            },
        ];

        return (
            <div className="task-overview-section">
                <div className="section-header">
                    <h2>Tổng quan nhiệm vụ</h2>
                </div>

                <div className="task-stats-grid">
                    {taskStats.map(stat => (
                        <div
                            key={stat.type}
                            className="task-stat-card"
                            onClick={() => navigate(stat.path)}
                            style={{ borderColor: stat.color }}
                        >
                            <div className="stat-content">
                                <div className="stat-count" style={{ color: stat.color }}>
                                    {stat.count}
                                </div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-content">
            {/* Welcome Section */}
            <div className="welcome-section">
                <h1>Chào mừng trở lại, {user?.first_name || user?.username}!</h1>
                <p>Đây là tổng quan về hoạt động của bạn hôm nay</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {loading ? (
                    <>
                        <div className="stat-card loading">
                            <div className="stat-content">
                                <h3>Đang tải...</h3>
                                <p className="stat-number">-</p>
                            </div>
                        </div>
                        <div className="stat-card loading">
                            <div className="stat-content">
                                <h3>Đang tải...</h3>
                                <p className="stat-number">-</p>
                            </div>
                        </div>
                        <div className="stat-card loading">
                            <div className="stat-content">
                                <h3>Đang tải...</h3>
                                <p className="stat-number">-</p>
                            </div>
                        </div>
                        {isAdmin() && (
                            <div className="stat-card loading">
                                <div className="stat-content">
                                    <h3>Đang tải...</h3>
                                    <p className="stat-number">-</p>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="stat-card">
                            <div className="stat-content">
                                <h3>Tổng Tasks</h3>
                                <p className="stat-number">{stats?.tasks?.total || 0}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-content">
                                <h3>Đã hoàn thành</h3>
                                <p className="stat-number">{stats?.tasks?.completed || 0}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-content">
                                <h3>Đang thực hiện</h3>
                                <p className="stat-number">{stats?.tasks?.in_progress || 0}</p>
                            </div>
                        </div>
                        {isAdmin() && (
                            <div className="stat-card">
                                <div className="stat-content">
                                    <h3>Tổng Users</h3>
                                    <p className="stat-number">{stats?.users?.total || 0}</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Charts Section - Only show for admin */}
            {isAdmin() && (
                <div className="charts-section">
                    <TaskStatusPieChart taskStats={stats?.tasks} />
                    <TaskCompletionRadialChart taskStats={stats?.tasks} />
                </div>
            )}

            {/* Task Overview Section - Only show for non-admin users */}
            {!isAdmin() && <TaskOverviewSection />}
        </div>
    );
};

export default Dashboard;