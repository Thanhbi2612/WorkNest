import api from './api';

const userService = {
    // Get users for dropdown (admin only)
    getUsersForDropdown: async () => {
        try {
            const response = await api.get('/users/dropdown');
            return response.data;
        } catch (error) {
            console.error('Error getting users for dropdown:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Get all users (admin only)
    getAllUsers: async (page = 1, limit = 20, search = '') => {
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', limit);
            if (search) params.append('search', search);

            const response = await api.get(`/users?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Get user by ID
    getUserById: async (userId) => {
        try {
            const response = await api.get(`/users/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting user by ID:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Update user profile
    updateProfile: async (userId, profileData) => {
        try {
            const response = await api.patch(`/users/${userId}`, profileData);
            return response.data;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Toggle user status (admin only)
    toggleUserStatus: async (userId) => {
        try {
            const response = await api.patch(`/users/${userId}/toggle-status`);
            return response.data;
        } catch (error) {
            console.error('Error toggling user status:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Delete user (admin only)
    deleteUser: async (userId) => {
        try {
            const response = await api.delete(`/users/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Get user statistics (admin only)
    getUserStats: async () => {
        try {
            const response = await api.get('/users/stats/overview');
            return response.data;
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Get current user profile
    getCurrentUserProfile: async () => {
        try {
            const response = await api.get('/users/profile');
            return response.data;
        } catch (error) {
            console.error('Error getting current user profile:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Update current user profile
    updateCurrentUserProfile: async (profileData) => {
        try {
            const response = await api.put('/users/profile', profileData);
            return response.data;
        } catch (error) {
            console.error('Error updating current user profile:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Change password
    changePassword: async (passwordData) => {
        try {
            const response = await api.put('/users/password', passwordData);
            return response.data;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Delete current user account
    deleteCurrentUserAccount: async () => {
        try {
            const response = await api.delete('/users/account');
            return response.data;
        } catch (error) {
            console.error('Error deleting current user account:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Reset user password (admin only)
    resetUserPassword: async (userId, newPassword) => {
        try {
            const response = await api.patch(`/users/${userId}/reset-password`, { newPassword });
            return response.data;
        } catch (error) {
            console.error('Error resetting user password:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Upload avatar
    uploadAvatar: async (file) => {
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await api.post('/users/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    }
};

export { userService };