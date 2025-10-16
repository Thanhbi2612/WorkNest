import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  infoMessage,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'danger' // 'danger' | 'warning' | 'info'
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <h3 className={`confirm-dialog-title ${variant}`}>
            {variant === 'danger' && '⚠️ '}
            {variant === 'warning' && '⚠️ '}
            {variant === 'info' && 'ℹ️ '}
            {title}
          </h3>
        </div>

        <div className="confirm-dialog-body">
          <p className="confirm-dialog-message">{message}</p>
          {infoMessage && (
            <div className="confirm-dialog-info">
              <span className="info-icon">ℹ️</span>
              <p>{infoMessage}</p>
            </div>
          )}
        </div>

        <div className="confirm-dialog-footer">
          <button
            className="confirm-dialog-btn cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            className={`confirm-dialog-btn confirm ${variant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Đang xử lý...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
