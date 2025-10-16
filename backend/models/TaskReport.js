const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class TaskReport extends BaseModel {
    constructor() {
        super('task_reports');
    }

    // Tạo báo cáo mới (draft)
    async create({ task_id, user_id, description, file_url = null, file_name = null, file_size = null, file_type = null }) {
        try {
            const result = await query(
                `INSERT INTO ${this.tableName}
                (task_id, user_id, description, file_url, file_name, file_size, file_type, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
                RETURNING *`,
                [task_id, user_id, description, file_url, file_name, file_size, file_type]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error creating task report:', error);
            throw error;
        }
    }

    // Tìm báo cáo theo ID
    async findById(id) {
        try {
            const result = await query(
                `SELECT
                    tr.*,
                    t.title as task_title,
                    t.status as task_status,
                    u.username,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM ${this.tableName} tr
                LEFT JOIN tasks t ON tr.task_id = t.id
                LEFT JOIN users u ON tr.user_id = u.id
                WHERE tr.id = $1`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding task report by id:', error);
            throw error;
        }
    }

    // Tìm báo cáo theo task_id
    async findByTaskId(task_id) {
        try {
            const result = await query(
                `SELECT
                    tr.*,
                    t.title as task_title,
                    t.status as task_status,
                    u.username,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM ${this.tableName} tr
                LEFT JOIN tasks t ON tr.task_id = t.id
                LEFT JOIN users u ON tr.user_id = u.id
                WHERE tr.task_id = $1
                ORDER BY tr.created_at DESC`,
                [task_id]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding task reports by task_id:', error);
            throw error;
        }
    }

    // Tìm báo cáo theo user_id
    async findByUserId(user_id, limit = 50, offset = 0) {
        try {
            const result = await query(
                `SELECT
                    tr.*,
                    t.title as task_title,
                    t.status as task_status,
                    t.due_date as task_due_date
                FROM ${this.tableName} tr
                LEFT JOIN tasks t ON tr.task_id = t.id
                WHERE tr.user_id = $1
                ORDER BY tr.created_at DESC
                LIMIT $2 OFFSET $3`,
                [user_id, limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding task reports by user_id:', error);
            throw error;
        }
    }

    // Tìm báo cáo của 1 user cho 1 task cụ thể
    async findByTaskAndUser(task_id, user_id) {
        try {
            const result = await query(
                `SELECT
                    tr.*,
                    t.title as task_title,
                    t.status as task_status
                FROM ${this.tableName} tr
                LEFT JOIN tasks t ON tr.task_id = t.id
                WHERE tr.task_id = $1 AND tr.user_id = $2`,
                [task_id, user_id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding task report by task and user:', error);
            throw error;
        }
    }

    // Lấy tất cả báo cáo (cho admin)
    async findAll(limit = 50, offset = 0, filters = {}) {
        try {
            let whereClause = [];
            let params = [];
            let paramIndex = 1;

            // Filter by status
            if (filters.status) {
                whereClause.push(`tr.status = $${paramIndex}`);
                params.push(filters.status);
                paramIndex++;
            }

            // Filter by user_id
            if (filters.user_id) {
                whereClause.push(`tr.user_id = $${paramIndex}`);
                params.push(filters.user_id);
                paramIndex++;
            }

            // Filter by task_id
            if (filters.task_id) {
                whereClause.push(`tr.task_id = $${paramIndex}`);
                params.push(filters.task_id);
                paramIndex++;
            }

            // Filter by is_resolved
            if (filters.is_resolved !== undefined) {
                whereClause.push(`tr.is_resolved = $${paramIndex}`);
                params.push(filters.is_resolved);
                paramIndex++;
            }

            const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

            params.push(limit, offset);

            const result = await query(
                `SELECT
                    tr.*,
                    t.title as task_title,
                    t.status as task_status,
                    t.due_date as task_due_date,
                    u.username,
                    u.first_name,
                    u.last_name,
                    u.email,
                    ua.username as resolved_by_username,
                    ua.email as resolved_by_email
                FROM ${this.tableName} tr
                LEFT JOIN tasks t ON tr.task_id = t.id
                LEFT JOIN users u ON tr.user_id = u.id
                LEFT JOIN user_admin ua ON tr.resolved_by = ua.id
                ${whereString}
                ORDER BY tr.is_resolved ASC, tr.created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
                params
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding all task reports:', error);
            throw error;
        }
    }

    // Cập nhật báo cáo (chỉ khi status = draft)
    async update(id, { description, file_url, file_name, file_size, file_type }) {
        try {
            const updates = [];
            const params = [];
            let paramIndex = 1;

            if (description !== undefined) {
                updates.push(`description = $${paramIndex}`);
                params.push(description);
                paramIndex++;
            }

            if (file_url !== undefined) {
                updates.push(`file_url = $${paramIndex}`);
                params.push(file_url);
                paramIndex++;
            }

            if (file_name !== undefined) {
                updates.push(`file_name = $${paramIndex}`);
                params.push(file_name);
                paramIndex++;
            }

            if (file_size !== undefined) {
                updates.push(`file_size = $${paramIndex}`);
                params.push(file_size);
                paramIndex++;
            }

            if (file_type !== undefined) {
                updates.push(`file_type = $${paramIndex}`);
                params.push(file_type);
                paramIndex++;
            }

            if (updates.length === 0) {
                return null;
            }

            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            params.push(id);

            const result = await query(
                `UPDATE ${this.tableName}
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex} AND status = 'draft'
                RETURNING *`,
                params
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating task report:', error);
            throw error;
        }
    }

    // Gửi báo cáo (chuyển status từ draft -> submitted)
    async submit(id) {
        try {
            const result = await query(
                `UPDATE ${this.tableName}
                SET status = 'submitted',
                    submitted_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND status = 'draft'
                RETURNING *`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error submitting task report:', error);
            throw error;
        }
    }

    // Xóa báo cáo (chỉ khi status = draft)
    async deleteById(id) {
        try {
            const result = await query(
                `DELETE FROM ${this.tableName}
                WHERE id = $1 AND status = 'draft'
                RETURNING *`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error deleting task report:', error);
            throw error;
        }
    }

    // Đếm tổng số báo cáo
    async count(filters = {}) {
        try {
            let whereClause = [];
            let params = [];
            let paramIndex = 1;

            if (filters.status) {
                whereClause.push(`status = $${paramIndex}`);
                params.push(filters.status);
                paramIndex++;
            }

            if (filters.user_id) {
                whereClause.push(`user_id = $${paramIndex}`);
                params.push(filters.user_id);
                paramIndex++;
            }

            const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

            const result = await query(
                `SELECT COUNT(*) as count FROM ${this.tableName} ${whereString}`,
                params
            );
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error counting task reports:', error);
            throw error;
        }
    }

    // Đánh dấu báo cáo đã xử lý (admin only)
    async markAsResolved(reportId, adminId) {
        try {
            const result = await query(
                `UPDATE ${this.tableName}
                SET is_resolved = TRUE,
                    resolved_at = CURRENT_TIMESTAMP,
                    resolved_by = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *`,
                [reportId, adminId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error marking task report as resolved:', error);
            throw error;
        }
    }

    // Xóa báo cáo (chỉ cho phép nếu đã resolved)
    async deleteReport(reportId) {
        try {
            // Kiểm tra xem report đã resolved chưa
            const checkResult = await query(
                `SELECT id, is_resolved FROM ${this.tableName} WHERE id = $1`,
                [reportId]
            );

            if (!checkResult.rows[0]) {
                throw new Error('Report không tồn tại');
            }

            if (!checkResult.rows[0].is_resolved) {
                throw new Error('Không thể xóa report chưa được đánh dấu hoàn thành');
            }

            // Xóa report
            const result = await query(
                `DELETE FROM ${this.tableName}
                WHERE id = $1
                RETURNING *`,
                [reportId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error deleting task report:', error);
            throw error;
        }
    }
}

module.exports = TaskReport;
