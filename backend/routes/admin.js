const express = require('express');
const router = express.Router();

const {
    getDashboardStats,
    cleanupTokens,
    getSystemHealth,
    getAdminsForDropdown
} = require('../controllers/adminController');

const {
    authenticateToken,
    requireAdmin,
    generalLimiter
} = require('../middleware');

// Public endpoint for chat (authenticated users only)
router.get('/dropdown', authenticateToken, generalLimiter, getAdminsForDropdown);

// All admin routes require admin authentication
router.use(requireAdmin);


// Dashboard and system management
/**
 * @swagger
 * /admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics (Admin only)
 *     description: Retrieve comprehensive statistics including users, tasks, admins, and tokens for admin dashboard
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Dashboard statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       $ref: '#/components/schemas/AdminDashboardStats'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/dashboard/stats', getDashboardStats);
router.post('/tokens/cleanup', cleanupTokens);
router.get('/system/health', getSystemHealth);

module.exports = router;