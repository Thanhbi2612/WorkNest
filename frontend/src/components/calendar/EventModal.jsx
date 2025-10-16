import React, { useState, useEffect } from 'react';
import './EventModal.css';

const EventModal = ({ isOpen, onClose, onSave, event, selectedDate }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        isAllDay: false
    });

    const [errors, setErrors] = useState({});

    // Initialize form when modal opens or event changes
    useEffect(() => {
        if (isOpen) {
            if (event) {
                // Edit mode - fill with event data
                const start = new Date(event.start);
                const end = event.end ? new Date(event.end) : new Date(event.start);

                setFormData({
                    title: event.title || '',
                    description: event.extendedProps?.description || '',
                    startDate: formatDateForInput(start),
                    startTime: formatTimeForInput(start),
                    endDate: formatDateForInput(end),
                    endTime: formatTimeForInput(end),
                    isAllDay: isAllDayEvent(start, end)
                });
            } else if (selectedDate) {
                // Create mode - use selected date
                const date = new Date(selectedDate.startStr);
                const endDate = selectedDate.endStr ? new Date(selectedDate.endStr) : new Date(date);

                setFormData({
                    title: '',
                    description: '',
                    startDate: formatDateForInput(date),
                    startTime: '09:00',
                    endDate: formatDateForInput(endDate),
                    endTime: '10:00',
                    isAllDay: false
                });
            }
            setErrors({});
        }
    }, [isOpen, event, selectedDate]);

    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatTimeForInput = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const isAllDayEvent = (start, end) => {
        return (start.getHours() === 0 && start.getMinutes() === 0 &&
                end.getHours() === 0 && end.getMinutes() === 0);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Vui lòng nhập tiêu đề';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
        }

        if (!formData.isAllDay && !formData.startTime) {
            newErrors.startTime = 'Vui lòng chọn giờ bắt đầu';
        }

        // Check if end date/time is after start
        if (formData.startDate && formData.endDate) {
            const startDateTime = new Date(`${formData.startDate}T${formData.startTime || '00:00'}`);
            const endDateTime = new Date(`${formData.endDate}T${formData.endTime || '23:59'}`);

            if (endDateTime <= startDateTime) {
                newErrors.endDate = 'Thời gian kết thúc phải sau thời gian bắt đầu';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        // Prepare data
        const startDateTime = formData.isAllDay
            ? `${formData.startDate}T00:00:00`
            : `${formData.startDate}T${formData.startTime}:00`;

        const endDateTime = formData.endDate
            ? (formData.isAllDay
                ? `${formData.endDate}T23:59:59`
                : `${formData.endDate}T${formData.endTime || formData.startTime}:00`)
            : null;

        const eventData = {
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            start_date: startDateTime,
            end_date: endDateTime
        };

        onSave(eventData, event);
    };

    if (!isOpen) return null;

    return (
        <div className="event-modal-overlay" onClick={onClose}>
            <div className="event-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="event-modal-header">
                    <h3>{event ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}</h3>
                    <button className="modal-close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="event-modal-body">
                    {/* Title */}
                    <div className="form-group">
                        <label htmlFor="title" className="form-label">
                            Tiêu đề <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Nhập tiêu đề sự kiện..."
                            className={`form-input ${errors.title ? 'error' : ''}`}
                            autoFocus
                        />
                        {errors.title && <span className="error-message">{errors.title}</span>}
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label htmlFor="description" className="form-label">
                            Mô tả
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Nhập mô tả chi tiết (tùy chọn)..."
                            className="form-textarea"
                            rows="3"
                        />
                    </div>

                    {/* All Day Checkbox */}
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="isAllDay"
                                checked={formData.isAllDay}
                                onChange={handleChange}
                                className="form-checkbox"
                            />
                            <span className="checkbox-text">Sự kiện cả ngày</span>
                        </label>
                    </div>

                    {/* Date & Time Row */}
                    <div className="form-row">
                        {/* Start Date & Time */}
                        <div className="form-group flex-1">
                            <label htmlFor="startDate" className="form-label">
                                Ngày bắt đầu <span className="required">*</span>
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className={`form-input ${errors.startDate ? 'error' : ''}`}
                            />
                            {errors.startDate && <span className="error-message">{errors.startDate}</span>}

                            {!formData.isAllDay && (
                                <>
                                    <label htmlFor="startTime" className="form-label" style={{ marginTop: '12px' }}>

                                        Giờ bắt đầu <span className="required">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        id="startTime"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleChange}
                                        className={`form-input ${errors.startTime ? 'error' : ''}`}
                                    />
                                    {errors.startTime && <span className="error-message">{errors.startTime}</span>}
                                </>
                            )}
                        </div>

                        {/* End Date & Time */}
                        <div className="form-group flex-1">
                            <label htmlFor="endDate" className="form-label">

                                Ngày kết thúc
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className={`form-input ${errors.endDate ? 'error' : ''}`}
                            />
                            {errors.endDate && <span className="error-message">{errors.endDate}</span>}

                            {!formData.isAllDay && (
                                <>
                                    <label htmlFor="endTime" className="form-label" style={{ marginTop: '12px' }}>

                                        Giờ kết thúc
                                    </label>
                                    <input
                                        type="time"
                                        id="endTime"
                                        name="endTime"
                                        value={formData.endTime}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="event-modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Hủy
                        </button>
                        <button type="submit" className="btn-save">
                            {event ? 'Cập nhật' : 'Tạo sự kiện'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
