import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { taskService } from '../../services/taskService';
import ConfirmDialog from '../ConfirmDialog';
import './TaskCard.css';

const TaskCard = ({ task, onTaskUpdate, onTaskDelete, showActions = true, isCompleted = false, openTaskId }) => {
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const isConfirmed = task.is_confirmed === true;

    // Auto-open task detail if this task matches openTaskId
    useEffect(() => {
        if (openTaskId && task.id === openTaskId) {
            setShowDetails(true);

            // Scroll to this task card
            setTimeout(() => {
                const element = document.getElementById(`task-card-${task.id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);

            // Clear navigation state after opening
            window.history.replaceState({}, document.title);
        }
    }, [openTaskId, task.id]);

    const handleStatusChange = async (newStatus) => {
        if (loading) return;

        setLoading(true);
        try {
            const response = await taskService.updateTaskStatus(task.id, newStatus);
            if (response.success && onTaskUpdate) {
                onTaskUpdate(response.data.task);

                // Hiển thị thông báo yêu cầu viết báo cáo khi hoàn thành task
                if (newStatus === 'completed') {
                    toast.success('Task đã hoàn thành! Vui lòng viết báo cáo của task trong mục "Đã hoàn thành".', {
                        duration: 5000,
                        icon: '✅',
                        style: {
                            minWidth: '350px',
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error updating task status:', error);
            toast.error('Có lỗi xảy ra khi cập nhật trạng thái task');
        } finally {
            setLoading(false);
        }
    };

    const handleFileDownload = async (fileId, fileName) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/tasks/${task.id}/files/${fileId}/download`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Tải file thành công');
        } catch (error) {
            console.error('Error downloading file:', error);
            toast.error('Không thể tải file');
        }
    };

    const handleDelete = () => {
        if (loading) return;
        setShowConfirmDelete(true);
    };

    const handleConfirmDelete = async () => {
        setLoading(true);
        try {
            if (onTaskDelete) {
                await onTaskDelete(task.id);
            }
            setShowConfirmDelete(false);
        } catch (error) {
            console.error('Error deleting task:', error);
            setShowConfirmDelete(false);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelDelete = () => {
        setShowConfirmDelete(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: '#10b981',
            medium: '#3b82f6',
            high: '#f59e0b',
            urgent: '#ef4444'
        };
        return colors[priority] || '#6b7280';
    };

    const getStatusColor = (status) => {
        const colors = {
            not_started: '#6b7280',
            in_progress: '#3b82f6',
            completed: '#10b981',
            cancelled: '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    const getPriorityLabel = (priority) => {
        const labels = {
            low: 'Thấp',
            medium: 'Trung bình',
            high: 'Cao',
            urgent: 'Khẩn cấp '
        };
        return labels[priority] || priority;
    };

    const getStatusLabel = (status) => {
        const labels = {
            not_started: 'Chưa bắt đầu',
            in_progress: 'Đang thực hiện',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy'
        };
        return labels[status] || status;
    };

    const isOverdue = () => {
        if (task.status === 'completed') return false;
        const today = new Date().toISOString().split('T')[0];
        return task.due_date < today;
    };

    const getNextStatus = () => {
        switch (task.status) {
            case 'not_started':
                return 'in_progress';
            case 'in_progress':
                return 'completed';
            default:
                return null;
        }
    };

    const getStatusButtonText = () => {
        switch (task.status) {
            case 'not_started':
                return 'Bắt đầu';
            case 'in_progress':
                return 'Hoàn thành';
            default:
                return null;
        }
    };

    return (
        <div
            id={`task-card-${task.id}`}
            className={`task-card ${isOverdue() ? 'overdue' : ''} ${isConfirmed ? 'task-confirmed' : ''}`}
        >
            <div className="task-card-header">
                <div className="task-badges">
                    <span
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                        {getPriorityLabel(task.priority)}
                    </span>
                    <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(task.status) }}
                    >
                        {getStatusLabel(task.status)}
                    </span>
                </div>
            </div>

            <div className="task-title-section">
                <span className="task-label">Tên:</span>
                <h3 className="task-title">{task.title}</h3>
                {task.project_name && (
                    <span className="project-badge">Thuộc dự án: {task.project_name}</span>
                )}
            </div>

            {task.description && (
                <div className="task-description">
                    <span className="task-label">Chi tiết:</span>
                    <p>{task.description}</p>
                </div>
            )}

            <div className="task-details">
                <div className="task-dates">
                    <div className="date-item">
                        <span className="date-label">Bắt đầu:</span>
                        <span className="date-value">{formatDate(task.start_date)}</span>
                    </div>
                    <div className="date-item">
                        <span className="date-label">Deadline:</span>
                        <span className={`date-value ${isOverdue() ? 'overdue-date' : ''}`}>
                            {formatDate(task.due_date)}
                            {isOverdue() && ' (Quá hạn)'}
                        </span>
                    </div>
                </div>

                {task.creator_first_name && (
                    <div className="task-creator">
                        <span className="creator-label">Người tạo:</span>
                        <span className="creator-name">
                            {task.creator_first_name} {task.creator_last_name}
                        </span>
                    </div>
                )}

                {(() => {
                    // Convert files to array if it's an object
                    const filesArray = Array.isArray(task.files)
                        ? task.files
                        : (task.files && typeof task.files === 'object' && task.files.length !== undefined)
                            ? Array.from(task.files)
                            : [];

                    return filesArray.length > 0 && (
                        <div className="task-files">
                            <div className="files-label"> Tệp đính kèm ({filesArray.length}):</div>
                            <div className="files-list">
                                {filesArray.map((file) => (
                                    <button
                                        key={file.id}
                                        onClick={() => handleFileDownload(file.id, file.file_name)}
                                        className="file-download-link"
                                    >
                                        <span className="file-icon">📄</span>
                                        <span className="file-name">{file.file_name}</span>
                                        <span className="file-size">
                                            ({(file.file_size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Confirmed Task Banner */}
            {isConfirmed && (
                <div className="confirmed-banner">
                    <div className="confirmed-message">
                        <span className="confirmed-text">Task đã được xác nhận hoàn thành</span>
                    </div>
                    <button
                        className="delete-confirmed-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                        }}
                        disabled={loading}
                    >
                         Xóa
                    </button>
                </div>
            )}

            {showActions && !isConfirmed && (
                <div className="task-actions">
                    <button
                        className="details-toggle-btn"
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        {showDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                    </button>
                    {getNextStatus() && (
                        <button
                            className="status-action-btn"
                            onClick={() => handleStatusChange(getNextStatus())}
                            disabled={loading}
                        >
                            {loading ? 'Đang cập nhật...' : getStatusButtonText()}
                        </button>
                    )}
                    {isCompleted && (
                        <button
                            className="delete-btn"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            {loading ? 'Đang xóa...' : 'Xóa'}
                        </button>
                    )}
                </div>
            )}

            {showDetails && (
                <div className="task-extended-details">
                    <div className="detail-row">
                        <span className="detail-label">ID Task:</span>
                        <span className="detail-value">#{task.id}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Ngày tạo:</span>
                        <span className="detail-value">{formatDate(task.created_at)}</span>
                    </div>
                    {task.watcher_first_name && (
                        <div className="detail-row">
                            <span className="detail-label">Người theo dõi:</span>
                            <span className="detail-value">
                                {task.watcher_first_name} {task.watcher_last_name}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={showConfirmDelete}
                title="Xác nhận xóa task"
                message={`Bạn có chắc chắn muốn xóa task "${task.title}" không?`}
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                loading={loading}
                variant="danger"
            />
        </div>
    );
};

export default TaskCard;