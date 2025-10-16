import { useState, useEffect } from 'react';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import './CreateTaskForm.css';

const CreateTaskForm = ({ onTaskCreated, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignee_id: '',
        watcher_id: '',
        project_id: '',
        start_date: new Date().toISOString().split('T')[0],
        due_date: '',
        priority: 'medium',
        status: 'not_started'
    });

    const [errors, setErrors] = useState({});

    // Load users and projects
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [usersResponse, projectsResponse] = await Promise.all([
                userService.getUsersForDropdown(),
                projectService.getProjectsForDropdown()
            ]);

            if (usersResponse.success) {
                setUsers(usersResponse.data.users || []);
            }

            if (projectsResponse.success) {
                setProjects(projectsResponse.data.projects || []);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };


    const handleFilesChange = (e) => {
        const files = Array.from(e.target.files);

        // Validate số lượng files (tối đa 5)
        if (files.length > 5) {
            setErrors(prev => ({ ...prev, files: 'Chỉ được upload tối đa 5 files' }));
            return;
        }

        // Validate từng file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'];

        const maxSize = 20 * 1024 * 1024; // 20MB

        for (const file of files) {
            if (file.size > maxSize) {
                setErrors(prev => ({ ...prev, files: `File "${file.name}" vượt quá 20MB` }));
                return;
            }

            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({ ...prev, files: `File "${file.name}" không đúng định dạng cho phép` }));
                return;
            }
        }

        setSelectedFiles(files);

        // Clear error
        if (errors.files) {
            setErrors(prev => ({ ...prev, files: '' }));
        }
    };

    const removeFile = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);

        // Reset input nếu không còn file
        if (newFiles.length === 0) {
            const fileInput = document.getElementById('files');
            if (fileInput) {
                fileInput.value = '';
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Tên task là bắt buộc';
        }

        if (!formData.assignee_id) {
            newErrors.assignee_id = 'Người được giao là bắt buộc';
        }

        if (!formData.due_date) {
            newErrors.due_date = 'Deadline là bắt buộc';
        }

        // Check if due date is not in the past
        if (formData.due_date && new Date(formData.due_date) < new Date().setHours(0, 0, 0, 0)) {
            newErrors.due_date = 'Deadline không thể là ngày trong quá khứ';
        }

        // Check if start date is not after due date
        if (formData.start_date && formData.due_date &&
            new Date(formData.start_date) > new Date(formData.due_date)) {
            newErrors.start_date = 'Ngày bắt đầu không thể sau deadline';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {

            // Tạo FormData để gửi cả files và data
            const formDataToSend = new FormData();

            // Append các field vào FormData
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('assignee_id', formData.assignee_id);
            formDataToSend.append('watcher_id', formData.watcher_id || '');
            formDataToSend.append('project_id', formData.project_id || '');
            formDataToSend.append('start_date', formData.start_date);
            formDataToSend.append('due_date', formData.due_date);
            formDataToSend.append('priority', formData.priority);
            formDataToSend.append('status', formData.status);

            // Append files (multer sẽ nhận array với key 'files')
            selectedFiles.forEach((file) => {
                formDataToSend.append('files', file);
            });

            const response = await taskService.createTask(formDataToSend);

            if (response.success) {
                onTaskCreated(response.data.task);
            } else {
                setErrors({ submit: response.message || 'Có lỗi xảy ra khi tạo task' });
            }
        } catch (error) {
            console.error('Error creating task:', error);
            setErrors({ submit: 'Có lỗi xảy ra khi tạo task' });
        } finally {
            setLoading(false);
        }
    };

    const priorityOptions = [
        { value: 'low', label: 'Thấp' },
        { value: 'medium', label: 'Trung bình' },
        { value: 'high', label: 'Cao' },
        { value: 'urgent', label: 'Khẩn cấp ' }
    ];

    const statusOptions = [
        { value: 'not_started', label: 'Chưa bắt đầu' },
        { value: 'in_progress', label: 'Đang làm' },
        { value: 'completed', label: 'Hoàn thành' }
    ];

    return (
        <div className="create-task-form">
            <div className="form-header">
                <h2>Tạo Task Mới</h2>
                <p>Điền thông tin chi tiết để tạo task cho thành viên</p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Thông tin cơ bản */}
                <div className="form-section">
                    <h3>Thông tin cơ bản</h3>

                    <div className="form-group">
                        <label htmlFor="title">Tên task *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Nhập tên task ngắn gọn, dễ hiểu"
                            className={errors.title ? 'error' : ''}
                        />
                        {errors.title && <span className="error-message">{errors.title}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Mô tả task</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Mô tả chi tiết yêu cầu công việc..."
                            rows="4"
                        />
                    </div>
                </div>

                {/* Phân công */}
                <div className="form-section">
                    <h3>Phân công</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="assignee_id">Người được giao *</label>
                            <select
                                id="assignee_id"
                                name="assignee_id"
                                value={formData.assignee_id}
                                onChange={handleInputChange}
                                className={errors.assignee_id ? 'error' : ''}
                            >
                                <option value="">Chọn người được giao</option>
                                {users && users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.full_name} ({user.username})
                                    </option>
                                ))}
                            </select>
                            {errors.assignee_id && <span className="error-message">{errors.assignee_id}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="watcher_id">Người theo dõi</label>
                            <select
                                id="watcher_id"
                                name="watcher_id"
                                value={formData.watcher_id}
                                onChange={handleInputChange}
                            >
                                <option value="">Chọn người theo dõi (tuỳ chọn)</option>
                                {users && users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.full_name} ({user.username})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Thời gian */}
                <div className="form-section">
                    <h3>Thời gian</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="start_date">Ngày bắt đầu</label>
                            <input
                                type="date"
                                id="start_date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleInputChange}
                                className={errors.start_date ? 'error' : ''}
                            />
                            {errors.start_date && <span className="error-message">{errors.start_date}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="due_date">Deadline *</label>
                            <input
                                type="date"
                                id="due_date"
                                name="due_date"
                                value={formData.due_date}
                                onChange={handleInputChange}
                                className={errors.due_date ? 'error' : ''}
                            />
                            {errors.due_date && <span className="error-message">{errors.due_date}</span>}
                        </div>
                    </div>
                </div>

                {/* Mức độ ưu tiên và trạng thái */}
                <div className="form-section">
                    <h3>Mức độ ưu tiên & Trạng thái</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="priority">Mức độ ưu tiên</label>
                            <select
                                id="priority"
                                name="priority"
                                value={formData.priority}
                                onChange={handleInputChange}
                            >
                                {priorityOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">Trạng thái ban đầu</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Dự án */}
                <div className="form-section">
                    <h3>Dự án</h3>

                    <div className="form-group">
                        <label htmlFor="project_id">Chọn dự án</label>
                        <select
                            id="project_id"
                            name="project_id"
                            value={formData.project_id}
                            onChange={handleInputChange}
                        >
                            <option value="">Không thuộc dự án nào</option>
                            {projects && projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* File Upload */}
                <div className="form-section">
                    <h3>Tệp đính kèm</h3>

                    <div className="form-group">
                        <label htmlFor="files">Upload files (Tùy chọn - Tối đa 5 files)</label>
                        <input
                            type="file"
                            id="files"
                            multiple
                            onChange={handleFilesChange}
                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                            className={errors.files ? 'error' : ''}
                        />
                        {errors.files && <span className="error-message">{errors.files}</span>}

                        {selectedFiles && selectedFiles.length > 0 && (
                            <div className="files-preview">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="file-preview-item">
                                        <img
                                            src="/file_display.png"
                                            alt="File"
                                            className="file-icon-preview"
                                        />
                                        <span className="file-name">{file.name}</span>
                                        <span className="file-size">
                                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="remove-file-btn"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <small className="help-text">
                            Cho phép: JPG, PNG, PDF, DOC, DOCX, XLS, XLSX, TXT (Mỗi file tối đa 20MB)
                        </small>
                    </div>
                </div>

                {/* Error message */}
                {errors.submit && (
                    <div className="error-message submit-error">
                        {errors.submit}
                    </div>
                )}

                {/* Form actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="cancel-btn"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Đang tạo...' : 'Tạo Task'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateTaskForm;