// ================================================
// USER LIST SIDEBAR
// Sidebar bên phải hiển thị danh sách users và trạng thái
// ================================================

import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import './UserListSidebar.css';

const UserListSidebar = ({ isOpen, onClose, onUserClick, onlineUsers, setOnlineUsers }) => {
    const { socket, isConnected } = useSocket();
    const [users, setUsers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch danh sách users và admins
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);

                // Fetch users
                const userResponse = await fetch('http://localhost:3000/api/users/dropdown', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                const userData = await userResponse.json();

                if (userData.success) {
                    setUsers(userData.data.users || []);
                }

                // Fetch admins (dùng endpoint dropdown - tất cả authenticated users đều access được)
                const adminResponse = await fetch('http://localhost:3000/api/admin/dropdown', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                const adminData = await adminResponse.json();

                if (adminData.success) {
                    setAdmins(adminData.data.admins || []);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    // Listen for online users updates từ socket
    useEffect(() => {
        if (!socket || !isConnected) return;

        // Request online users khi component mount
        socket.emit('get_online_users', {}, (response) => {
            if (response.success) {
                setOnlineUsers(response.onlineUsers || []);
            }
        });

        // Listen for online users updates
        const handleOnlineUsersUpdate = (data) => {
            setOnlineUsers(data.onlineUsers || []);
        };

        socket.on('online_users_update', handleOnlineUsersUpdate);

        // Refresh online users mỗi 30s
        const interval = setInterval(() => {
            socket.emit('get_online_users', {}, (response) => {
                if (response.success) {
                    setOnlineUsers(response.onlineUsers || []);
                }
            });
        }, 30000);

        return () => {
            socket.off('online_users_update', handleOnlineUsersUpdate);
            clearInterval(interval);
        };
    }, [socket, isConnected]);

    // Check if user is online
    const isUserOnline = (userId, userType) => {
        return onlineUsers.some(u => u.userId === userId && u.userType === userType);
    };

    // Combine và sort users theo trạng thái
    const allUsers = [
        ...admins.map(admin => ({ ...admin, userType: 'admin', displayName: admin.username })),
        ...users.map(user => ({ ...user, userType: 'user', displayName: user.first_name || user.username }))
    ].sort((a, b) => {
        const aOnline = isUserOnline(a.id, a.userType);
        const bOnline = isUserOnline(b.id, b.userType);

        // Online users first
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;

        // Then sort by name
        return a.displayName.localeCompare(b.displayName);
    });

    return (
        <>
            {/* Overlay khi sidebar mở trên mobile */}
            {isOpen && (
                <div className="user-sidebar-overlay" onClick={onClose}></div>
            )}

            {/* Sidebar */}
            <div className={`user-list-sidebar ${isOpen ? 'open' : ''}`}>
                {/* Header */}
                <div className="user-sidebar-header">
                    <h3>Người dùng</h3>
                    <button className="close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="user-sidebar-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Đang tải...</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats */}
                            <div className="user-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Tổng số:</span>
                                    <span className="stat-value">{allUsers.length}</span>
                                </div>
                            </div>
                            <h4>Chọn người muốn trò chuyện</h4>
                            {/* User List */}
                            <div className="user-list">
                                {allUsers.length === 0 ? (
                                    <div className="empty-state">
                                        <p>Không có người dùng</p>
                                    </div>
                                ) : (
                                    allUsers.map(user => {
                                        const online = isUserOnline(user.id, user.userType);
                                        const initials = user.displayName.substring(0, 2).toUpperCase();

                                        // Get avatar URL
                                        const getAvatarUrl = (avatarUrl) => {
                                            if (!avatarUrl) return null;
                                            if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl;
                                            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                                            const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
                                            return `${baseUrl}${avatarUrl}`;
                                        };
                                        const avatarUrl = getAvatarUrl(user.avatar_url);

                                        return (
                                            <div
                                                key={`${user.userType}-${user.id}`}
                                                className="user-item"
                                                onClick={() => {
                                                    if (onUserClick) {
                                                        onUserClick(user);
                                                    }
                                                }}
                                            >
                                                <div className="user-avatar-wrapper">
                                                    <div className={`user-avatar ${user.userType}`} style={{
                                                        backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center'
                                                    }}>
                                                        {!avatarUrl && initials}
                                                    </div>
                                                    <div className={`status-indicator ${online ? 'online' : 'offline'}`}></div>
                                                </div>

                                                <div className="user-info">
                                                    <div className="user-name">
                                                        {user.displayName}
                                                        {user.userType === 'admin' && (
                                                            <span className="admin-badge">Admin</span>
                                                        )}
                                                    </div>
                                                    <div className="user-status">
                                                        {online ? (
                                                            <span className="status-text online">Đang hoạt động</span>
                                                        ) : (
                                                            <span className="status-text offline">Ngoại tuyến</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default UserListSidebar;
