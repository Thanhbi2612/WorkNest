import api from './api';

class AuthService {
    // Universal login method that auto-detects user type
    async universalLogin(identifier, password) {
        // Strategy: Try user login first (since users are more common than admins)
        // If user login fails and backend suggests trying admin, then try admin login

        try {
            // Try user login first
            const userResponse = await api.post('/auth/user/login', {
                identifier,
                password,
            });

            // User login successful
            const data = userResponse.data.data;
            const tokens = data.tokens;
            const user = data.user;

            // Store tokens and user info
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
            localStorage.setItem('user', JSON.stringify({ ...user, userType: 'user' }));

            return { success: true, user, tokens };
        } catch (userError) {
            const userErrorData = userError.response?.data;

            // If user login fails and backend suggests trying admin
            if (userErrorData?.shouldTryAdmin) {
                try {
                    // Try admin login
                    const adminResponse = await api.post('/auth/admin/login', {
                        identifier,
                        password,
                    });

                    // Admin login successful
                    const data = adminResponse.data.data;
                    const tokens = data.tokens;
                    const admin = data.admin;

                    // Store tokens and admin info
                    localStorage.setItem('accessToken', tokens.accessToken);
                    localStorage.setItem('refreshToken', tokens.refreshToken);
                    localStorage.setItem('user', JSON.stringify({ ...admin, userType: 'admin' }));

                    return { success: true, user: admin, tokens };
                } catch (adminError) {
                    // Admin login also failed
                    const message = adminError.response?.data?.message || 'Login failed';
                    return { success: false, message };
                }
            }

            // User login failed and no suggestion to try admin (e.g., account deactivated, wrong password)
            const message = userErrorData?.message || 'Login failed';
            return { success: false, message };
        }
    }

    // Admin login
    async adminLogin(identifier, password) {
        return this.universalLogin(identifier, password);
    }

    // User login
    async userLogin(identifier, password) {
        return this.universalLogin(identifier, password);
    }

    // User registration
    async register(userData) {
        try {
            const response = await api.post('/users/register', userData);
            return { success: true, user: response.data.data.user };
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            const errors = error.response?.data?.errors || [];
            return { success: false, message, errors };
        }
    }

    // Logout
    async logout() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await api.post('/auth/logout', { refreshToken });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage regardless of API call success
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
    }

    // Logout from all devices
    async logoutAll() {
        try {
            await api.post('/auth/logout-all');
        } catch (error) {
            console.error('Logout all error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
    }

    // Get current user
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('accessToken');
        const user = this.getCurrentUser();
        return !!(token && user);
    }

    // Check if user is admin
    isAdmin() {
        const user = this.getCurrentUser();
        return user?.role === 'admin' || user?.userType === 'admin';
    }

    // Check if user is regular user
    isUser() {
        const user = this.getCurrentUser();
        return user?.role === 'user' || user?.userType === 'user';
    }

    // Get auth token
    getToken() {
        return localStorage.getItem('accessToken');
    }

    // Verify token
    async verifyToken() {
        try {
            const response = await api.get('/auth/verify');
            return { success: true, user: response.data.data.user };
        } catch (error) {
            return { success: false, message: 'Token verification failed' };
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await api.patch('/auth/change-password', {
                currentPassword,
                newPassword,
            });
            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.message || 'Password change failed';
            return { success: false, message };
        }
    }

    // Get user profile
    async getProfile() {
        try {
            const response = await api.get('/auth/profile');
            return { success: true, user: response.data.data.user };
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to fetch profile';
            return { success: false, message };
        }
    }

    // Google OAuth login
    async googleLogin(credential) {
        try {
            const response = await api.post('/auth/google', {
                credential,
            });

            const data = response.data.data;
            const tokens = data.tokens;
            const user = data.user;

            // Store tokens and user info
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
            localStorage.setItem('user', JSON.stringify({ ...user, userType: 'user' }));

            return { success: true, user, tokens };
        } catch (error) {
            const message = error.response?.data?.message || 'Google login failed';
            return { success: false, message };
        }
    }
}

export default new AuthService();