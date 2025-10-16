const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

class User extends BaseModel {
    constructor() {
        super('users');
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
            console.error('Error finding user by username or email:', error);
            throw error;
        }
    }

    async findByIdWithPassword(userId) {
        try {
            const result = await query(
                `SELECT * FROM ${this.tableName} WHERE id = $1`,
                [userId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding user by ID with password:', error);
            throw error;
        }
    }

    async createUser(userData) {
        try {
            const {
                username,
                email,
                password,
                first_name,
                last_name,
                role = 'user'
            } = userData;

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

            // Create user
            const newUser = await this.create({
                username,
                email,
                password_hash: hashedPassword,
                first_name,
                last_name,
                role,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            });

            // Remove password_hash from returned object
            const { password_hash, ...userWithoutPassword } = newUser;
            return userWithoutPassword;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async validatePassword(user, password) {
        try {
            return await bcrypt.compare(password, user.password_hash);
        } catch (error) {
            console.error('Error validating password:', error);
            throw error;
        }
    }

    async authenticate(identifier, password) {
        try {
            const user = await this.findByUsernameOrEmail(identifier);

            if (!user) {
                return { success: false, message: 'User not found' };
            }

            if (!user.is_active) {
                return { success: false, message: 'User account is disabled' };
            }

            const isPasswordValid = await this.validatePassword(user, password);

            if (!isPasswordValid) {
                return { success: false, message: 'Invalid password' };
            }

            // Remove password_hash from returned object
            const { password_hash, ...userWithoutPassword } = user;
            return {
                success: true,
                user: userWithoutPassword,
                message: 'Authentication successful'
            };
        } catch (error) {
            console.error('Error authenticating user:', error);
            throw error;
        }
    }

    async updateProfile(userId, profileData) {
        try {
            const { username, email, first_name, last_name } = profileData;
            const updateData = {};

            if (username) {
                // Check if new username already exists (excluding current user)
                const existingUser = await this.findByUsername(username);
                if (existingUser && existingUser.id !== userId) {
                    throw new Error('Username already exists');
                }
                updateData.username = username;
            }

            if (email) {
                // Check if new email already exists (excluding current user)
                const existingUser = await this.findByEmail(email);
                if (existingUser && existingUser.id !== userId) {
                    throw new Error('Email already exists');
                }
                updateData.email = email;
            }

            if (first_name) updateData.first_name = first_name;
            if (last_name) updateData.last_name = last_name;

            const updatedUser = await this.updateById(userId, updateData);

            if (updatedUser) {
                const { password_hash, ...userWithoutPassword } = updatedUser;
                return userWithoutPassword;
            }

            return null;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    async updatePassword(userId, newPassword) {
        try {
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            const updatedUser = await this.updateById(userId, {
                password_hash: hashedPassword
            });

            if (updatedUser) {
                const { password_hash, ...userWithoutPassword } = updatedUser;
                return userWithoutPassword;
            }

            return null;
        } catch (error) {
            console.error('Error updating user password:', error);
            throw error;
        }
    }

    async toggleActiveStatus(userId) {
        try {
            const user = await this.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const updatedUser = await this.updateById(userId, {
                is_active: !user.is_active
            });

            if (updatedUser) {
                const { password_hash, ...userWithoutPassword } = updatedUser;
                return userWithoutPassword;
            }

            return null;
        } catch (error) {
            console.error('Error toggling user active status:', error);
            throw error;
        }
    }

    async getAllActiveUsers() {
        try {
            const result = await query(
                `SELECT id, username, email, first_name, last_name, role, created_at, updated_at, is_active
                 FROM ${this.tableName}
                 WHERE is_active = true
                 ORDER BY created_at DESC`
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting active users:', error);
            throw error;
        }
    }

    async searchUsers(searchTerm, limit = 20, offset = 0) {
        try {
            const result = await query(
                `SELECT id, username, email, first_name, last_name, role, created_at, updated_at, is_active
                 FROM ${this.tableName}
                 WHERE (username ILIKE $1 OR email ILIKE $1 OR
                        first_name ILIKE $1 OR last_name ILIKE $1)
                 ORDER BY created_at DESC
                 LIMIT $2 OFFSET $3`,
                [`%${searchTerm}%`, limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    }

    async getUsersForDropdown() {
        try {
            const result = await query(
                `SELECT
                    id,
                    username,
                    first_name,
                    avatar_url,
                    CASE
                        WHEN first_name IS NOT NULL AND last_name IS NOT NULL
                        THEN first_name || ' ' || last_name
                        WHEN first_name IS NOT NULL
                        THEN first_name
                        ELSE username
                    END as full_name
                 FROM ${this.tableName}
                 WHERE is_active = true
                 ORDER BY username`
            );

            return result.rows;
        } catch (error) {
            console.error('Error getting users for dropdown:', error);
            throw error;
        }
    }

    async getUserStats() {
        try {
            const result = await query(`
                SELECT
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
                    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users,
                    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30_days
                FROM ${this.tableName}
            `);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }

    // Google OAuth Methods
    async findByGoogleId(googleId) {
        try {
            const result = await query(
                `SELECT * FROM ${this.tableName} WHERE google_id = $1`,
                [googleId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding user by Google ID:', error);
            throw error;
        }
    }

    async createGoogleUser(googleData) {
        try {
            const {
                googleId,
                email,
                givenName,
                familyName,
                picture
            } = googleData;

            // Check if email already exists
            const existingEmail = await this.findByEmail(email);
            if (existingEmail) {
                // If user exists with this email, link Google account
                if (!existingEmail.google_id) {
                    const updatedUser = await this.updateById(existingEmail.id, {
                        google_id: googleId,
                        avatar_url: picture,
                        auth_provider: 'google'
                    });
                    const { password_hash, ...userWithoutPassword } = updatedUser;
                    return userWithoutPassword;
                }
                throw new Error('Email already exists');
            }

            // Generate username from email
            const baseUsername = email.split('@')[0];
            let username = baseUsername;
            let counter = 1;

            // Check if username exists, add number if it does
            while (await this.findByUsername(username)) {
                username = `${baseUsername}${counter}`;
                counter++;
            }

            // Create new user
            const newUser = await this.create({
                username,
                email,
                first_name: givenName,
                last_name: familyName,
                google_id: googleId,
                avatar_url: picture,
                auth_provider: 'google',
                password_hash: null,
                role: 'user',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            });

            // Remove password_hash from returned object
            const { password_hash, ...userWithoutPassword } = newUser;
            return userWithoutPassword;
        } catch (error) {
            console.error('Error creating Google user:', error);
            throw error;
        }
    }

    async findOrCreateGoogleUser(googleData) {
        try {
            // Try to find user by Google ID first
            let user = await this.findByGoogleId(googleData.googleId);

            if (user) {
                // User exists, update avatar if changed
                if (user.avatar_url !== googleData.picture) {
                    user = await this.updateById(user.id, {
                        avatar_url: googleData.picture,
                        updated_at: new Date()
                    });
                }
                const { password_hash, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }

            // User doesn't exist, create new one
            return await this.createGoogleUser(googleData);
        } catch (error) {
            console.error('Error finding or creating Google user:', error);
            throw error;
        }
    }
}

module.exports = User;