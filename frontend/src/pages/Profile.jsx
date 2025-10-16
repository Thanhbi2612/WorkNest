import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Edit2, Save, X, Lock, Key, Eye, EyeOff, Camera, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../services/userService';

const Profile = () => {
  const { user, isAdmin, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Check if user logged in with Google (no password)
  const isGoogleUser = user?.auth_provider === 'google' || user?.google_id;
  const [formData, setFormData] = useState({
    username: user?.username || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || ''
    });
    setIsEditing(false);
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPassword({
      current: false,
      new: false,
      confirm: false
    });
    setIsChangingPassword(false);
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      const response = await userService.updateCurrentUserProfile({
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name
      });

      if (response.success) {
        // Update user in AuthContext
        updateUser(response.data.user);
        toast.success('Cập nhật thông tin thành công!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (isLoading) return;

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setIsLoading(true);

      const response = await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.success) {
        toast.success('Đổi mật khẩu thành công!');
        handleCancelPasswordChange();
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  // Avatar upload handlers
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    handleAvatarUpload(file);
  };

  const handleAvatarUpload = async (file) => {
    try {
      setIsUploadingAvatar(true);

      const response = await userService.uploadAvatar(file);

      if (response.success) {
        // Update user with full user object from backend (includes avatar_url and userType)
        updateUser(response.data.user);
        toast.success('Cập nhật ảnh đại diện thành công!');
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi tải ảnh lên');
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Get avatar URL (with backend base URL)
  const getAvatarUrl = () => {
    const avatar = avatarPreview || user?.avatar_url;
    if (!avatar) return null;

    // If it's a preview (base64), return as is
    if (avatar.startsWith('data:')) return avatar;

    // If it's a URL path, prepend backend URL WITHOUT /api
    // Because static files are served at /uploads, not /api/uploads
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const serverUrl = baseUrl.replace('/api', ''); // Remove /api for static files
    return `${serverUrl}${avatar}`;
  };

  return (
    <div style={{
      padding: '2rem',
      background: 'var(--bg-primary)',
      minHeight: '100vh',
      color: 'var(--text-primary)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '2rem' }}></span>
            Tài khoản của tôi
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '1rem', marginLeft: '2.75rem' }}>
            Xem và chỉnh sửa thông tin cá nhân của bạn
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {/* Profile Card */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            padding: '0',
            border: '1px solid var(--border-primary)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid var(--border-primary)',
              background: 'var(--gradient-primary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={20} color="white" />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      margin: 0
                    }}>
                      Thông tin cá nhân
                    </h2>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      margin: 0
                    }}>
                      Thông tin chi tiết về tài khoản của bạn
                    </p>
                  </div>
                </div>

                {/* Edit/Save/Cancel Buttons */}
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-secondary)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--primary)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <Edit2 size={16} />
                    Chỉnh sửa
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleSave}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Save size={16} />
                      Lưu
                    </button>
                    <button
                      onClick={handleCancel}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-secondary)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <X size={16} />
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar Section */}
            <div style={{
              padding: '2rem',
              borderBottom: '1px solid var(--border-primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              background: 'var(--bg-tertiary)'
            }}>
              {/* Avatar with upload */}
              <div style={{ position: 'relative' }}>
                <div
                  onClick={handleAvatarClick}
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: getAvatarUrl() ? 'transparent' : 'var(--gradient-primary)',
                    backgroundImage: getAvatarUrl() ? `url(${getAvatarUrl()})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                    boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)',
                    border: '4px solid var(--bg-secondary)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    const overlay = e.currentTarget.querySelector('.avatar-overlay');
                    if (overlay) overlay.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    const overlay = e.currentTarget.querySelector('.avatar-overlay');
                    if (overlay) overlay.style.opacity = '0';
                  }}
                >
                  {!getAvatarUrl() && (isAdmin() ? '👨Admin' : 'User')}

                  {/* Upload overlay */}
                  <div
                    className="avatar-overlay"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0, 0, 0, 0.6)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      borderRadius: '50%'
                    }}
                  >
                    <Camera size={32} color="white" />
                    <span style={{
                      color: 'white',
                      fontSize: '0.75rem',
                      marginTop: '0.25rem',
                      fontWeight: '500'
                    }}>
                      {isUploadingAvatar ? 'Đang tải...' : 'Thay đổi'}
                    </span>
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={isUploadingAvatar}
                />
              </div>

              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  margin: '0 0 0.25rem 0'
                }}>
                  {user?.first_name || user?.username || 'User'}
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-tertiary)',
                  margin: 0
                }}>
                  {isAdmin() ? 'Quản trị viên' : 'Người dùng'}
                </p>
              </div>
            </div>

            {/* Information Grid */}
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Username - Editable */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#8b5cf620',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: isEditing ? '0.75rem' : '0'
                  }}>
                    <User size={20} color="#8b5cf6" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-tertiary)',
                      marginBottom: '0.25rem'
                    }}>
                      Tên đăng nhập
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          fontSize: '1rem',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '8px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-primary)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    ) : (
                      <div style={{
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        fontWeight: '500'
                      }}>
                        {user?.username || 'Chưa cập nhật'}
                      </div>
                    )}
                  </div>
                </div>

                {/* First Name - Editable */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#06b6d420',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: isEditing ? '0.75rem' : '0'
                  }}>
                    <User size={20} color="#06b6d4" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-tertiary)',
                      marginBottom: '0.25rem'
                    }}>
                      Họ
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        placeholder="Nhập họ của bạn"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          fontSize: '1rem',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '8px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-primary)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    ) : (
                      <div style={{
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        fontWeight: '500'
                      }}>
                        {user?.first_name || 'Chưa cập nhật'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Last Name - Editable */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#10b98120',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: isEditing ? '0.75rem' : '0'
                  }}>
                    <User size={20} color="#10b981" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-tertiary)',
                      marginBottom: '0.25rem'
                    }}>
                      Tên
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        placeholder="Nhập tên của bạn"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          fontSize: '1rem',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '8px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-primary)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    ) : (
                      <div style={{
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        fontWeight: '500'
                      }}>
                        {user?.last_name || 'Chưa cập nhật'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Email - Read Only */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#3b82f620',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Mail size={20} color="#3b82f6" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-tertiary)',
                      marginBottom: '0.25rem'
                    }}>
                      Email (không thể thay đổi)
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      fontWeight: '500'
                    }}>
                      {user?.email || 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>

                {/* Role - Read Only */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#f59e0b20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Shield size={20} color="#f59e0b" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-tertiary)',
                      marginBottom: '0.25rem'
                    }}>
                      Vai trò (không thể thay đổi)
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      fontWeight: '500'
                    }}>
                      {isAdmin() ? 'Quản trị viên' : 'Người dùng'}
                    </div>
                  </div>
                </div>

                {/* Created Date - Read Only */}
                {user?.created_at && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#ec489920',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Calendar size={20} color="#ec4899" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-tertiary)',
                        marginBottom: '0.25rem'
                      }}>
                        Ngày tạo tài khoản
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        fontWeight: '500'
                      }}>
                        {new Date(user.created_at).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Change Password Card - Only show for non-Google users */}
          {!isGoogleUser && (
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              padding: '0',
              border: '1px solid var(--border-primary)',
              overflow: 'hidden'
            }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid var(--border-primary)',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Lock size={20} color="white" />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: 'white',
                      margin: 0
                    }}>
                      Đổi mật khẩu
                    </h2>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      margin: 0
                    }}>
                      Cập nhật mật khẩu để bảo mật tài khoản
                    </p>
                  </div>
                </div>

                {!isChangingPassword && (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <Key size={16} />
                    Đổi mật khẩu
                  </button>
                )}
              </div>
            </div>

            {/* Password Change Form */}
            {isChangingPassword ? (
              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {/* Current Password */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem'
                    }}>
                      Mật khẩu hiện tại
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword.current ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Nhập mật khẩu hiện tại"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          paddingRight: '3rem',
                          fontSize: '1rem',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '8px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-primary)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-tertiary)',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-tertiary)';
                        }}
                      >
                        {showPassword.current ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem'
                    }}>
                      Mật khẩu mới
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword.new ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          paddingRight: '3rem',
                          fontSize: '1rem',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '8px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-primary)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-tertiary)',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-tertiary)';
                        }}
                      >
                        {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem'
                    }}>
                      Xác nhận mật khẩu mới
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Nhập lại mật khẩu mới"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          paddingRight: '3rem',
                          fontSize: '1rem',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '8px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-primary)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-tertiary)',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-tertiary)';
                        }}
                      >
                        {showPassword.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                      onClick={handleChangePassword}
                      style={{
                        flex: 1,
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Đổi mật khẩu
                    </button>
                    <button
                      onClick={handleCancelPasswordChange}
                      style={{
                        flex: 1,
                        padding: '0.75rem 1.5rem',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-secondary)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--border-secondary)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-tertiary)'
              }}>
                <Lock size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ margin: 0 }}>
                  Nhấn nút "Đổi mật khẩu" để thay đổi mật khẩu của bạn
                </p>
              </div>
            )}
            </div>
          )}

          {/* Info Message */}
          <div style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #1e3a8a20, #1e40af20)',
            border: '1px solid var(--primary)',
            borderRadius: '12px',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>
            <div style={{
              fontSize: '1.5rem',
              flexShrink: 0
            }}>
              💡
            </div>
            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: 'var(--primary)',
                margin: '0 0 0.5rem 0'
              }}>
                Thông tin
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Các thay đổi sẽ được lưu tự động. Để bảo mật tài khoản, vui lòng sử dụng mật khẩu mạnh và không chia sẻ với người khác.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
