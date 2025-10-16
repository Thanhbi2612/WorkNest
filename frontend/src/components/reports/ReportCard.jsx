import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSettings } from '../../context/SettingsContext';
import { taskReportService } from '../../services/taskReportService';
import ConfirmDialog from '../ConfirmDialog';
import './ReportCard.css';

const ReportCard = ({ report, showUser = false, isAdmin = false, onReportUpdate }) => {
    const { isDarkMode } = useSettings();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

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

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleDownload = () => {
        if (report.file_url) {
            const downloadUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${report.file_url}`;
            window.open(downloadUrl, '_blank');
        }
    };

    const handleMarkResolved = async () => {
        if (!isAdmin) return;

        try {
            setIsProcessing(true);
            await taskReportService.markAsResolved(report.id);
            toast.success('Đã đánh dấu báo cáo hoàn thành');
            if (onReportUpdate) {
                onReportUpdate();
            }
        } catch (error) {
            console.error('Error marking report as resolved:', error);
            toast.error(error.message || 'Không thể đánh dấu báo cáo');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = () => {
        if (!isAdmin || !report.is_resolved) return;
        setShowConfirmDelete(true);
    };

    const handleConfirmDelete = async () => {
        setIsProcessing(true);
        try {
            await taskReportService.deleteResolvedReport(report.id);
            toast.success('Đã xóa báo cáo thành công');
            setShowConfirmDelete(false);
            if (onReportUpdate) {
                onReportUpdate();
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            toast.error(error.message || 'Không thể xóa báo cáo');
            setShowConfirmDelete(false);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelDelete = () => {
        setShowConfirmDelete(false);
    };

    return (
        <div className={`report-card ${report.is_resolved ? 'resolved' : ''}`}>
            <div className="report-card-header">
                <h3 className="report-title">
                    Báo cáo của: {report.task_title || 'N/A'}
                </h3>
                {report.is_resolved && (
                    <span className="resolved-badge"> Đã xử lý</span>
                )}
            </div>

            {showUser && (
                <div className="report-user-info">
                    <span className="user-sub">Thành viên :</span>
                    <span className="user-name">
                        {report.first_name} {report.last_name} ({report.username})
                    </span>
                </div>
            )}

            <div className="report-description">
                <h4>Mô tả:</h4>
                <p>{report.description || 'Không có mô tả'}</p>
            </div>

            {report.file_url && (
                <div className="report-file">
                    <div className="file-info">
                        <span className="file-sub">File đính kèm :</span>
                        <div className="file-details">
                            <span className="file-name">{report.file_name}</span>
                            <span className="file-size">{formatFileSize(report.file_size)}</span>
                        </div>
                    </div>
                    <button onClick={handleDownload} className="download-btn">
                         Tải xuống
                    </button>
                </div>
            )}

            <div className="report-footer">
                <div className="report-dates">
                    <div className="date-item">
                        <span
                            className="date-label"
                            style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
                        >
                            Thời gian gửi:
                        </span>
                        <span
                            className="date-value"
                            style={{ color: isDarkMode ? '#e5e7eb' : '#111827' }}
                        >
                            {formatDate(report.submitted_at)}
                        </span>
                    </div>
                    {report.is_resolved && report.resolved_at && (
                        <div className="date-item">
                            <span
                                className="date-label"
                                style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
                            >
                                Đã xử lý lúc:
                            </span>
                            <span
                                className="date-value"
                                style={{ color: isDarkMode ? '#e5e7eb' : '#111827' }}
                            >
                                {formatDate(report.resolved_at)}
                            </span>
                        </div>
                    )}
                    {report.is_resolved && report.resolved_by_username && (
                        <div className="date-item">
                            <span
                                className="date-label"
                                style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
                            >
                                Xử lý bởi admin:
                            </span>
                            <span
                                className="date-value"
                                style={{ color: isDarkMode ? '#e5e7eb' : '#111827' }}
                            >
                                {report.resolved_by_username}
                            </span>
                        </div>
                    )}
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                    <div className="admin-actions">
                        {!report.is_resolved ? (
                            <button
                                onClick={handleMarkResolved}
                                disabled={isProcessing}
                                className="mark-resolved-btn"
                            >
                                {isProcessing ? 'Đang xử lý...' : ' Đánh dấu hoàn thành'}
                            </button>
                        ) : (
                            <button
                                onClick={handleDelete}
                                disabled={isProcessing}
                                className="delete-resolved-btn"
                            >
                                {isProcessing ? 'Đang xóa...' : ' Xóa báo cáo'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={showConfirmDelete}
                title="Xác nhận xóa báo cáo"
                message="Bạn có chắc chắn muốn xóa báo cáo này không?"
                infoMessage="Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                loading={isProcessing}
                variant="danger"
            />
        </div>
    );
};

export default ReportCard;
