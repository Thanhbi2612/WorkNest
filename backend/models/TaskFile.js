const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class TaskFile extends BaseModel {
    constructor() {
        super('task_files');
    }

    // Tạo file mới cho task
    async createTaskFile(taskId, fileData) {
        try {
            const { file_name, file_path, file_size, file_type } = fileData;

            const result = await query(`
                INSERT INTO ${this.tableName}
                (task_id, file_name, file_path, file_size, file_type, uploaded_at)
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                RETURNING *
            `, [taskId, file_name, file_path, file_size, file_type]);

            return result.rows[0];
        } catch (error) {
            console.error('Error creating task file:', error);
            throw error;
        }
    }

    // Tạo nhiều files cho task cùng lúc
    async createMultipleTaskFiles(taskId, filesData) {
        try {
            const files = [];

            for (const fileData of filesData) {
                const file = await this.createTaskFile(taskId, fileData);
                files.push(file);
            }

            return files;
        } catch (error) {
            console.error('Error creating multiple task files:', error);
            throw error;
        }
    }

    // Lấy tất cả files của 1 task
    async getFilesByTaskId(taskId) {
        try {
            const result = await query(`
                SELECT * FROM ${this.tableName}
                WHERE task_id = $1
                ORDER BY uploaded_at ASC
            `, [taskId]);

            return result.rows;
        } catch (error) {
            console.error('Error getting files by task id:', error);
            throw error;
        }
    }

    // Lấy 1 file theo ID
    async getFileById(fileId) {
        try {
            const result = await query(`
                SELECT * FROM ${this.tableName}
                WHERE id = $1
            `, [fileId]);

            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting file by id:', error);
            throw error;
        }
    }

    // Xóa file theo ID
    async deleteFileById(fileId) {
        try {
            const result = await query(`
                DELETE FROM ${this.tableName}
                WHERE id = $1
                RETURNING *
            `, [fileId]);

            return result.rows[0] || null;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    // Xóa tất cả files của 1 task
    async deleteFilesByTaskId(taskId) {
        try {
            const result = await query(`
                DELETE FROM ${this.tableName}
                WHERE task_id = $1
                RETURNING *
            `, [taskId]);

            return result.rows;
        } catch (error) {
            console.error('Error deleting files by task id:', error);
            throw error;
        }
    }
}

module.exports = new TaskFile();
