import  { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { userService } from '../services/userService';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers(currentPage, 20, searchTerm);
      if (response.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.total_pages);
        setTotalUsers(response.data.pagination.total_users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await userService.toggleUserStatus(userId);
      if (response.success) {
        toast.success(`${currentStatus ? 'Vô hiệu hóa' : 'Kích hoạt'} tài khoản thành công!`);
        loadUsers();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(error.message || 'Không thể thay đổi trạng thái tài khoản');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const openResetPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setGeneratedPassword('');
    setShowPassword(false);
    setShowResetPasswordModal(true);
  };

  const closeResetPasswordModal = () => {
    setShowResetPasswordModal(false);
    setSelectedUser(null);
    setNewPassword('');
    setGeneratedPassword('');
    setShowPassword(false);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      const response = await userService.resetUserPassword(selectedUser.id, newPassword);
      if (response.success) {
        setGeneratedPassword(response.data.newPassword);
        toast.success('Đặt lại mật khẩu thành công!');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Không thể đặt lại mật khẩu');
    }
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast.success('Đã sao chép mật khẩu!');
  };

  return (
    <div className="user-management-page">
      <div className="user-management-header">
        <div>
          <h1>Quản lý Tài khoản</h1>
          <p>Quản lý tất cả tài khoản người dùng trong hệ thống</p>
        </div>
      </div>

      <div className="user-management-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        <div className="user-stats">
          <span className="total-users">Tổng số: <strong>{totalUsers}</strong> tài khoản</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách tài khoản...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <h3>Không tìm thấy tài khoản nào</h3>
          <p>Thử thay đổi từ khóa tìm kiếm</p>
        </div>
      ) : (
        <>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên người dùng</th>
                  <th>Email</th>
                  <th>Họ tên</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Hoạt động' : 'Vô hiệu'}
                      </span>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-reset-password"
                          onClick={() => openResetPasswordModal(user)}
                          title="Đặt lại mật khẩu"
                        >
                          Đặt lại MK
                        </button>
                        <button
                          className={`btn-toggle ${user.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                          title={user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        >
                          {user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                ← Trước
              </button>
              <span className="pagination-info">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="modal-overlay" onClick={closeResetPasswordModal}>
          <div className="modal-content reset-password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Đặt lại mật khẩu</h2>
              <button className="modal-close-btn" onClick={closeResetPasswordModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="user-info-box">
                <p><strong>Tài khoản:</strong> {selectedUser?.username}</p>
                <p><strong>Email:</strong> {selectedUser?.email}</p>
              </div>

              {!generatedPassword ? (
                <>
                  <div className="form-group">
                    <label>Mật khẩu mới</label>
                    <div className="password-input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                        className="form-input"
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button className="btn-generate" onClick={generateRandomPassword}>
                      Tạo mật khẩu ngẫu nhiên
                    </button>
                    <button className="btn-primary" onClick={handleResetPassword}>
                      Đặt lại mật khẩu
                    </button>
                    <button className="btn-cancel" onClick={closeResetPasswordModal}>
                      Hủy
                    </button>
                  </div>
                </>
              ) : (
                <div className="password-success-box">
                  <p className="success-message">Mật khẩu đã được đặt lại thành công!</p>
                  <div className="generated-password-display">
                    <label>Mật khẩu mới:</label>
                    <div className="password-display-box">
                      <code>{generatedPassword}</code>
                      <button className="btn-copy" onClick={copyPasswordToClipboard}>
                        Sao chép
                      </button>
                    </div>
                  </div>
                  <p className="warning-text"> Hãy lưu mật khẩu này và gửi cho người dùng. Bạn sẽ không thể xem lại mật khẩu này sau khi đóng hộp thoại</p>
                  <button className="btn-primary" onClick={closeResetPasswordModal}>
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
