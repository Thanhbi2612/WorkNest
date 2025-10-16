import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

// Initial state
const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};

// Actions
const AUTH_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    CLEAR_ERROR: 'CLEAR_ERROR',
    UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
            };

        case AUTH_ACTIONS.LOGIN_SUCCESS:
            return {
                ...state,
                user: action.payload.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };

        case AUTH_ACTIONS.LOGIN_FAILURE:
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload.error,
            };

        case AUTH_ACTIONS.LOGOUT:
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            };

        case AUTH_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null,
            };

        case AUTH_ACTIONS.UPDATE_USER:
            return {
                ...state,
                user: action.payload.user,
                isAuthenticated: true, // Set authenticated when user is updated (for Google login)
            };

        default:
            return state;
    }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Initialize auth state on app load
    useEffect(() => {
        const initializeAuth = async () => {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

            try {
                const user = authService.getCurrentUser();
                const isAuthenticated = authService.isAuthenticated();

                if (isAuthenticated && user) {
                    // Verify token with server
                    const verification = await authService.verifyToken();

                    if (verification.success) {
                        dispatch({
                            type: AUTH_ACTIONS.LOGIN_SUCCESS,
                            payload: { user: verification.user },
                        });
                    } else {
                        // Token is invalid, clear local storage
                        await authService.logout();
                        dispatch({ type: AUTH_ACTIONS.LOGOUT });
                    }
                } else {
                    dispatch({ type: AUTH_ACTIONS.LOGOUT });
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                await authService.logout();
                dispatch({ type: AUTH_ACTIONS.LOGOUT });
            } finally {
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            }
        };

        initializeAuth();
    }, []);

    // Login function - Universal login that auto-detects admin/user
    const login = async (identifier, password) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

        try {
            const result = await authService.universalLogin(identifier, password);

            if (result.success) {
                dispatch({
                    type: AUTH_ACTIONS.LOGIN_SUCCESS,
                    payload: { user: result.user },
                });
                return { success: true };
            } else {
                dispatch({
                    type: AUTH_ACTIONS.LOGIN_FAILURE,
                    payload: { error: result.message },
                });
                return { success: false, message: result.message };
            }
        } catch (error) {
            const errorMessage = 'An unexpected error occurred';
            dispatch({
                type: AUTH_ACTIONS.LOGIN_FAILURE,
                payload: { error: errorMessage },
            });
            return { success: false, message: errorMessage };
        }
    };

    // Register function
    const register = async (userData) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

        try {
            const result = await authService.register(userData);

            if (result.success) {
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
                return { success: true, user: result.user };
            } else {
                dispatch({
                    type: AUTH_ACTIONS.LOGIN_FAILURE,
                    payload: { error: result.message },
                });
                return { success: false, message: result.message, errors: result.errors };
            }
        } catch (error) {
            const errorMessage = 'Registration failed';
            dispatch({
                type: AUTH_ACTIONS.LOGIN_FAILURE,
                payload: { error: errorMessage },
            });
            return { success: false, message: errorMessage };
        }
    };

    // Logout function
    const logout = async () => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
    };

    // Logout from all devices
    const logoutAll = async () => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        try {
            await authService.logoutAll();
        } catch (error) {
            console.error('Logout all error:', error);
        } finally {
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
    };

    // Clear error
    const clearError = () => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    };

    // Update user
    const updateUser = (user) => {
        // Update state
        dispatch({
            type: AUTH_ACTIONS.UPDATE_USER,
            payload: { user },
        });

        // Also update localStorage to persist across page refresh
        localStorage.setItem('user', JSON.stringify(user));
    };

    // Check if user is admin
    const isAdmin = () => {
        return state.user?.role === 'admin' || state.user?.userType === 'admin';
    };

    // Check if user is regular user
    const isUser = () => {
        return state.user?.role === 'user' || state.user?.userType === 'user';
    };

    const value = {
        ...state,
        login,
        register,
        logout,
        logoutAll,
        clearError,
        updateUser,
        setUser: updateUser, // Alias for updateUser
        isAdmin,
        isUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;