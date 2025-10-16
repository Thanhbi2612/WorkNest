import api from './api';

const taskService = {
    // Create new task (admin only)
    createTask: async (taskData) => {
        try {
            // Nếu là FormData, không set Content-Type (để axios tự động set)
            // Nếu là object thường, set Content-Type: application/json
            const config = {};

            if (!(taskData instanceof FormData)) {
                config.headers = {
                    'Content-Type': 'application/json'
                };
            }

            const response = await api.post('/tasks', taskData, config);
            return response.data;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Get tasks assigned to current user (ĐÃ CẬP NHẬT: Hỗ trợ pagination đầy đủ)
    getMyTasks: async (filters = {}) => {
        try {
            const params = new URLSearchParams();

            // Pagination params
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            // Filter params
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.project_id) params.append('project_id', filters.project_id);

            // Sort params
            if (filters.sort) params.append('sort', filters.sort);
            if (filters.order) params.append('order', filters.order);

            // Search param
            if (filters.search) params.append('search', filters.search);

            // Special filters
            if (filters.overdue) params.append('overdue', filters.overdue);
            if (filters.today) params.append('today', filters.today);
            if (filters.upcoming) params.append('upcoming', filters.upcoming);

            const response = await api.get(`/tasks/my-tasks?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error getting my tasks:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Get task by ID
    getTaskById: async (taskId) => {
        try {
            const response = await api.get(`/tasks/${taskId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting task by ID:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Update task status (user can update their assigned tasks)
    updateTaskStatus: async (taskId, status) => {
        try {
            const response = await api.put(`/tasks/${taskId}/status`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating task status:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Update task (admin only)
    updateTask: async (taskId, taskData) => {
        try {
            const response = await api.put(`/tasks/${taskId}`, taskData);
            return response.data;
        } catch (error) {
            console.error('Error updating task:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Delete task (admin only)
    deleteTask: async (taskId) => {
        try {
            const response = await api.delete(`/tasks/${taskId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Delete completed task (for user)
    deleteCompletedTask: async (taskId) => {
        try {
            const response = await api.delete(`/tasks/${taskId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting completed task:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Delete confirmed task (user can delete their own confirmed tasks)
    deleteConfirmedTask: async (taskId) => {
        try {
            const response = await api.delete(`/tasks/${taskId}/confirmed`);
            return response.data;
        } catch (error) {
            console.error('Error deleting confirmed task:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Get all tasks (admin only) - ĐÃ CẬP NHẬT: Hỗ trợ pagination đầy đủ
    getAllTasks: async (filters = {}) => {
        try {
            const params = new URLSearchParams();

            // Pagination params
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            // Filter params
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.project_id) params.append('project_id', filters.project_id);
            if (filters.assignee_id) params.append('assignee_id', filters.assignee_id);
            if (filters.creator_id) params.append('creator_id', filters.creator_id);

            // Sort params
            if (filters.sort) params.append('sort', filters.sort);
            if (filters.order) params.append('order', filters.order);

            // Search param
            if (filters.search) params.append('search', filters.search);

            // Special filters
            if (filters.overdue) params.append('overdue', filters.overdue);
            if (filters.today) params.append('today', filters.today);
            if (filters.upcoming) params.append('upcoming', filters.upcoming);

            const response = await api.get(`/tasks?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error getting all tasks:', error);
            throw error.response?.data || { success: false, message: 'Network error' };
        }
    },

    // Helper functions for task filtering
    getTasksByStatus: (tasks, status) => {
        return tasks.filter(task => task.status === status);
    },

    getTasksByPriority: (tasks, priority) => {
        return tasks.filter(task => task.priority === priority);
    },

    getOverdueTasks: (tasks) => {
        const today = new Date().toISOString().split('T')[0];
        return tasks.filter(task =>
            task.due_date < today && task.status !== 'completed'
        );
    },

    getTodayTasks: (tasks) => {
        const today = new Date().toISOString().split('T')[0];
        return tasks.filter(task =>
            task.due_date === today || task.start_date === today
        );
    },

    getUpcomingTasks: (tasks) => {
        const today = new Date().toISOString().split('T')[0];
        return tasks.filter(task =>
            task.due_date > today && task.status !== 'completed'
        );
    },

    // Format task data for display
    formatTaskForDisplay: (task) => {
        return {
            ...task,
            priorityLabel: taskService.getPriorityLabel(task.priority),
            statusLabel: taskService.getStatusLabel(task.status),
            formattedDueDate: taskService.formatDate(task.due_date),
            formattedStartDate: taskService.formatDate(task.start_date),
            isOverdue: taskService.isTaskOverdue(task),
            assigneeName: task.assignee_first_name && task.assignee_last_name
                ? `${task.assignee_first_name} ${task.assignee_last_name}`
                : task.assignee_username
        };
    },

    getPriorityLabel: (priority) => {
        const labels = {
            low: 'Thấp',
            medium: 'Trung bình',
            high: 'Cao',
            urgent: 'Khẩn cấp 🚨'
        };
        return labels[priority] || priority;
    },

    getStatusLabel: (status) => {
        const labels = {
            not_started: 'Chưa bắt đầu',
            in_progress: 'Đang thực hiện',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy'
        };
        return labels[status] || status;
    },

    formatDate: (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    isTaskOverdue: (task) => {
        if (task.status === 'completed') return false;

        const today = new Date().toISOString().split('T')[0];
        return task.due_date < today;
    },

    getPriorityColor: (priority) => {
        const colors = {
            low: '#10b981',
            medium: '#3b82f6',
            high: '#f59e0b',
            urgent: '#ef4444'
        };
        return colors[priority] || '#6b7280';
    },

    getStatusColor: (status) => {
        const colors = {
            not_started: '#6b7280',
            in_progress: '#3b82f6',
            completed: '#10b981',
            cancelled: '#ef4444'
        };
        return colors[status] || '#6b7280';
    }
};

export { taskService };