import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './ReportForm.css';

const ReportForm = ({ task, existingReport, onSave, onCancel }) => {
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (existingReport) {
            setDescription(existingReport.description || '');
            setFileName(existingReport.file_name || '');
        }
    }, [existingReport]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file size (10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                toast.error('File quá lớn! Kích thước tối đa 10MB');
                e.target.value = '';
                return;
            }

            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'text/plain',
                'application/zip',
                'application/x-rar-compressed'
            ];

            if (!allowedTypes.includes(selectedFile.type)) {
                toast.error('Loại file không được hỗ trợ!');
                e.target.value = '';
                return;
            }

            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!description.trim()) {
            toast.error('Vui lòng nhập mô tả báo cáo');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('description', description.trim());
        if (file) {
            formData.append('report_file', file);
        }

        try {
            await onSave(formData);
            // Reset form
            setDescription('');
            setFile(null);
            setFileName('');
        } catch (error) {
            // Error handled by parent
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setFileName('');
        const fileInput = document.getElementById('report-file-input');
        if (fileInput) fileInput.value = '';
    };

    return (
        <div className="report-form-container">
            <div className="report-form-header">
                <h3>{existingReport ? 'Cập nhật báo cáo' : 'Tạo báo cáo'}</h3>
                <p className="task-title">Task: {task?.title}</p>
            </div>

            <form onSubmit={handleSubmit} className="report-form">
                <div className="form-group">
                    <label htmlFor="description">
                        Mô tả báo cáo <span className="required">*</span>
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Nhập mô tả chi tiết về báo cáo..."
                        rows={6}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="report-file-input">
                        File đính kèm {!existingReport && '(không bắt buộc)'}
                    </label>
                    <div className="file-input-wrapper">
                        <input
                            type="file"
                            id="report-file-input"
                            onChange={handleFileChange}
                            className="file-input"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt,.zip,.rar"
                        />
                        <label htmlFor="report-file-input" className="file-input-label">
                            {fileName || 'Chọn file'}
                        </label>
                        {(file || fileName) && (
                            <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="remove-file-btn"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <small className="file-hint">
                        Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, TXT, ZIP, RAR (Tối đa 10MB)
                    </small>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn-cancel"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="btn-save"
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReportForm;
