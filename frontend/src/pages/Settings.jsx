import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import Toggle from '../components/common/Toggle';
import { Bell, BellOff, Calendar, CheckCircle2, RefreshCw, FileText, Sun, Moon, Palette, Type } from 'lucide-react';

const Settings = () => {
  const {
    settings,
    toggleNotifications,
    toggleNotificationType,
    setThemeMode,
    setPrimaryColor,
    setFontSize,
    resetSettings
  } = useSettings();

  const { isAdmin } = useAuth();

  const notificationTypes = [
    {
      key: 'task_assigned',
      label: 'Task mới được giao',
      description: 'Nhận thông báo khi bạn được giao task mới',
      icon: FileText,
      color: '#3b82f6'
    },
    {
      key: 'deadline_reminder',
      label: 'Nhắc nhở deadline',
      description: 'Nhận thông báo khi task sắp đến hạn',
      icon: Calendar,
      color: '#ef4444'
    },
    {
      key: 'project_updated',
      label: 'Cập nhật project',
      description: 'Nhận thông báo khi có thay đổi trong project',
      icon: RefreshCw,
      color: '#f59e0b'
    },
    {
      key: 'task_completed',
      label: 'Task hoàn thành',
      description: 'Nhận thông báo khi task được đánh dấu hoàn thành',
      icon: CheckCircle2,
      color: '#10b981'
    }
  ];

  const primaryColors = [
    { key: 'cyan', label: 'Cyan', color: '#06b6d4' },
    { key: 'purple', label: 'Purple', color: '#8b5cf6' },
    { key: 'blue', label: 'Blue', color: '#3b82f6' },
    { key: 'green', label: 'Green', color: '#10b981' },
    { key: 'red', label: 'Red', color: '#ef4444' }
  ];

  return (
    <div style={{
      padding: '2rem',
      background: 'var(--bg-primary)',
      minHeight: '100vh',
      color: 'var(--text-primary)'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
            Cài đặt
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '1rem', marginLeft: '2.75rem' }}>
            Tùy chỉnh và cấu hình ứng dụng theo nhu cầu của bạn
          </p>
        </div>

        {/* Notification Settings Section - Hidden for Admin */}
        {!isAdmin() && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          padding: '0',
          border: '1px solid var(--border-primary)',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}>
          {/* Section Header */}
          <div style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid var(--border-primary)',
            background: 'var(--bg-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: settings.notifications.enabled
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #374151, #4b5563)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}>
                {settings.notifications.enabled ? (
                  <Bell size={20} color="white" />
                ) : (
                  <BellOff size={20} color="var(--text-secondary)" />
                )}
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  Thông báo
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  margin: 0
                }}>
                  Quản lý các loại thông báo trong ứng dụng
                </p>
              </div>
            </div>
          </div>

          {/* Master Toggle */}
          <div style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid var(--border-primary)',
            background: settings.notifications.enabled ? 'var(--bg-secondary)' : 'var(--bg-tertiary)'
          }}>
            <Toggle
              checked={settings.notifications.enabled}
              onCheckedChange={toggleNotifications}
              label="Bật thông báo trong ứng dụng"
              description="Bật/tắt tất cả thông báo trong ứng dụng"
              size="default"
            />
          </div>

          {/* Individual Notification Types */}
          <div style={{
            padding: '0.5rem 0',
            opacity: settings.notifications.enabled ? 1 : 0.5,
            pointerEvents: settings.notifications.enabled ? 'auto' : 'none',
            transition: 'opacity 0.3s ease'
          }}>
            {notificationTypes.map((type, index) => {
              const Icon = type.icon;
              const isEnabled = settings.notifications.types[type.key];

              return (
                <div
                  key={type.key}
                  style={{
                    padding: '1.25rem 2rem',
                    borderBottom: index < notificationTypes.length - 1 ? '1px solid var(--border-primary)' : 'none',
                    transition: 'background-color 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Icon */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: isEnabled ? `${type.color}20` : 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      flexShrink: 0
                    }}>
                      <Icon
                        size={18}
                        color={isEnabled ? type.color : 'var(--text-tertiary)'}
                        style={{ transition: 'color 0.3s ease' }}
                      />
                    </div>

                    {/* Toggle */}
                    <Toggle
                      checked={isEnabled}
                      onCheckedChange={(checked) => toggleNotificationType(type.key, checked)}
                      label={type.label}
                      description={type.description}
                      disabled={!settings.notifications.enabled}
                      size="default"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Appearance Settings Section */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          padding: '0',
          border: '1px solid var(--border-primary)',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}>
          {/* Section Header */}
          <div style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid var(--border-primary)',
            background: 'var(--gradient-primary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Palette size={20} color="white" />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  Giao diện
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  margin: 0
                }}>
                  Tùy chỉnh theme và màu sắc ứng dụng
                </p>
              </div>
            </div>
          </div>

          {/* Theme Mode */}
          <div style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid var(--border-primary)'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                {settings.appearance.mode === 'dark' ? (
                  <Moon size={20} color="#8b5cf6" />
                ) : (
                  <Sun size={20} color="#f59e0b" />
                )}
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  Chế độ hiển thị
                </h3>
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: 0,
                marginLeft: '2rem'
              }}>
                Chọn chế độ sáng hoặc tối
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setThemeMode('light')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: settings.appearance.mode === 'light'
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'var(--bg-tertiary)',
                  border: settings.appearance.mode === 'light'
                    ? '2px solid #f59e0b'
                    : '2px solid var(--border-secondary)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (settings.appearance.mode !== 'light') {
                    e.currentTarget.style.background = 'var(--border-secondary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (settings.appearance.mode !== 'light') {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <Sun size={24} color={settings.appearance.mode === 'light' ? 'white' : 'var(--text-secondary)'} />
                <span style={{
                  color: settings.appearance.mode === 'light' ? 'white' : 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Sáng
                </span>
              </button>

              <button
                onClick={() => setThemeMode('dark')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: settings.appearance.mode === 'dark'
                    ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                    : 'var(--bg-tertiary)',
                  border: settings.appearance.mode === 'dark'
                    ? '2px solid #8b5cf6'
                    : '2px solid var(--border-secondary)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (settings.appearance.mode !== 'dark') {
                    e.currentTarget.style.background = 'var(--border-secondary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (settings.appearance.mode !== 'dark') {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <Moon size={24} color={settings.appearance.mode === 'dark' ? 'white' : 'var(--text-secondary)'} />
                <span style={{
                  color: settings.appearance.mode === 'dark' ? 'white' : 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Tối
                </span>
              </button>
            </div>
          </div>

          {/* Primary Color */}
          <div style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid var(--border-primary)'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Palette size={20} color="#8b5cf6" />
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  Màu chủ đạo
                </h3>
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: 0,
                marginLeft: '2rem'
              }}>
                Chọn màu chủ đạo cho buttons, links và highlights
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {primaryColors.map(color => (
                <button
                  key={color.key}
                  onClick={() => setPrimaryColor(color.key)}
                  style={{
                    width: '80px',
                    height: '80px',
                    background: settings.appearance.primaryColor === color.key
                      ? `linear-gradient(135deg, ${color.color}, ${color.color}dd)`
                      : color.color,
                    border: settings.appearance.primaryColor === color.key
                      ? `3px solid ${color.color}`
                      : '3px solid transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    boxShadow: settings.appearance.primaryColor === color.key
                      ? `0 4px 16px ${color.color}60`
                      : '0 2px 8px rgba(0, 0, 0, 0.3)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                    e.currentTarget.style.boxShadow = `0 8px 24px ${color.color}80`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = settings.appearance.primaryColor === color.key
                      ? `0 4px 16px ${color.color}60`
                      : '0 2px 8px rgba(0, 0, 0, 0.3)';
                  }}
                >
                  {settings.appearance.primaryColor === color.key && (
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '20px',
                      height: '20px',
                      background: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}>
                      ✓
                    </div>
                  )}
                  <span style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}>
                    {color.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div style={{
            padding: '1.5rem 2rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Type size={20} color="#10b981" />
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  Cỡ chữ
                </h3>
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: 0,
                marginLeft: '2rem'
              }}>
                Điều chỉnh kích thước chữ cho dễ đọc hơn
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setFontSize('normal')}
                style={{
                  flex: 1,
                  padding: '1rem 1.5rem',
                  background: settings.appearance.fontSize === 'normal'
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'var(--bg-tertiary)',
                  border: settings.appearance.fontSize === 'normal'
                    ? '2px solid #10b981'
                    : '2px solid var(--border-secondary)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (settings.appearance.fontSize !== 'normal') {
                    e.currentTarget.style.background = 'var(--border-secondary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (settings.appearance.fontSize !== 'normal') {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span style={{
                  color: settings.appearance.fontSize === 'normal' ? 'white' : 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Bình thường (16px)
                </span>
              </button>

              <button
                onClick={() => setFontSize('large')}
                style={{
                  flex: 1,
                  padding: '1rem 1.5rem',
                  background: settings.appearance.fontSize === 'large'
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'var(--bg-tertiary)',
                  border: settings.appearance.fontSize === 'large'
                    ? '2px solid #10b981'
                    : '2px solid var(--border-secondary)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (settings.appearance.fontSize !== 'large') {
                    e.currentTarget.style.background = 'var(--border-secondary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (settings.appearance.fontSize !== 'large') {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span style={{
                  color: settings.appearance.fontSize === 'large' ? 'white' : 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '1.05rem'
                }}>
                  Lớn (18px)
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={resetSettings}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-secondary)',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--border-secondary)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--bg-tertiary)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <RefreshCw size={16} />
            Khôi phục mặc định
          </button>
        </div>

        {/* Info Card */}
        <div style={{
          marginTop: '2rem',
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #1e3a8a20, #1e40af20)',
          border: '1px solid var(--primary)',
          borderRadius: '12px',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
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
              Các tùy chọn này chỉ ảnh hưởng đến thông báo trong ứng dụng.
              Thay đổi sẽ được lưu tự động và áp dụng ngay lập tức.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
