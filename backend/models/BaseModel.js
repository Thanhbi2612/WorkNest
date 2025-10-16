const { query } = require('../config/database');

class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
    }

    async findById(id) {
        try {
            const result = await query(
                `SELECT * FROM ${this.tableName} WHERE id = $1`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error(`Error finding ${this.tableName} by id:`, error);
            throw error;
        }
    }

    async findByField(field, value) {
        try {
            const result = await query(
                `SELECT * FROM ${this.tableName} WHERE ${field} = $1`,
                [value]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error(`Error finding ${this.tableName} by ${field}:`, error);
            throw error;
        }
    }

    async findAll(limit = null, offset = 0) {
        try {
            let queryText = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`;
            const params = [];

            if (limit) {
                queryText += ` LIMIT $1 OFFSET $2`;
                params.push(limit, offset);
            }

            const result = await query(queryText, params);
            return result.rows;
        } catch (error) {
            console.error(`Error finding all ${this.tableName}:`, error);
            throw error;
        }
    }

    async create(data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, index) => `$${index + 1}`);

            const queryText = `
                INSERT INTO ${this.tableName} (${fields.join(', ')})
                VALUES (${placeholders.join(', ')})
                RETURNING *
            `;

            const result = await query(queryText, values);
            return result.rows[0];
        } catch (error) {
            console.error(`Error creating ${this.tableName}:`, error);
            throw error;
        }
    }

    async updateById(id, data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const setClause = fields.map((field, index) => `${field} = $${index + 2}`);

            const queryText = `
                UPDATE ${this.tableName}
                SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;

            const result = await query(queryText, [id, ...values]);
            return result.rows[0] || null;
        } catch (error) {
            console.error(`Error updating ${this.tableName}:`, error);
            throw error;
        }
    }

    async deleteById(id) {
        try {
            const result = await query(
                `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error(`Error deleting ${this.tableName}:`, error);
            throw error;
        }
    }

    async count() {
        try {
            const result = await query(`SELECT COUNT(*) FROM ${this.tableName}`);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error(`Error counting ${this.tableName}:`, error);
            throw error;
        }
    }
}

module.exports = BaseModel;