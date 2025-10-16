const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

class UserAdmin extends BaseModel {
    constructor() {
        super('user_admin');
    }

    async findByUsername(username) {
        return this.findByField('username', username);
    }

    async findByEmail(email) {
        return this.findByField('email', email);
    }

    async findByUsernameOrEmail(identifier) {
        try {
            const result = await query(
                `SELECT * FROM ${this.tableName} WHERE username = $1 OR email = $1`,
                [identifier]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding admin by username or email:', error);
            throw error;
        }
    }

    async createAdmin(adminData) {
        try {
            const { username, email, password, role = 'admin' } = adminData;

            // Check if username already exists
            const existingUsername = await this.findByUsername(username);
            if (existingUsername) {
                throw new Error('Username already exists');
            }

            // Check if email already exists
            const existingEmail = await this.findByEmail(email);
            if (existingEmail) {
                throw new Error('Email already exists');
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create admin
            const newAdmin = await this.create({
                username,
                email,
                password_hash: hashedPassword,
                role,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            });

            // Remove password_hash from returned object
            const { password_hash, ...adminWithoutPassword } = newAdmin;
            return adminWithoutPassword;
        } catch (error) {
            console.error('Error creating admin:', error);
            throw error;
        }
    }

    async validatePassword(admin, password) {
        try {
            return await bcrypt.compare(password, admin.password_hash);
        } catch (error) {
            console.error('Error validating password:', error);
            throw error;
        }
    }

    async authenticate(identifier, password) {
        try {
            const admin = await this.findByUsernameOrEmail(identifier);

            if (!admin) {
                return { success: false, message: 'Admin not found' };
            }

            if (!admin.is_active) {
                return { success: false, message: 'Admin account is disabled' };
            }

            const isPasswordValid = await this.validatePassword(admin, password);

            if (!isPasswordValid) {
                return { success: false, message: 'Invalid password' };
            }

            // Remove password_hash from returned object
            const { password_hash, ...adminWithoutPassword } = admin;
            return {
                success: true,
                admin: adminWithoutPassword,
                message: 'Authentication successful'
            };
        } catch (error) {
            console.error('Error authenticating admin:', error);
            throw error;
        }
    }

    async updatePassword(adminId, newPassword) {
        try {
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            const updatedAdmin = await this.updateById(adminId, {
                password_hash: hashedPassword
            });

            if (updatedAdmin) {
                const { password_hash, ...adminWithoutPassword } = updatedAdmin;
                return adminWithoutPassword;
            }

            return null;
        } catch (error) {
            console.error('Error updating admin password:', error);
            throw error;
        }
    }

    async toggleActiveStatus(adminId) {
        try {
            const admin = await this.findById(adminId);
            if (!admin) {
                throw new Error('Admin not found');
            }

            const updatedAdmin = await this.updateById(adminId, {
                is_active: !admin.is_active
            });

            if (updatedAdmin) {
                const { password_hash, ...adminWithoutPassword } = updatedAdmin;
                return adminWithoutPassword;
            }

            return null;
        } catch (error) {
            console.error('Error toggling admin active status:', error);
            throw error;
        }
    }

    async getAllActiveAdmins() {
        try {
            const result = await query(
                `SELECT id, username, email, role, avatar_url, created_at, updated_at, is_active
                 FROM ${this.tableName}
                 WHERE is_active = true
                 ORDER BY created_at DESC`
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting active admins:', error);
            throw error;
        }
    }
}

module.exports = UserAdmin;