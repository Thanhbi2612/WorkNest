import api from './api';

const dashboardService = {
    // Get dashboard stats for admin
    getAdminDashboardStats: async () => {
        try {
            const response = await api.get('/admin/dashboard/stats');
            return response.data;
        } catch (error) {
            console.error('Error getting admin dashboard stats:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Get dashboard stats for current user
    getUserDashboardStats: async () => {
        try {
            const response = await api.get('/tasks/dashboard/stats');
            return response.data;
        } catch (error) {
            console.error('Error getting user dashboard stats:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    }
};

export default dashboardService;
