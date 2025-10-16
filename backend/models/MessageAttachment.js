// ================================================
// MESSAGE ATTACHMENT MODEL
// Quản lý file attachments (ảnh, documents) trong messages
// ================================================

const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class MessageAttachment extends BaseModel {
    constructor() {
        super('message_attachments');
    }

    /**
     * Tạo attachment mới
     * @param {Object} data - { messageId, filePath, fileName, fileSize, fileType }
     */
    async create(data) {
        const { messageId, filePath, fileName, fileSize, fileType } = data;

        // Validate required fields
        if (!messageId || !filePath || !fileName) {
            throw new Error('Message ID, file path, and file name are required');
        }

        const result = await query(
            `INSERT INTO message_attachments (message_id, file_path, file_name, file_size, file_type, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             RETURNING *`,
            [messageId, filePath, fileName, fileSize, fileType]
        );

        return result.rows[0];
    }

    /**
     * Tạo nhiều attachments cùng lúc (bulk insert)
     * @param {Array} attachments - [{ messageId, filePath, fileName, fileSize, fileType }]
     */
    async createMany(attachments) {
        if (!attachments || attachments.length === 0) {
            return [];
        }

        // Build values string: ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ...
        const values = [];
        const params = [];
        let paramIndex = 1;

        for (const attachment of attachments) {
            values.push(
                `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, NOW())`
            );
            params.push(
                attachment.messageId,
                attachment.filePath,
                attachment.fileName,
                attachment.fileSize || 0,
                attachment.fileType || 'application/octet-stream'
            );
            paramIndex += 5;
        }

        const sql = `
            INSERT INTO message_attachments (message_id, file_path, file_name, file_size, file_type, created_at)
            VALUES ${values.join(', ')}
            RETURNING *
        `;

        const result = await query(sql, params);
        return result.rows;
    }

    /**
     * Lấy attachments của một message
     * @param {Number} messageId
     */
    async getByMessageId(messageId) {
        const result = await query(
            `SELECT * FROM message_attachments
             WHERE message_id = $1
             ORDER BY created_at ASC`,
            [messageId]
        );

        return result.rows;
    }

    /**
     * Lấy attachments của nhiều messages (cho bulk query)
     * @param {Array} messageIds - Array of message IDs
     * @returns {Object} - Object với key là messageId, value là array of attachments
     */
    async getByMessageIds(messageIds) {
        if (!messageIds || messageIds.length === 0) {
            return {};
        }

        const result = await query(
            `SELECT * FROM message_attachments
             WHERE message_id = ANY($1::int[])
             ORDER BY message_id, created_at ASC`,
            [messageIds]
        );

        // Group attachments by message_id
        const grouped = {};
        for (const attachment of result.rows) {
            const msgId = attachment.message_id;
            if (!grouped[msgId]) {
                grouped[msgId] = [];
            }
            grouped[msgId].push(attachment);
        }

        return grouped;
    }

    /**
     * Lấy một attachment theo ID
     * @param {Number} attachmentId
     */
    async getById(attachmentId) {
        const result = await query(
            `SELECT * FROM message_attachments WHERE id = $1`,
            [attachmentId]
        );

        return result.rows[0] || null;
    }

    /**
     * Xóa attachment
     * @param {Number} attachmentId
     */
    async delete(attachmentId) {
        const result = await query(
            `DELETE FROM message_attachments
             WHERE id = $1
             RETURNING *`,
            [attachmentId]
        );

        return result.rows[0] || null;
    }

    /**
     * Xóa tất cả attachments của một message
     * @param {Number} messageId
     */
    async deleteByMessageId(messageId) {
        const result = await query(
            `DELETE FROM message_attachments
             WHERE message_id = $1
             RETURNING *`,
            [messageId]
        );

        return result.rows;
    }

    /**
     * Đếm số attachments của một message
     * @param {Number} messageId
     */
    async countByMessageId(messageId) {
        const result = await query(
            `SELECT COUNT(*)::integer as count
             FROM message_attachments
             WHERE message_id = $1`,
            [messageId]
        );

        return result.rows[0].count;
    }

    /**
     * Lấy tổng dung lượng attachments của một message
     * @param {Number} messageId
     */
    async getTotalSizeByMessageId(messageId) {
        const result = await query(
            `SELECT COALESCE(SUM(file_size), 0)::bigint as total_size
             FROM message_attachments
             WHERE message_id = $1`,
            [messageId]
        );

        return result.rows[0].total_size;
    }

    /**
     * Tìm attachments theo loại file (image, document, etc.)
     * @param {Number} messageId
     * @param {String} fileTypePattern - Pattern để match (ví dụ: 'image/%' cho tất cả ảnh)
     */
    async getByFileType(messageId, fileTypePattern) {
        const result = await query(
            `SELECT * FROM message_attachments
             WHERE message_id = $1
             AND file_type LIKE $2
             ORDER BY created_at ASC`,
            [messageId, fileTypePattern]
        );

        return result.rows;
    }
}

module.exports = new MessageAttachment();
