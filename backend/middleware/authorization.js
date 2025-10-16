const { hasPermission, canAccessResource, ROLES, PERMISSIONS } = require('../config/roles');
const { AppError } = require('./errorHandler');

// Check if user has specific permission
const requirePermission = (permission) => {
    return (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
            }

            if (!hasPermission(user.role, permission)) {
                throw new AppError(
                    `Permission denied. Required permission: ${permission}`,
                    403,
                    'INSUFFICIENT_PERMISSIONS'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Check if user can access specific resource
const requireResourceAccess = (permission, resourceUserIdParam = 'id') => {
    return (req, res, next) => {
        try {
            const user = req.user;
            const resourceUserId = parseInt(req.params[resourceUserIdParam]);

            if (!user) {
                throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
            }

            if (!canAccessResource(user.role, user.id, resourceUserId, permission)) {
                throw new AppError(
                    'Access denied. You can only access your own resources',
                    403,
                    'RESOURCE_ACCESS_DENIED'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Check if user is admin or accessing their own resource
const requireAdminOrOwner = (resourceUserIdParam = 'id') => {
    return (req, res, next) => {
        try {
            const user = req.user;
            const resourceUserId = parseInt(req.params[resourceUserIdParam]);

            if (!user) {
                throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
            }

            // Admin can access any resource
            if (user.role === ROLES.ADMIN) {
                return next();
            }

            // User can only access their own resource
            if (user.role === ROLES.USER && user.id === resourceUserId) {
                return next();
            }

            throw new AppError(
                'Access denied. Admin privileges or resource ownership required',
                403,
                'INSUFFICIENT_PERMISSIONS'
            );
        } catch (error) {
            next(error);
        }
    };
};

// Prevent users from escalating their own privileges
const preventSelfPrivilegeEscalation = (req, res, next) => {
    try {
        const user = req.user;
        const targetUserId = parseInt(req.params.id);

        // Prevent user from modifying their own role/permissions
        if (user.id === targetUserId && req.body.role) {
            throw new AppError(
                'You cannot modify your own role',
                403,
                'SELF_PRIVILEGE_ESCALATION_DENIED'
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Check if user can perform admin actions
const requireAdminAction = (action) => {
    return (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
            }

            if (user.role !== ROLES.ADMIN) {
                throw new AppError(
                    `Admin privileges required for action: ${action}`,
                    403,
                    'ADMIN_PRIVILEGES_REQUIRED'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Check multiple permissions (user must have ALL permissions)
const requireAllPermissions = (permissions) => {
    return (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
            }

            const missingPermissions = permissions.filter(
                permission => !hasPermission(user.role, permission)
            );

            if (missingPermissions.length > 0) {
                throw new AppError(
                    `Missing required permissions: ${missingPermissions.join(', ')}`,
                    403,
                    'INSUFFICIENT_PERMISSIONS'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Check multiple permissions (user must have ANY of the permissions)
const requireAnyPermission = (permissions) => {
    return (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
            }

            const hasAnyPermission = permissions.some(
                permission => hasPermission(user.role, permission)
            );

            if (!hasAnyPermission) {
                throw new AppError(
                    `One of these permissions is required: ${permissions.join(', ')}`,
                    403,
                    'INSUFFICIENT_PERMISSIONS'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Add user permissions to request object
const attachUserPermissions = (req, res, next) => {
    try {
        const user = req.user;

        if (user) {
            const { getRolePermissions } = require('../config/roles');
            req.userPermissions = getRolePermissions(user.role);
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    requirePermission,
    requireResourceAccess,
    requireAdminOrOwner,
    preventSelfPrivilegeEscalation,
    requireAdminAction,
    requireAllPermissions,
    requireAnyPermission,
    attachUserPermissions,
    PERMISSIONS,
    ROLES
};