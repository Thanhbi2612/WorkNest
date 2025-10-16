const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Notification extends BaseModel {
    constructor() {
        super('notifications');
    }

    // Tạo notification mới
    async create({ user_id, task_id = null, report_id = null, conversation_id = null, type, title, message = null }) {
        try {
            const result = await query(`
                INSERT INTO ${this.tableName}
                (user_id, task_id, report_id, conversation_id, type, title, message)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [user_id, task_id, report_id, conversation_id, type, title, message]);

            return result.rows[0];
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    // Tìm notification theo ID
    async findById(id) {
        try {
            const result = await query(`
                SELECT
                    n.*,
                    t.title as task_title,
                    u.username as user_username,
                    u.first_name as user_first_name,
                    u.last_name as user_last_name,
                    c.id as conversation_id,
                    c.type as conversation_type
                FROM ${this.tableName} n
                LEFT JOIN tasks t ON n.task_id = t.id
                LEFT JOIN users u ON n.user_id = u.id
                LEFT JOIN conversations c ON n.conversation_id = c.id
                WHERE n.id = $1
            `, [id]);

            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding notification by id:', error);
            throw error;
        }
    }

    // Lấy danh sách notification của user/admin (có hỗ trợ report)
    async findByUserId(userId, limit = 20, offset = 0, filters = {}) {
        try {
            let whereConditions = ['n.user_id = $1'];
            let params = [userId];
            let paramIndex = 2;

            // Filter theo is_read
            if (filters.is_read !== undefined) {
                whereConditions.push(`n.is_read = $${paramIndex}`);
                params.push(filters.is_read);
                paramIndex++;
            }

            // Filter theo type
            if (filters.type) {
                whereConditions.push(`n.type = $${paramIndex}`);
                params.push(filters.type);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const result = await query(`
                SELECT
                    n.*,
                    t.title as task_title,
                    tr.description as report_description,
                    u.username as reporter_username,
                    u.first_name as reporter_first_name,
                    u.last_name as reporter_last_name,
                    c.id as conversation_id,
                    c.type as conversation_type
                FROM ${this.tableName} n
                LEFT JOIN tasks t ON n.task_id = t.id
                LEFT JOIN task_reports tr ON n.report_id = tr.id
                LEFT JOIN users u ON tr.user_id = u.id
                LEFT JOIN conversations c ON n.conversation_id = c.id
                WHERE ${whereClause}
                ORDER BY n.created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `, [...params, limit, offset]);

            return result.rows;
        } catch (error) {
            console.error('Error getting notifications by user:', error);
            throw error;
        }
    }

    // Đếm tổng số notification (cho pagination)
    async countByUserId(userId, filters = {}) {
        try {
            let whereConditions = ['user_id = $1'];
            let params = [userId];
            let paramIndex = 2;

            if (filters.is_read !== undefined) {
                whereConditions.push(`is_read = $${paramIndex}`);
                params.push(filters.is_read);
                paramIndex++;
            }

            if (filters.type) {
                whereConditions.push(`type = $${paramIndex}`);
                params.push(filters.type);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const result = await query(`
                SELECT COUNT(*) as count
                FROM ${this.tableName}
                WHERE ${whereClause}
            `, params);

            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error counting notifications:', error);
            throw error;
        }
    }

    async getNotificationsByUser(userId, limit = 20, offset = 0) {
        // Giữ lại để tương thích ngược
        return this.findByUserId(userId, limit, offset);
    }

    async getUnreadNotificationsByUser(userId) {
        // Giữ lại để tương thích ngược
        return this.findByUserId(userId, 100, 0, { is_read: false });
    }

    // Đánh dấu notification đã đọc
    async markAsRead(notificationId, userId) {
        try {
            const result = await query(`
                UPDATE ${this.tableName}
                SET is_read = true
                WHERE id = $1 AND user_id = $2
                RETURNING *
            `, [notificationId, userId]);

            return result.rows[0] || null;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    async markAllAsRead(userId) {
        try {
            const result = await query(`
                UPDATE ${this.tableName}
                SET is_read = true
                WHERE user_id = $1 AND is_read = false
                RETURNING id
            `, [userId]);

            return { updated_count: result.rows.length };
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    // Đếm số notification chưa đọc
    async getUnreadCount(userId) {
        try {
            const result = await query(`
                SELECT COUNT(*) as count
                FROM ${this.tableName}
                WHERE user_id = $1 AND is_read = false
            `, [userId]);

            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error counting unread notifications:', error);
            throw error;
        }
    }

    async countUnreadByUser(userId) {
        // Giữ lại để tương thích ngược
        return this.getUnreadCount(userId);
    }

    // Đếm số notification chưa đọc theo category (task, calendar, report)
    async getUnreadCountByCategory(userId) {
        try {
            // Query 1: Đếm theo category (task, calendar, report)
            const categoryResult = await query(`
                SELECT
                    CASE
                        WHEN type IN ('task_assigned', 'task_updated', 'task_completed', 'deadline_reminder') THEN 'task'
                        WHEN type LIKE 'calendar_%' THEN 'calendar'
                        WHEN type LIKE 'report_%' THEN 'report'
                        WHEN type = 'message_new' THEN 'message'
                        ELSE 'other'
                    END as category,
                    COUNT(*) as count
                FROM ${this.tableName}
                WHERE user_id = $1 AND is_read = false
                GROUP BY category
            `, [userId]);

            // Query 2: Đếm task notifications theo status của task (JOIN với bảng tasks)
            const taskStatusResult = await query(`
                SELECT
                    t.status,
                    COUNT(*) as count
                FROM ${this.tableName} n
                INNER JOIN tasks t ON n.task_id = t.id
                WHERE n.user_id = $1
                  AND n.is_read = false
                  AND n.type IN ('task_assigned', 'task_updated', 'task_completed', 'deadline_reminder')
                GROUP BY t.status
            `, [userId]);

            // Chuyển đổi kết quả category thành object
            const counts = {
                task: 0,
                calendar: 0,
                report: 0,
                message: 0,
                other: 0
            };

            categoryResult.rows.forEach(row => {
                counts[row.category] = parseInt(row.count);
            });

            // Chuyển đổi kết quả task status thành object
            const taskByStatus = {
                'not-started': 0,
                'in-progress': 0,
                'completed': 0,
                'overdue': 0
            };

            taskStatusResult.rows.forEach(row => {
                // Map database status sang frontend status
                const statusMap = {
                    'not_started': 'not-started',
                    'in_progress': 'in-progress',
                    'completed': 'completed',
                    'overdue': 'overdue'
                };

                const mappedStatus = statusMap[row.status] || row.status;
                if (taskByStatus.hasOwnProperty(mappedStatus)) {
                    taskByStatus[mappedStatus] = parseInt(row.count);
                }
            });

            // Tính tổng
            const total = counts.task + counts.calendar + counts.report + counts.message + counts.other;

            return {
                total,
                byType: {
                    task: counts.task,
                    calendar: counts.calendar,
                    report: counts.report,
                    message: counts.message
                },
                taskByStatus  // ← THÊM MỚI: breakdown task notifications theo status
            };
        } catch (error) {
            console.error('Error counting unread notifications by category:', error);
            throw error;
        }
    }

    async deleteOldNotifications(daysOld = 30) {
        try {
            const result = await query(`
                DELETE FROM ${this.tableName}
                WHERE created_at < CURRENT_DATE - INTERVAL '${daysOld} days'
                RETURNING COUNT(*) as deleted_count
            `);

            return parseInt(result.rows[0].deleted_count);
        } catch (error) {
            console.error('Error deleting old notifications:', error);
            throw error;
        }
    }
}

module.exports = new Notification();