import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Default settings
const DEFAULT_SETTINGS = {
    notifications: {
        enabled: true,
        types: {
            task_assigned: true,      // Khi có task mới được giao
            deadline_reminder: true,  // Khi task sắp đến hạn
            project_updated: true,    // Khi project có update
            task_completed: true,     // Khi task hoàn thành
            task_updated: true        // Khi task được cập nhật
        }
    },
    appearance: {
        mode: 'dark',                 // 'light' | 'dark'
        primaryColor: 'cyan',         // 'cyan' | 'purple' | 'blue' | 'green' | 'red'
        fontSize: 'normal'            // 'normal' | 'large'
    }
};

// Actions
const SETTINGS_ACTIONS = {
    LOAD_SETTINGS: 'LOAD_SETTINGS',
    UPDATE_NOTIFICATION_ENABLED: 'UPDATE_NOTIFICATION_ENABLED',
    UPDATE_NOTIFICATION_TYPE: 'UPDATE_NOTIFICATION_TYPE',
    UPDATE_THEME_MODE: 'UPDATE_THEME_MODE',
    UPDATE_PRIMARY_COLOR: 'UPDATE_PRIMARY_COLOR',
    UPDATE_FONT_SIZE: 'UPDATE_FONT_SIZE',
    RESET_SETTINGS: 'RESET_SETTINGS'
};

// Reducer
const settingsReducer = (state, action) => {
    switch (action.type) {
        case SETTINGS_ACTIONS.LOAD_SETTINGS:
            return {
                ...state,
                ...action.payload
            };

        case SETTINGS_ACTIONS.UPDATE_NOTIFICATION_ENABLED:
            return {
                ...state,
                notifications: {
                    ...state.notifications,
                    enabled: action.payload
                }
            };

        case SETTINGS_ACTIONS.UPDATE_NOTIFICATION_TYPE:
            return {
                ...state,
                notifications: {
                    ...state.notifications,
                    types: {
                        ...state.notifications.types,
                        [action.payload.type]: action.payload.enabled
                    }
                }
            };

        case SETTINGS_ACTIONS.UPDATE_THEME_MODE:
            return {
                ...state,
                appearance: {
                    ...state.appearance,
                    mode: action.payload
                }
            };

        case SETTINGS_ACTIONS.UPDATE_PRIMARY_COLOR:
            return {
                ...state,
                appearance: {
                    ...state.appearance,
                    primaryColor: action.payload
                }
            };

        case SETTINGS_ACTIONS.UPDATE_FONT_SIZE:
            return {
                ...state,
                appearance: {
                    ...state.appearance,
                    fontSize: action.payload
                }
            };

        case SETTINGS_ACTIONS.RESET_SETTINGS:
            return DEFAULT_SETTINGS;

        default:
            return state;
    }
};

// Create context
const SettingsContext = createContext();

// Settings provider component
export const SettingsProvider = ({ children }) => {
    const { user } = useAuth();
    const [settings, dispatch] = useReducer(settingsReducer, DEFAULT_SETTINGS);

    // Get storage key based on user ID
    const getStorageKey = () => {
        if (user && user.id) {
            return `app_settings_${user.id}`;
        }
        return 'app_settings_guest'; // Fallback for non-logged in users
    };

    // Load settings from localStorage when user changes
    useEffect(() => {
        try {
            const storageKey = getStorageKey();
            const savedSettings = localStorage.getItem(storageKey);
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                dispatch({
                    type: SETTINGS_ACTIONS.LOAD_SETTINGS,
                    payload: parsedSettings
                });
            } else {
                // Reset to default settings if no saved settings for this user
                dispatch({
                    type: SETTINGS_ACTIONS.LOAD_SETTINGS,
                    payload: DEFAULT_SETTINGS
                });
            }
        } catch (error) {
            console.error('Error loading settings from localStorage:', error);
        }
    }, [user?.id]); // Reload settings when user ID changes

    // Save settings to localStorage whenever they change
    useEffect(() => {
        try {
            const storageKey = getStorageKey();
            localStorage.setItem(storageKey, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings to localStorage:', error);
        }
    }, [settings, user?.id]); // Save with user-specific key

    // Toggle master notification switch
    const toggleNotifications = (enabled) => {
        dispatch({
            type: SETTINGS_ACTIONS.UPDATE_NOTIFICATION_ENABLED,
            payload: enabled
        });
    };

    // Toggle specific notification type
    const toggleNotificationType = (type, enabled) => {
        dispatch({
            type: SETTINGS_ACTIONS.UPDATE_NOTIFICATION_TYPE,
            payload: { type, enabled }
        });
    };

    // Reset all settings to default
    const resetSettings = () => {
        dispatch({
            type: SETTINGS_ACTIONS.RESET_SETTINGS
        });
    };

    // Check if a specific notification type should be shown
    const shouldShowNotification = (notificationType) => {
        // If notifications are disabled globally, don't show any
        if (!settings.notifications.enabled) {
            return false;
        }

        // Check if this specific type is enabled
        return settings.notifications.types[notificationType] !== false;
    };

    // Filter notifications based on settings
    const filterNotifications = (notifications) => {
        if (!settings.notifications.enabled) {
            return [];
        }

        return notifications.filter(notification =>
            shouldShowNotification(notification.type)
        );
    };

    // Set theme mode (light/dark)
    const setThemeMode = (mode) => {
        dispatch({
            type: SETTINGS_ACTIONS.UPDATE_THEME_MODE,
            payload: mode
        });
    };

    // Set primary color
    const setPrimaryColor = (color) => {
        dispatch({
            type: SETTINGS_ACTIONS.UPDATE_PRIMARY_COLOR,
            payload: color
        });
    };

    // Set font size
    const setFontSize = (size) => {
        dispatch({
            type: SETTINGS_ACTIONS.UPDATE_FONT_SIZE,
            payload: size
        });
    };

    const value = {
        settings,
        toggleNotifications,
        toggleNotificationType,
        resetSettings,
        shouldShowNotification,
        filterNotifications,
        setThemeMode,
        setPrimaryColor,
        setFontSize
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

// Custom hook to use settings context
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export default SettingsContext;
