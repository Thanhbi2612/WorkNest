const express = require('express');
const router = express.Router();

const {
    createTask,
    getMyTasks,
    getTaskById,
    updateTask,
    deleteTask,
    updateTaskStatus,
    getMyDashboardStats,
    getAllTasks,
    downloadTaskFile,
    deleteConfirmedTask
} = require('../controllers/taskController');

const {
    authenticateToken,
    requireAdmin,
    generalLimiter
} = require('../middleware');

const upload = require('../config/upload');

// Protected routes - all routes require authentication
router.use(authenticateToken);

// User routes - get their own tasks
router.get('/my-tasks', generalLimiter, getMyTasks);

/**
 * @swagger
 * /tasks/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics for current user
 *     description: Retrieve task statistics for the currently authenticated user's assigned tasks
 *     tags: [Tasks - Dashboard]
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
 *                       $ref: '#/components/schemas/UserDashboardStats'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/dashboard/stats', generalLimiter, getMyDashboardStats);

// Download file route - must be before /:id to avoid route conflict
router.get('/:taskId/files/:fileId/download', downloadTaskFile);

router.get('/:id', getTaskById);
router.put('/:id/status', updateTaskStatus);

// Delete confirmed task (user can delete their own confirmed tasks)
router.delete('/:id/confirmed', generalLimiter, deleteConfirmedTask);

// Admin only routes

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Lấy tất cả tasks trong hệ thống (Admin only)
 *     tags: [Tasks - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [not_started, in_progress, completed, cancelled]
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
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
 *                   example: "Tasks retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           status:
 *                             type: string
 *                           priority:
 *                             type: string
 *                           start_date:
 *                             type: string
 *                             format: date
 *                           due_date:
 *                             type: string
 *                             format: date
 *                           project_id:
 *                             type: integer
 *                           project_name:
 *                             type: string
 *                           assigned_to:
 *                             type: integer
 *                           assignee_username:
 *                             type: string
 *                           assignee_first_name:
 *                             type: string
 *                           assignee_last_name:
 *                             type: string
 *                           created_by:
 *                             type: integer
 *                           creator_first_name:
 *                             type: string
 *                           creator_last_name:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *                         total_tasks:
 *                           type: integer
 *                         tasks_per_page:
 *                           type: integer
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/', requireAdmin, generalLimiter, getAllTasks);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Tạo task mới (Admin only)
 *     tags: [Tasks - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - assigned_to
 *               - start_date
 *               - due_date
 *             properties:
 *               title:
 *                 type: string
 *                 description: Task title
 *               description:
 *                 type: string
 *                 description: Task description
 *               assigned_to:
 *                 type: integer
 *                 description: User ID to assign task
 *               project_id:
 *                 type: integer
 *                 description: Project ID (optional)
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               start_date:
 *                 type: string
 *                 format: date
 *               due_date:
 *                 type: string
 *                 format: date
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Task files (max 5 files)
 *     responses:
 *       201:
 *         description: Task created successfully
 *       403:
 *         description: Forbidden - Admin only
 */
router.post('/', requireAdmin, generalLimiter, upload.array('files', 5), createTask);

router.put('/:id', requireAdmin, updateTask);
router.delete('/:id', requireAdmin, deleteTask);

module.exports = router;