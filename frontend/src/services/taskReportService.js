import api from './api';

const taskReportService = {
    // Tạo báo cáo mới (draft)
    createReport: async (taskId, formData) => {
        try {
            const response = await api.post(`/tasks/${taskId}/reports`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating report:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Cập nhật báo cáo
    updateReport: async (taskId, reportId, formData) => {
        try {
            const response = await api.put(`/tasks/${taskId}/reports/${reportId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating report:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Gửi báo cáo (draft -> submitted)
    submitReport: async (taskId, reportId) => {
        try {
            const response = await api.post(`/tasks/${taskId}/reports/${reportId}/submit`);
            return response.data;
        } catch (error) {
            console.error('Error submitting report:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Lấy báo cáo của 1 task
    getTaskReports: async (taskId) => {
        try {
            const response = await api.get(`/tasks/${taskId}/reports`);
            return response.data;
        } catch (error) {
            console.error('Error getting task reports:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Lấy tất cả báo cáo của user hiện tại
    getMyReports: async (page = 1, limit = 20) => {
        try {
            const response = await api.get(`/my-reports?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('Error getting my reports:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Lấy tất cả báo cáo (admin only)
    getAllReports: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.status) queryParams.append('status', params.status);
            if (params.user_id) queryParams.append('user_id', params.user_id);
            if (params.task_id) queryParams.append('task_id', params.task_id);
            if (params.is_resolved !== undefined) queryParams.append('is_resolved', params.is_resolved);

            const response = await api.get(`/reports?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error getting all reports:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Xóa báo cáo (user - chỉ draft)
    deleteReport: async (taskId, reportId) => {
        try {
            const response = await api.delete(`/tasks/${taskId}/reports/${reportId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting report:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Đánh dấu báo cáo đã xử lý (admin only)
    markAsResolved: async (reportId) => {
        try {
            const response = await api.put(`/reports/${reportId}/resolve`);
            return response.data;
        } catch (error) {
            console.error('Error marking report as resolved:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Xóa báo cáo đã resolved (admin only)
    deleteResolvedReport: async (reportId) => {
        try {
            const response = await api.delete(`/reports/${reportId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting resolved report:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    }
};

export { taskReportService };
