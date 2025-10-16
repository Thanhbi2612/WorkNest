import React, { useState } from 'react';
import ConfirmDialog from '../ConfirmDialog';
import './EventDetailPopup.css';

const EventDetailPopup = ({ event, onClose, onEdit, onDelete }) => {
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    if (!event) return null;

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isAllDayEvent = () => {
        if (!event.start || !event.end) return true;
        const start = new Date(event.start);
        const end = new Date(event.end);

        // Check if times are both midnight or if end - start >= 24h
        return (start.getHours() === 0 && start.getMinutes() === 0 &&
                end.getHours() === 0 && end.getMinutes() === 0);
    };

    const handleDeleteClick = () => {
        setShowConfirmDelete(true);
    };

    const handleConfirmDelete = () => {
        onDelete(event);
        setShowConfirmDelete(false);
    };

    const handleCancelDelete = () => {
        setShowConfirmDelete(false);
    };

    return (
        <div className="event-detail-overlay" onClick={onClose}>
            <div className="event-detail-popup" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="event-detail-header">
                    <div className="header-content">
                        <h3 className="event-title">{event.title}</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="event-detail-body">
                    {/* Date & Time Info */}
                    <div className="info-section">
                        <div className="info-item">
                            <div className="info-content">
                                <span className="info-label">Ngày</span>
                                <span className="info-value">{formatDate(event.start)}</span>
                            </div>
                        </div>

                        {!isAllDayEvent() && (
                            <div className="info-item">
                                <div className="info-content">
                                    <span className="info-label">Thời gian</span>
                                    <span className="info-value">
                                        {formatTime(event.start)}
                                        {event.end && ` - ${formatTime(event.end)}`}
                                    </span>
                                </div>
                            </div>
                        )}

                        {isAllDayEvent() && (
                            <div className="info-item">
                                <div className="info-content">
                                    <span className="info-label">Loại sự kiện</span>
                                    <span className="info-value all-day-badge">Cả ngày</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {event.extendedProps?.description && (
                        <div className="info-section">
                            <div className="description-container">  
                                <div className="info-content">
                                    <span className="info-label">Mô tả</span>
                                    <p className="description-text">
                                        {event.extendedProps.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Created Time */}
                    {event.extendedProps?.created_at && (
                        <div className="meta-info">
                            <span className="meta-text">
                                Tạo lúc: {formatDateTime(event.extendedProps.created_at)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="event-detail-footer">
                    <button className="btn-delete" onClick={handleDeleteClick}>
                        Xóa sự kiện
                    </button>
                    <button className="btn-edit" onClick={() => onEdit(event)}>
                        Chỉnh sửa
                    </button>
                </div>
            </div>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={showConfirmDelete}
                title="Xác nhận xóa sự kiện"
                message={`Bạn có chắc chắn muốn xóa sự kiện "${event.title}" không?`}
                infoMessage="Hành động này không thể hoàn tác!"
                confirmText="Xóa sự kiện"
                cancelText="Hủy"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                variant="danger"
            />
        </div>
    );
};

export default EventDetailPopup;
