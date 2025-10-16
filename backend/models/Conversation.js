// ================================================
// CONVERSATION MODEL
// Quản lý conversations (direct & group chat)
// ================================================

const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Conversation extends BaseModel {
    constructor() {
        super('conversations');
    }

    /**
     * Tạo conversation mới
     * @param {Object} data - { type, name (optional) }
     * @param {Array} participants - [{ participantId, participantType }]
     */
    async createConversation(data, participants) {
        const client = await query('BEGIN');

        try {
            // Validate
            if (data.type === 'group' && !data.name) {
                throw new Error('Group conversation must have a name');
            }

            if (data.type === 'direct' && participants.length !== 2) {
                throw new Error('Direct conversation must have exactly 2 participants');
            }

            // Tạo conversation
            const conversationResult = await query(
                `INSERT INTO conversations (type, name, created_at, updated_at)
                 VALUES ($1, $2, NOW(), NOW())
                 RETURNING *`,
                [data.type, data.name || null]
            );

            const conversation = conversationResult.rows[0];

            // Thêm participants
            for (const participant of participants) {
                await query(
                    `INSERT INTO conversation_participants (conversation_id, participant_id, participant_type, joined_at)
                     VALUES ($1, $2, $3, NOW())`,
                    [conversation.id, participant.participantId, participant.participantType]
                );
            }

            await query('COMMIT');

            return conversation;
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    }

    /**
     * Tìm hoặc tạo direct conversation giữa 2 người
     * @param {Number} user1Id
     * @param {String} user1Type - 'user' hoặc 'admin'
     * @param {Number} user2Id
     * @param {String} user2Type
     */
    async findOrCreateDirectConversation(user1Id, user1Type, user2Id, user2Type) {
        // Tìm conversation đã tồn tại
        const result = await query(
            `SELECT DISTINCT c.*
             FROM conversations c
             WHERE c.type = 'direct'
             AND EXISTS (
                 SELECT 1 FROM conversation_participants cp1
                 WHERE cp1.conversation_id = c.id
                 AND cp1.participant_id = $1
                 AND cp1.participant_type = $2
             )
             AND EXISTS (
                 SELECT 1 FROM conversation_participants cp2
                 WHERE cp2.conversation_id = c.id
                 AND cp2.participant_id = $3
                 AND cp2.participant_type = $4
             )
             AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2`,
            [user1Id, user1Type, user2Id, user2Type]
        );

        if (result.rows.length > 0) {
            return result.rows[0];
        }

        // Tạo mới nếu chưa tồn tại
        return await this.createConversation(
            { type: 'direct' },
            [
                { participantId: user1Id, participantType: user1Type },
                { participantId: user2Id, participantType: user2Type }
            ]
        );
    }

    /**
     * Lấy tất cả conversations của một user
     * @param {Number} userId
     * @param {String} userType - 'user' hoặc 'admin'
     */
    async getUserConversations(userId, userType) {
        const result = await query(
            `SELECT
                c.id,
                c.type,
                c.name,
                c.created_at,
                c.updated_at,
                (
                    SELECT json_agg(json_build_object(
                        'participantId', cp.participant_id,
                        'participantType', cp.participant_type,
                        'username', CASE
                            WHEN cp.participant_type = 'user' THEN u.username
                            WHEN cp.participant_type = 'admin' THEN ua.username
                        END,
                        'fullName', CASE
                            WHEN cp.participant_type = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
                            WHEN cp.participant_type = 'admin' THEN ua.username
                        END,
                        'email', CASE
                            WHEN cp.participant_type = 'user' THEN u.email
                            WHEN cp.participant_type = 'admin' THEN ua.email
                        END
                    ))
                    FROM conversation_participants cp
                    LEFT JOIN users u ON cp.participant_id = u.id AND cp.participant_type = 'user'
                    LEFT JOIN user_admin ua ON cp.participant_id = ua.id AND cp.participant_type = 'admin'
                    WHERE cp.conversation_id = c.id
                ) as participants,
                (
                    SELECT json_build_object(
                        'id', m.id,
                        'messageText', m.message_text,
                        'messageType', m.message_type,
                        'createdAt', m.created_at,
                        'senderName', CASE
                            WHEN m.sender_type = 'user' THEN u2.username
                            WHEN m.sender_type = 'admin' THEN ua2.username
                        END
                    )
                    FROM messages m
                    LEFT JOIN users u2 ON m.sender_id = u2.id AND m.sender_type = 'user'
                    LEFT JOIN user_admin ua2 ON m.sender_id = ua2.id AND m.sender_type = 'admin'
                    WHERE m.conversation_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ) as last_message,
                (
                    SELECT COUNT(*)
                    FROM messages m
                    WHERE m.conversation_id = c.id
                    AND m.created_at > COALESCE(
                        (SELECT last_read_at FROM conversation_participants
                         WHERE conversation_id = c.id
                         AND participant_id = $1
                         AND participant_type = $2),
                        '1970-01-01'
                    )
                    AND NOT (m.sender_id = $1 AND m.sender_type = $2)
                )::integer as unread_count
             FROM conversations c
             WHERE EXISTS (
                 SELECT 1 FROM conversation_participants cp
                 WHERE cp.conversation_id = c.id
                 AND cp.participant_id = $1
                 AND cp.participant_type = $2
             )
             ORDER BY c.updated_at DESC`,
            [userId, userType]
        );

        return result.rows;
    }

    /**
     * Lấy chi tiết một conversation
     * @param {Number} conversationId
     */
    async getConversationById(conversationId) {
        const result = await query(
            `SELECT
                c.id,
                c.type,
                c.name,
                c.created_at,
                c.updated_at,
                (
                    SELECT json_agg(json_build_object(
                        'participantId', cp.participant_id,
                        'participantType', cp.participant_type,
                        'username', CASE
                            WHEN cp.participant_type = 'user' THEN u.username
                            WHEN cp.participant_type = 'admin' THEN ua.username
                        END,
                        'fullName', CASE
                            WHEN cp.participant_type = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
                            WHEN cp.participant_type = 'admin' THEN ua.username
                        END,
                        'email', CASE
                            WHEN cp.participant_type = 'user' THEN u.email
                            WHEN cp.participant_type = 'admin' THEN ua.email
                        END
                    ))
                    FROM conversation_participants cp
                    LEFT JOIN users u ON cp.participant_id = u.id AND cp.participant_type = 'user'
                    LEFT JOIN user_admin ua ON cp.participant_id = ua.id AND cp.participant_type = 'admin'
                    WHERE cp.conversation_id = c.id
                ) as participants
             FROM conversations c
             WHERE c.id = $1`,
            [conversationId]
        );

        return result.rows[0] || null;
    }

    /**
     * Kiểm tra user có phải participant của conversation không
     * @param {Number} conversationId
     * @param {Number} userId
     * @param {String} userType
     */
    async isParticipant(conversationId, userId, userType) {
        const result = await query(
            `SELECT 1 FROM conversation_participants
             WHERE conversation_id = $1
             AND participant_id = $2
             AND participant_type = $3`,
            [conversationId, userId, userType]
        );

        return result.rows.length > 0;
    }

    /**
     * Update last_read_at cho participant
     * @param {Number} conversationId
     * @param {Number} userId
     * @param {String} userType
     */
    async updateLastRead(conversationId, userId, userType) {
        await query(
            `UPDATE conversation_participants
             SET last_read_at = NOW()
             WHERE conversation_id = $1
             AND participant_id = $2
             AND participant_type = $3`,
            [conversationId, userId, userType]
        );
    }

    /**
     * Thêm participant vào group conversation
     * @param {Number} conversationId
     * @param {Number} userId
     * @param {String} userType
     */
    async addParticipant(conversationId, userId, userType) {
        // Kiểm tra conversation có phải group không
        const conversation = await this.getConversationById(conversationId);
        if (!conversation || conversation.type !== 'group') {
            throw new Error('Can only add participants to group conversations');
        }

        // Thêm participant
        await query(
            `INSERT INTO conversation_participants (conversation_id, participant_id, participant_type, joined_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (conversation_id, participant_id, participant_type) DO NOTHING`,
            [conversationId, userId, userType]
        );
    }

    /**
     * Xóa participant khỏi group conversation
     * @param {Number} conversationId
     * @param {Number} userId
     * @param {String} userType
     */
    async removeParticipant(conversationId, userId, userType) {
        await query(
            `DELETE FROM conversation_participants
             WHERE conversation_id = $1
             AND participant_id = $2
             AND participant_type = $3`,
            [conversationId, userId, userType]
        );
    }
}

module.exports = new Conversation();
