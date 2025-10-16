import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './CreateProjectForm.css';

const CreateProjectForm = ({ onProjectCreated, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active'
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            toast.error('Tên dự án không được để trống');
            return;
        }

        setLoading(true);
        try {
            // Call parent callback
            await onProjectCreated(formData);
        } catch (error) {
            console.error('Error in form:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-project-form">
            <div className="form-header">
                <h2>Tạo Dự Án Mới</h2>
                <p>Điền thông tin để tạo dự án mới</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name" className="form-label">
                        Tên dự án <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nhập tên dự án"
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description" className="form-label">
                        Mô tả
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Nhập mô tả dự án"
                        className="form-textarea"
                        rows="4"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="status" className="form-label">
                        Trạng thái
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="form-select"
                    >
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Tạm dừng</option>
                        <option value="completed">Đã hoàn thành</option>
                    </select>
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
                        className="btn-submit"
                        disabled={loading}
                    >
                        {loading ? 'Đang tạo...' : 'Tạo dự án'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateProjectForm;
