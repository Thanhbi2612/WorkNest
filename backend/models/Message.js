// ================================================
// MESSAGE MODEL
// Quản lý messages trong conversations
// ================================================

const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Message extends BaseModel {
    constructor() {
        super('messages');
    }

    /**
     * Tạo message mới
     * @param {Object} data - { conversationId, senderId, senderType, messageText, messageType, fileUrl }
     */
    async create(data) {
        const {
            conversationId,
            senderId,
            senderType,
            messageText,
            messageType = 'text',
            fileUrl = null
        } = data;

        // Validate
        if (messageType === 'text' && (!messageText || messageText.trim().length === 0)) {
            throw new Error('Text message cannot be empty');
        }

        // NOTE: Bỏ validation fileUrl vì có thể dùng attachments thay thế
        // if ((messageType === 'file' || messageType === 'image') && !fileUrl) {
        //     throw new Error('File URL is required for file/image messages');
        // }

        const result = await query(
            `INSERT INTO messages (conversation_id, sender_id, sender_type, message_text, message_type, file_url, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING *`,
            [conversationId, senderId, senderType, messageText, messageType, fileUrl]
        );

        return result.rows[0];
    }

    /**
     * Lấy message theo ID (kèm thông tin sender)
     * @param {Number} messageId
     */
    async getById(messageId) {
        const result = await query(
            `SELECT
                m.id,
                m.conversation_id,
                m.sender_id,
                m.sender_type,
                m.message_text,
                m.message_type,
                m.file_url,
                m.created_at,
                m.is_edited,
                m.edited_at,
                CASE
                    WHEN m.sender_type = 'user' THEN u.username
                    WHEN m.sender_type = 'admin' THEN ua.username
                END as sender_username,
                CASE
                    WHEN m.sender_type = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
                    WHEN m.sender_type = 'admin' THEN ua.username
                END as sender_name,
                CASE
                    WHEN m.sender_type = 'user' THEN u.email
                    WHEN m.sender_type = 'admin' THEN ua.email
                END as sender_email
             FROM messages m
             LEFT JOIN users u ON m.sender_id = u.id AND m.sender_type = 'user'
             LEFT JOIN user_admin ua ON m.sender_id = ua.id AND m.sender_type = 'admin'
             WHERE m.id = $1`,
            [messageId]
        );

        return result.rows[0] || null;
    }

    /**
     * Lấy messages của một conversation (có phân trang)
     * @param {Number} conversationId
     * @param {Number} page - Default: 1
     * @param {Number} limit - Default: 50
     */
    async getByConversationId(conversationId, page = 1, limit = 50) {
        const offset = (page - 1) * limit;

        const result = await query(
            `SELECT
                m.id,
                m.conversation_id,
                m.sender_id,
                m.sender_type,
                m.message_text,
                m.message_type,
                m.file_url,
                m.created_at,
                m.is_edited,
                m.edited_at,
                CASE
                    WHEN m.sender_type = 'user' THEN u.username
                    WHEN m.sender_type = 'admin' THEN ua.username
                END as sender_username,
                CASE
                    WHEN m.sender_type = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
                    WHEN m.sender_type = 'admin' THEN ua.username
                END as sender_name,
                CASE
                    WHEN m.sender_type = 'user' THEN u.email
                    WHEN m.sender_type = 'admin' THEN ua.email
                END as sender_email,
                CASE
                    WHEN m.sender_type = 'user' THEN u.avatar_url
                    WHEN m.sender_type = 'admin' THEN ua.avatar_url
                END as sender_avatar_url
             FROM messages m
             LEFT JOIN users u ON m.sender_id = u.id AND m.sender_type = 'user'
             LEFT JOIN user_admin ua ON m.sender_id = ua.id AND m.sender_type = 'admin'
             WHERE m.conversation_id = $1
             ORDER BY m.created_at DESC
             LIMIT $2 OFFSET $3`,
            [conversationId, limit, offset]
        );

        // Get total count
        const countResult = await query(
            'SELECT COUNT(*) FROM messages WHERE conversation_id = $1',
            [conversationId]
        );

        const total = parseInt(countResult.rows[0].count);

        return {
            messages: result.rows.reverse(), // Reverse để newest ở cuối (chat UI convention)
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        };
    }

    /**
     * Update message (edit message)
     * @param {Number} messageId
     * @param {String} newText
     * @param {Number} senderId - Để verify quyền
     * @param {String} senderType
     */
    async updateMessage(messageId, newText, senderId, senderType) {
        // Verify sender
        const message = await this.getById(messageId);

        if (!message) {
            throw new Error('Message not found');
        }

        if (message.sender_id !== senderId || message.sender_type !== senderType) {
            throw new Error('You can only edit your own messages');
        }

        if (message.message_type !== 'text') {
            throw new Error('Can only edit text messages');
        }

        if (!newText || newText.trim().length === 0) {
            throw new Error('Message text cannot be empty');
        }

        const result = await query(
            `UPDATE messages
             SET message_text = $1,
                 is_edited = TRUE,
                 edited_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [newText, messageId]
        );

        return result.rows[0];
    }

    /**
     * Delete message
     * @param {Number} messageId
     * @param {Number} senderId - Để verify quyền
     * @param {String} senderType
     */
    async deleteMessage(messageId, senderId, senderType) {
        const fs = require('fs');
        const path = require('path');
        const MessageAttachment = require('./MessageAttachment');

        // Verify sender
        const message = await this.getById(messageId);

        if (!message) {
            throw new Error('Message not found');
        }

        if (message.sender_id !== senderId || message.sender_type !== senderType) {
            throw new Error('You can only delete your own messages');
        }

        // 1. Lấy danh sách attachments (nếu có)
        const attachments = await MessageAttachment.getByMessageId(messageId);

        // 2. Xóa files vật lý từ disk
        if (attachments && attachments.length > 0) {
            for (const attachment of attachments) {
                try {
                    // file_path format: /uploads/chat/filename.jpg
                    // Cần convert thành absolute path
                    const filePath = path.join(__dirname, '..', attachment.file_path);

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`Deleted file: ${filePath}`);
                    }
                } catch (error) {
                    console.error(`Error deleting file ${attachment.file_path}:`, error);
                    // Continue deleting other files even if one fails
                }
            }
        }

        // 3. Xóa old format file (nếu có file_url)
        if (message.file_url) {
            try {
                const filePath = path.join(__dirname, '..', message.file_url);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted old format file: ${filePath}`);
                }
            } catch (error) {
                console.error(`Error deleting old format file ${message.file_url}:`, error);
            }
        }

        // 4. Xóa attachment records từ DB
        if (attachments && attachments.length > 0) {
            await MessageAttachment.deleteByMessageId(messageId);
        }

        // 5. Xóa message từ DB
        await query('DELETE FROM messages WHERE id = $1', [messageId]);

        return { success: true, message: 'Message deleted' };
    }

    /**
     * Search messages trong conversation
     * @param {Number} conversationId
     * @param {String} searchTerm
     * @param {Number} limit
     */
    async searchMessages(conversationId, searchTerm, limit = 20) {
        const result = await query(
            `SELECT
                m.id,
                m.conversation_id,
                m.sender_id,
                m.sender_type,
                m.message_text,
                m.message_type,
                m.file_url,
                m.created_at,
                m.is_edited,
                m.edited_at,
                CASE
                    WHEN m.sender_type = 'user' THEN u.username
                    WHEN m.sender_type = 'admin' THEN ua.username
                END as sender_username,
                CASE
                    WHEN m.sender_type = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
                    WHEN m.sender_type = 'admin' THEN ua.username
                END as sender_name
             FROM messages m
             LEFT JOIN users u ON m.sender_id = u.id AND m.sender_type = 'user'
             LEFT JOIN user_admin ua ON m.sender_id = ua.id AND m.sender_type = 'admin'
             WHERE m.conversation_id = $1
             AND m.message_type = 'text'
             AND m.message_text ILIKE $2
             ORDER BY m.created_at DESC
             LIMIT $3`,
            [conversationId, `%${searchTerm}%`, limit]
        );

        return result.rows;
    }

    /**
     * Get unread count cho user trong conversation
     * @param {Number} conversationId
     * @param {Number} userId
     * @param {String} userType
     */
    async getUnreadCount(conversationId, userId, userType) {
        const result = await query(
            `SELECT COUNT(*)::integer as unread_count
             FROM messages m
             WHERE m.conversation_id = $1
             AND m.created_at > COALESCE(
                 (SELECT last_read_at FROM conversation_participants
                  WHERE conversation_id = $1
                  AND participant_id = $2
                  AND participant_type = $3),
                 '1970-01-01'
             )
             AND NOT (m.sender_id = $2 AND m.sender_type = $3)`,
            [conversationId, userId, userType]
        );

        return result.rows[0].unread_count;
    }
}

module.exports = new Message();
