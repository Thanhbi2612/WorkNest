const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class RefreshToken extends BaseModel {
    constructor() {
        super('refresh_tokens');
    }

    async createRefreshToken(tokenData) {
        try {
            const { user_id, token, user_type, expires_at } = tokenData;

            // First, revoke any existing refresh tokens for this user
            await this.revokeUserTokens(user_id, user_type);

            // Create new refresh token
            const newToken = await this.create({
                user_id,
                token,
                user_type,
                expires_at,
                is_revoked: false,
                created_at: new Date(),
                updated_at: new Date()
            });

            return newToken;
        } catch (error) {
            console.error('Error creating refresh token:', error);
            throw error;
        }
    }

    async findByToken(token) {
        try {
            const result = await query(
                `SELECT * FROM ${this.tableName}
                 WHERE token = $1 AND is_revoked = false AND expires_at > NOW()`,
                [token]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding refresh token:', error);
            throw error;
        }
    }

    async revokeToken(token) {
        try {
            const result = await query(
                `UPDATE ${this.tableName}
                 SET is_revoked = true, updated_at = NOW()
                 WHERE token = $1
                 RETURNING *`,
                [token]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error revoking refresh token:', error);
            throw error;
        }
    }

    async revokeUserTokens(userId, userType) {
        try {
            const result = await query(
                `UPDATE ${this.tableName}
                 SET is_revoked = true, updated_at = NOW()
                 WHERE user_id = $1 AND user_type = $2 AND is_revoked = false
                 RETURNING *`,
                [userId, userType]
            );
            return result.rows;
        } catch (error) {
            console.error('Error revoking user tokens:', error);
            throw error;
        }
    }

    async cleanupExpiredTokens() {
        try {
            const result = await query(
                `DELETE FROM ${this.tableName}
                 WHERE expires_at <= NOW() OR is_revoked = true`,
                []
            );
            console.log(`Cleaned up ${result.rowCount} expired/revoked refresh tokens`);
            return result.rowCount;
        } catch (error) {
            console.error('Error cleaning up expired tokens:', error);
            throw error;
        }
    }

    async getUserActiveTokens(userId, userType) {
        try {
            const result = await query(
                `SELECT * FROM ${this.tableName}
                 WHERE user_id = $1 AND user_type = $2
                 AND is_revoked = false AND expires_at > NOW()
                 ORDER BY created_at DESC`,
                [userId, userType]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting user active tokens:', error);
            throw error;
        }
    }

    async getTokenStats() {
        try {
            const result = await query(`
                SELECT
                    COUNT(*) as total_tokens,
                    COUNT(CASE WHEN is_revoked = false AND expires_at > NOW() THEN 1 END) as active_tokens,
                    COUNT(CASE WHEN is_revoked = true THEN 1 END) as revoked_tokens,
                    COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_tokens,
                    COUNT(CASE WHEN user_type = 'admin' THEN 1 END) as admin_tokens,
                    COUNT(CASE WHEN user_type = 'user' THEN 1 END) as user_tokens
                FROM ${this.tableName}
            `);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting token stats:', error);
            throw error;
        }
    }
}

module.exports = RefreshToken;