const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Task extends BaseModel {
    constructor() {
        super('tasks');
    }

    async getTaskWithDetails(taskId) {
        try {
            const result = await query(`
                SELECT
                    t.*,
                    assignee.username as assignee_username,
                    assignee.first_name as assignee_first_name,
                    assignee.last_name as assignee_last_name,
                    assignee.email as assignee_email,
                    watcher.username as watcher_username,
                    watcher.first_name as watcher_first_name,
                    watcher.last_name as watcher_last_name,
                    creator.username as creator_username,
                    creator.first_name as creator_first_name,
                    creator.last_name as creator_last_name,
                    p.name as project_name
                FROM ${this.tableName} t
                LEFT JOIN users assignee ON t.assignee_id = assignee.id
                LEFT JOIN users watcher ON t.watcher_id = watcher.id
                LEFT JOIN users creator ON t.creator_id = creator.id
                LEFT JOIN projects p ON t.project_id = p.id
                WHERE t.id = $1
            `, [taskId]);

            const task = result.rows[0] || null;

            // Lấy files của task
            if (task) {
                const filesResult = await query(`
                    SELECT id, file_name, file_size, file_type, uploaded_at
                    FROM task_files
                    WHERE task_id = $1
                    ORDER BY uploaded_at ASC
                `, [taskId]);

                task.files = filesResult.rows;
            }

            return task;
        } catch (error) {
            console.error('Error getting task with details:', error);
            throw error;
        }
    }

    async getTasksByAssignee(assigneeId, filters = {}) {
        try {
            let whereClause = 'WHERE t.assignee_id = $1';
            let params = [assigneeId];
            let paramCount = 1;

            if (filters.status) {
                paramCount++;
                whereClause += ` AND t.status = $${paramCount}`;
                params.push(filters.status);
            }

            if (filters.priority) {
                paramCount++;
                whereClause += ` AND t.priority = $${paramCount}`;
                params.push(filters.priority);
            }

            let limitClause = '';
            if (filters.limit) {
                paramCount++;
                limitClause += ` LIMIT $${paramCount}`;
                params.push(filters.limit);

                if (filters.offset) {
                    paramCount++;
                    limitClause += ` OFFSET $${paramCount}`;
                    params.push(filters.offset);
                }
            }

            const result = await query(`
                SELECT
                    t.*,
                    creator.username as creator_username,
                    creator.first_name as creator_first_name,
                    creator.last_name as creator_last_name,
                    p.name as project_name
                FROM ${this.tableName} t
                LEFT JOIN users creator ON t.creator_id = creator.id
                LEFT JOIN projects p ON t.project_id = p.id
                ${whereClause}
                ORDER BY t.due_date ASC, t.created_at DESC
                ${limitClause}
            `, params);

            const tasks = result.rows;

            // Lấy files cho từng task
            for (const task of tasks) {
                const filesResult = await query(`
                    SELECT id, file_name, file_size, file_type, uploaded_at
                    FROM task_files
                    WHERE task_id = $1
                    ORDER BY uploaded_at ASC
                `, [task.id]);

                task.files = filesResult.rows;
                console.log(`📎 Task ${task.id} has ${filesResult.rows.length} files`);
            }

            return tasks;
        } catch (error) {
            console.error('Error getting tasks by assignee:', error);
            throw error;
        }
    }

    async countTasksByAssignee(assigneeId, filters = {}) {
        try {
            let whereClause = 'WHERE assignee_id = $1';
            let params = [assigneeId];
            let paramCount = 1;

            if (filters.status) {
                paramCount++;
                whereClause += ` AND status = $${paramCount}`;
                params.push(filters.status);
            }

            if (filters.priority) {
                paramCount++;
                whereClause += ` AND priority = $${paramCount}`;
                params.push(filters.priority);
            }

            const result = await query(`
                SELECT COUNT(*) as count
                FROM ${this.tableName}
                ${whereClause}
            `, params);

            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error counting tasks by assignee:', error);
            throw error;
        }
    }

    async updateStatus(taskId, status) {
        try {
            const result = await query(`
                UPDATE ${this.tableName}
                SET status = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `, [status, taskId]);

            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating task status:', error);
            throw error;
        }
    }


    async getTasksByStatus(status, limit = 20, offset = 0) {
        try {
            const result = await query(`
                SELECT
                    t.*,
                    assignee.username as assignee_username,
                    assignee.first_name as assignee_first_name,
                    assignee.last_name as assignee_last_name,
                    creator.username as creator_username,
                    creator.first_name as creator_first_name,
                    creator.last_name as creator_last_name,
                    p.name as project_name
                FROM ${this.tableName} t
                LEFT JOIN users assignee ON t.assignee_id = assignee.id
                LEFT JOIN users creator ON t.creator_id = creator.id
                LEFT JOIN projects p ON t.project_id = p.id
                WHERE t.status = $1
                ORDER BY t.due_date ASC, t.created_at DESC
                LIMIT $2 OFFSET $3
            `, [status, limit, offset]);

            return result.rows;
        } catch (error) {
            console.error('Error getting tasks by status:', error);
            throw error;
        }
    }

    async getOverdueTasks(limit = 20, offset = 0) {
        try {
            const result = await query(`
                SELECT
                    t.*,
                    assignee.username as assignee_username,
                    assignee.first_name as assignee_first_name,
                    assignee.last_name as assignee_last_name,
                    creator.username as creator_username,
                    creator.first_name as creator_first_name,
                    creator.last_name as creator_last_name,
                    p.name as project_name
                FROM ${this.tableName} t
                LEFT JOIN users assignee ON t.assignee_id = assignee.id
                LEFT JOIN users creator ON t.creator_id = creator.id
                LEFT JOIN projects p ON t.project_id = p.id
                WHERE t.due_date < CURRENT_DATE AND t.status != 'completed'
                ORDER BY t.due_date ASC
                LIMIT $1 OFFSET $2
            `, [limit, offset]);

            return result.rows;
        } catch (error) {
            console.error('Error getting overdue tasks:', error);
            throw error;
        }
    }

    // Get task statistics for admin dashboard
    async getTaskStats() {
        try {
            const result = await query(`
                SELECT
                    COUNT(*) as total_tasks,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
                    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
                    COUNT(*) FILTER (WHERE status = 'not_started') as not_started_tasks,
                    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'completed') as overdue_tasks
                FROM ${this.tableName}
            `);

            return result.rows[0];
        } catch (error) {
            console.error('Error getting task stats:', error);
            throw error;
        }
    }

    // Get task statistics for a specific user
    async getTaskStatsByUser(userId) {
        try {
            const result = await query(`
                SELECT
                    COUNT(*) as total_tasks,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
                    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
                    COUNT(*) FILTER (WHERE status = 'not_started') as not_started_tasks,
                    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'completed') as overdue_tasks
                FROM ${this.tableName}
                WHERE assignee_id = $1
            `, [userId]);

            return result.rows[0];
        } catch (error) {
            console.error('Error getting task stats by user:', error);
            throw error;
        }
    }

    // Get all tasks with details (admin only)
    async getAllTasksWithDetails(filters = {}) {
        try {
            let whereClause = 'WHERE 1=1';
            let params = [];
            let paramCount = 0;

            if (filters.status) {
                paramCount++;
                whereClause += ` AND t.status = $${paramCount}`;
                params.push(filters.status);
            }

            if (filters.priority) {
                paramCount++;
                whereClause += ` AND t.priority = $${paramCount}`;
                params.push(filters.priority);
            }

            if (filters.project_id) {
                paramCount++;
                whereClause += ` AND t.project_id = $${paramCount}`;
                params.push(parseInt(filters.project_id));
            }

            let limitClause = '';
            if (filters.limit) {
                paramCount++;
                limitClause += ` LIMIT $${paramCount}`;
                params.push(filters.limit);

                if (filters.offset) {
                    paramCount++;
                    limitClause += ` OFFSET $${paramCount}`;
                    params.push(filters.offset);
                }
            }

            const result = await query(`
                SELECT
                    t.*,
                    assignee.username as assignee_username,
                    assignee.first_name as assignee_first_name,
                    assignee.last_name as assignee_last_name,
                    assignee.email as assignee_email,
                    watcher.username as watcher_username,
                    watcher.first_name as watcher_first_name,
                    watcher.last_name as watcher_last_name,
                    creator.username as creator_username,
                    creator.first_name as creator_first_name,
                    creator.last_name as creator_last_name,
                    p.name as project_name
                FROM ${this.tableName} t
                LEFT JOIN users assignee ON t.assignee_id = assignee.id
                LEFT JOIN users watcher ON t.watcher_id = watcher.id
                LEFT JOIN users creator ON t.creator_id = creator.id
                LEFT JOIN projects p ON t.project_id = p.id
                ${whereClause}
                ORDER BY t.created_at DESC
                ${limitClause}
            `, params);

            const tasks = result.rows;

            // Lấy files cho từng task
            for (const task of tasks) {
                const filesResult = await query(`
                    SELECT id, file_name, file_size, file_type, uploaded_at
                    FROM task_files
                    WHERE task_id = $1
                    ORDER BY uploaded_at ASC
                `, [task.id]);

                task.files = filesResult.rows;
                console.log(`📎 Task ${task.id} has ${filesResult.rows.length} files`);
            }

            return tasks;
        } catch (error) {
            console.error('Error getting all tasks with details:', error);
            throw error;
        }
    }

    // Count all tasks with filters (admin only)
    async countAllTasks(filters = {}) {
        try {
            let whereClause = 'WHERE 1=1';
            let params = [];
            let paramCount = 0;

            if (filters.status) {
                paramCount++;
                whereClause += ` AND status = $${paramCount}`;
                params.push(filters.status);
            }

            if (filters.priority) {
                paramCount++;
                whereClause += ` AND priority = $${paramCount}`;
                params.push(filters.priority);
            }

            if (filters.project_id) {
                paramCount++;
                whereClause += ` AND project_id = $${paramCount}`;
                params.push(parseInt(filters.project_id));
            }

            const result = await query(`
                SELECT COUNT(*) as total
                FROM ${this.tableName}
                ${whereClause}
            `, params);

            return parseInt(result.rows[0].total);
        } catch (error) {
            console.error('Error counting all tasks:', error);
            throw error;
        }
    }

    // 🆕 GENERAL PAGINATION METHOD - Tổng quát cho mọi trường hợp
    async findWithPagination(page = 1, limit = 6, filters = {}, userContext = null) {
        try {
            // Tính offset
            const offset = (page - 1) * limit;

            // Build WHERE clause động
            let whereClause = 'WHERE 1=1';
            let params = [];
            let paramCount = 0;

            // Filter theo status
            if (filters.status) {
                paramCount++;
                whereClause += ` AND t.status = $${paramCount}`;
                params.push(filters.status);
            }

            // Filter theo priority
            if (filters.priority) {
                paramCount++;
                whereClause += ` AND t.priority = $${paramCount}`;
                params.push(filters.priority);
            }

            // Filter theo project_id
            if (filters.project_id) {
                paramCount++;
                whereClause += ` AND t.project_id = $${paramCount}`;
                params.push(parseInt(filters.project_id));
            }

            // Filter theo assignee_id (cho user xem tasks của mình)
            if (filters.assignee_id) {
                paramCount++;
                whereClause += ` AND t.assignee_id = $${paramCount}`;
                params.push(parseInt(filters.assignee_id));
            }

            // Filter theo creator_id
            if (filters.creator_id) {
                paramCount++;
                whereClause += ` AND t.creator_id = $${paramCount}`;
                params.push(parseInt(filters.creator_id));
            }

            // Filter theo watcher_id
            if (filters.watcher_id) {
                paramCount++;
                whereClause += ` AND t.watcher_id = $${paramCount}`;
                params.push(parseInt(filters.watcher_id));
            }

            // Filter tasks overdue
            if (filters.overdue === true || filters.overdue === 'true') {
                whereClause += ` AND t.due_date < CURRENT_DATE AND t.status != 'completed'`;
            }

            // Filter tasks today
            if (filters.today === true || filters.today === 'true') {
                whereClause += ` AND t.due_date = CURRENT_DATE`;
            }

            // Filter tasks upcoming (trong tương lai)
            if (filters.upcoming === true || filters.upcoming === 'true') {
                whereClause += ` AND t.due_date > CURRENT_DATE AND t.status != 'completed'`;
            }

            // Search theo title
            if (filters.search) {
                paramCount++;
                whereClause += ` AND t.title ILIKE $${paramCount}`;
                params.push(`%${filters.search}%`);
            }

            // Build ORDER BY clause
            let orderByClause = 'ORDER BY ';
            const sortBy = filters.sort || 'created_at';
            const order = filters.order === 'asc' ? 'ASC' : 'DESC';

            switch (sortBy) {
                case 'due_date':
                    orderByClause += `t.due_date ${order}, t.created_at DESC`;
                    break;
                case 'priority':
                    // Priority order: urgent > high > medium > low
                    orderByClause += `
                        CASE t.priority
                            WHEN 'urgent' THEN 1
                            WHEN 'high' THEN 2
                            WHEN 'medium' THEN 3
                            WHEN 'low' THEN 4
                        END ${order}, t.created_at DESC
                    `;
                    break;
                case 'status':
                    orderByClause += `t.status ${order}, t.created_at DESC`;
                    break;
                case 'title':
                    orderByClause += `t.title ${order}`;
                    break;
                default:
                    orderByClause += `t.created_at ${order}`;
            }

            // Query đếm tổng số tasks
            const countQuery = `
                SELECT COUNT(*) as total
                FROM ${this.tableName} t
                ${whereClause}
            `;

            // Query lấy tasks với pagination
            const dataQuery = `
                SELECT
                    t.*,
                    assignee.username as assignee_username,
                    assignee.first_name as assignee_first_name,
                    assignee.last_name as assignee_last_name,
                    assignee.email as assignee_email,
                    watcher.username as watcher_username,
                    watcher.first_name as watcher_first_name,
                    watcher.last_name as watcher_last_name,
                    creator.username as creator_username,
                    creator.first_name as creator_first_name,
                    creator.last_name as creator_last_name,
                    p.name as project_name
                FROM ${this.tableName} t
                LEFT JOIN users assignee ON t.assignee_id = assignee.id
                LEFT JOIN users watcher ON t.watcher_id = watcher.id
                LEFT JOIN users creator ON t.creator_id = creator.id
                LEFT JOIN projects p ON t.project_id = p.id
                ${whereClause}
                ${orderByClause}
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            // Execute queries
            const countResult = await query(countQuery, params);
            const dataResult = await query(dataQuery, [...params, limit, offset]);

            const total = parseInt(countResult.rows[0].total);
            const tasks = dataResult.rows;

            // Lấy files cho từng task
            for (const task of tasks) {
                const filesResult = await query(`
                    SELECT id, file_name, file_size, file_type, uploaded_at
                    FROM task_files
                    WHERE task_id = $1
                    ORDER BY uploaded_at ASC
                `, [task.id]);

                task.files = filesResult.rows;
            }

            // Tính toán pagination metadata
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            return {
                tasks,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage,
                    hasPrevPage
                }
            };
        } catch (error) {
            console.error('Error in findWithPagination:', error);
            throw error;
        }
    }

    // Confirm task completion (called when admin approves report)
    async confirmTaskCompletion(taskId, adminId) {
        try {
            const result = await query(`
                UPDATE ${this.tableName}
                SET is_confirmed = TRUE,
                    confirmed_at = CURRENT_TIMESTAMP,
                    confirmed_by = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND status = 'completed'
                RETURNING *
            `, [taskId, adminId]);

            return result.rows[0] || null;
        } catch (error) {
            console.error('Error confirming task completion:', error);
            throw error;
        }
    }

    // Delete confirmed task (only by task owner)
    async deleteConfirmedTask(taskId, userId) {
        try {
            // Check if task exists, is confirmed, and belongs to user
            const checkResult = await query(`
                SELECT id, assignee_id, is_confirmed, title
                FROM ${this.tableName}
                WHERE id = $1
            `, [taskId]);

            const task = checkResult.rows[0];

            if (!task) {
                throw new Error('Task not found');
            }

            if (task.assignee_id !== userId) {
                throw new Error('You are not authorized to delete this task');
            }

            if (!task.is_confirmed) {
                throw new Error('Can only delete confirmed tasks');
            }

            // Delete task (CASCADE will delete task_files and task_reports)
            const result = await query(`
                DELETE FROM ${this.tableName}
                WHERE id = $1
                RETURNING *
            `, [taskId]);

            return result.rows[0] || null;
        } catch (error) {
            console.error('Error deleting confirmed task:', error);
            throw error;
        }
    }
}

module.exports = Task;