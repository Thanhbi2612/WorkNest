// Define user roles
const ROLES = {
    ADMIN: 'admin',
    USER: 'user'
};

// Define permissions for each role
const PERMISSIONS = {
    // User permissions
    USER_READ_OWN: 'user:read:own',
    USER_UPDATE_OWN: 'user:update:own',
    USER_DELETE_OWN: 'user:delete:own',

    // Admin permissions
    ADMIN_READ_ALL: 'admin:read:all',
    ADMIN_CREATE: 'admin:create',
    ADMIN_UPDATE_ALL: 'admin:update:all',
    ADMIN_DELETE_ALL: 'admin:delete:all',

    // User management (admin only)
    USER_READ_ALL: 'user:read:all',
    USER_CREATE: 'user:create',
    USER_UPDATE_ALL: 'user:update:all',
    USER_DELETE_ALL: 'user:delete:all',
    USER_MANAGE_STATUS: 'user:manage:status',

    // System management (admin only)
    SYSTEM_HEALTH: 'system:health',
    SYSTEM_STATS: 'system:stats',
    SYSTEM_CLEANUP: 'system:cleanup',

    // Token management
    TOKEN_MANAGE_OWN: 'token:manage:own',
    TOKEN_MANAGE_ALL: 'token:manage:all'
};

// Role-permission mapping
const ROLE_PERMISSIONS = {
    [ROLES.USER]: [
        PERMISSIONS.USER_READ_OWN,
        PERMISSIONS.USER_UPDATE_OWN,
        PERMISSIONS.USER_DELETE_OWN,
        PERMISSIONS.TOKEN_MANAGE_OWN
    ],
    [ROLES.ADMIN]: [
        // Admin inherits all user permissions
        ...Object.values(PERMISSIONS)
    ]
};

// Check if role has permission
const hasPermission = (role, permission) => {
    const rolePermissions = ROLE_PERMISSIONS[role];
    return rolePermissions && rolePermissions.includes(permission);
};

// Check if user can access resource
const canAccessResource = (userRole, userId, resourceUserId, permission) => {
    // Admin can access everything
    if (userRole === ROLES.ADMIN) {
        return hasPermission(userRole, permission);
    }

    // User can only access their own resources
    if (userRole === ROLES.USER && userId === resourceUserId) {
        return hasPermission(userRole, permission);
    }

    return false;
};

// Get all permissions for a role
const getRolePermissions = (role) => {
    return ROLE_PERMISSIONS[role] || [];
};

// Check if role exists
const isValidRole = (role) => {
    return Object.values(ROLES).includes(role);
};

module.exports = {
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    hasPermission,
    canAccessResource,
    getRolePermissions,
    isValidRole
};