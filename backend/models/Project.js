const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Project extends BaseModel {
    constructor() {
        super('projects');
    }

    async findByStatus(status, limit = 20, offset = 0) {
        try {
            const result = await query(
                `SELECT p.*, u.username as creator_username, u.first_name as creator_first_name, u.last_name as creator_last_name
                 FROM ${this.tableName} p
                 LEFT JOIN users u ON p.created_by = u.id
                 WHERE p.status = $1
                 ORDER BY p.created_at DESC
                 LIMIT $2 OFFSET $3`,
                [status, limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding projects by status:', error);
            throw error;
        }
    }

    async findAll(limit = 20, offset = 0) {
        try {
            const result = await query(
                `SELECT p.*, u.username as creator_username, u.first_name as creator_first_name, u.last_name as creator_last_name
                 FROM ${this.tableName} p
                 LEFT JOIN users u ON p.created_by = u.id
                 ORDER BY p.created_at DESC
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding all projects:', error);
            throw error;
        }
    }

    async getProjectsForDropdown() {
        try {
            const result = await query(
                `SELECT id, name, status
                 FROM ${this.tableName}
                 ORDER BY
                    CASE
                        WHEN status = 'active' THEN 0
                        WHEN status = 'completed' THEN 1
                        ELSE 2
                    END,
                    name`
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting projects for dropdown:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            const result = await query(
                `SELECT p.*, u.username as creator_username, u.first_name as creator_first_name, u.last_name as creator_last_name
                 FROM ${this.tableName} p
                 LEFT JOIN users u ON p.created_by = u.id
                 WHERE p.id = $1`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding project by id:', error);
            throw error;
        }
    }

    async count() {
        try {
            const result = await query(`SELECT COUNT(*) as count FROM ${this.tableName}`);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error counting projects:', error);
            throw error;
        }
    }

    async getAllWithTaskCount(limit = 20, offset = 0) {
        try {
            const result = await query(
                `SELECT
                    p.*,
                    u.username as creator_username,
                    u.first_name as creator_first_name,
                    u.last_name as creator_last_name,
                    COUNT(t.id) as task_count
                 FROM ${this.tableName} p
                 LEFT JOIN users u ON p.created_by = u.id
                 LEFT JOIN tasks t ON t.project_id = p.id
                 GROUP BY p.id, u.id
                 ORDER BY p.created_at DESC
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting projects with task count:', error);
            throw error;
        }
    }
}

module.exports = Project;