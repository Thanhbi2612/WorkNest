import api from './api';

const projectService = {
    // Get all projects (admin only)
    getAllProjects: async (page = 1, limit = 20, status = '') => {
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', limit);
            if (status) params.append('status', status);

            const response = await api.get(`/projects?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error getting all projects:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Get projects for dropdown (admin only)
    getProjectsForDropdown: async () => {
        try {
            const response = await api.get('/projects/dropdown');
            return response.data;
        } catch (error) {
            console.error('Error getting projects for dropdown:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Create new project (admin only)
    createProject: async (projectData) => {
        try {
            const response = await api.post('/projects', projectData);
            return response.data;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Get project by ID (admin only)
    getProjectById: async (projectId) => {
        try {
            const response = await api.get(`/projects/${projectId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting project by ID:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Update project (admin only)
    updateProject: async (projectId, projectData) => {
        try {
            const response = await api.put(`/projects/${projectId}`, projectData);
            return response.data;
        } catch (error) {
            console.error('Error updating project:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Delete project (admin only)
    deleteProject: async (projectId) => {
        try {
            const response = await api.delete(`/projects/${projectId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    }
};

export { projectService };