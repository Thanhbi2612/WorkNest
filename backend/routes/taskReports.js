const express = require('express');
const router = express.Router();

const {
    createReport,
    updateReport,
    submitReport,
    getTaskReports,
    getAllReports,
    getMyReports,
    deleteReport,
    markReportAsResolved,
    deleteResolvedReport
} = require('../controllers/taskReportController');

const {
    authenticateToken,
    requireAdmin,
    generalLimiter
} = require('../middleware');

const { uploadReport, handleUploadError } = require('../middleware/uploadReport');

/**
 * @swagger
 * components:
 *   schemas:
 *     TaskReport:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Report ID
 *           example: 1
 *         task_id:
 *           type: integer
 *           description: Task ID
 *           example: 5
 *         user_id:
 *           type: integer
 *           description: User ID who created the report
 *           example: 2
 *         description:
 *           type: string
 *           description: Report description
 *           example: "Đã hoàn thành task theo đúng yêu cầu"
 *         file_url:
 *           type: string
 *           description: File URL
 *           example: "/uploads/reports/report-1234567890.pdf"
 *         file_name:
 *           type: string
 *           description: Original file name
 *           example: "bao-cao-tuan.pdf"
 *         file_size:
 *           type: integer
 *           description: File size in bytes
 *           example: 1048576
 *         file_type:
 *           type: string
 *           description: File MIME type
 *           example: "application/pdf"
 *         status:
 *           type: string
 *           enum: [draft, submitted]
 *           description: Report status
 *           example: "submitted"
 *         submitted_at:
 *           type: string
 *           format: date-time
 *           description: Submission timestamp
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         task_title:
 *           type: string
 *           description: Task title (joined from tasks table)
 *           example: "Thiết kế giao diện trang chủ"
 *         username:
 *           type: string
 *           description: Username (joined from users table)
 *           example: "john_doe"
 *         first_name:
 *           type: string
 *           description: User first name
 *           example: "John"
 *         last_name:
 *           type: string
 *           description: User last name
 *           example: "Doe"
 */

// Protected routes - all routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/my-reports:
 *   get:
 *     summary: Lấy tất cả báo cáo của user hiện tại
 *     tags: [Task Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
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
 *                   example: "Your reports retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TaskReport'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *                         total_reports:
 *                           type: integer
 *                         reports_per_page:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/my-reports', generalLimiter, getMyReports);

/**
 * @swagger
 * /api/tasks/{taskId}/reports:
 *   post:
 *     summary: Tạo báo cáo mới cho task
 *     tags: [Task Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 description: Report description
 *                 example: "Đã hoàn thành task theo yêu cầu"
 *               report_file:
 *                 type: string
 *                 format: binary
 *                 description: Report file (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, TXT, ZIP, RAR - Max 10MB)
 *     responses:
 *       201:
 *         description: Report created successfully
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
 *                   example: "Report created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/TaskReport'
 *       400:
 *         description: Bad request (Task not completed, report already exists, etc.)
 *       403:
 *         description: Forbidden (Not assigned to task)
 *       404:
 *         description: Task not found
 */
router.post('/tasks/:taskId/reports', generalLimiter, uploadReport, handleUploadError, createReport);

/**
 * @swagger
 * /api/tasks/{taskId}/reports/{reportId}:
 *   put:
 *     summary: Cập nhật báo cáo (chỉ khi status = draft)
 *     tags: [Task Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Updated report description
 *               report_file:
 *                 type: string
 *                 format: binary
 *                 description: New report file (optional)
 *     responses:
 *       200:
 *         description: Report updated successfully
 *       400:
 *         description: Cannot update submitted report
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Report not found
 */
router.put('/tasks/:taskId/reports/:reportId', generalLimiter, uploadReport, handleUploadError, updateReport);

/**
 * @swagger
 * /api/tasks/{taskId}/reports/{reportId}/submit:
 *   post:
 *     summary: Gửi báo cáo (chuyển status từ draft -> submitted)
 *     tags: [Task Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report submitted successfully
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
 *                   example: "Report submitted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/TaskReport'
 *       400:
 *         description: Report already submitted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Report not found
 */
router.post('/tasks/:taskId/reports/:reportId/submit', generalLimiter, submitReport);

/**
 * @swagger
 * /api/tasks/{taskId}/reports:
 *   get:
 *     summary: Lấy báo cáo của task (User chỉ thấy của mình, Admin thấy tất cả)
 *     tags: [Task Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
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
 *                   example: "Reports retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TaskReport'
 *       404:
 *         description: Task not found
 */
router.get('/tasks/:taskId/reports', generalLimiter, getTaskReports);

/**
 * @swagger
 * /api/tasks/{taskId}/reports/{reportId}:
 *   delete:
 *     summary: Xóa báo cáo (chỉ khi status = draft)
 *     tags: [Task Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       400:
 *         description: Cannot delete submitted report
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Report not found
 */
router.delete('/tasks/:taskId/reports/:reportId', generalLimiter, deleteReport);

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Lấy tất cả báo cáo trong hệ thống (Admin only)
 *     tags: [Task Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted]
 *         description: Filter by status
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: task_id
 *         schema:
 *           type: integer
 *         description: Filter by task ID
 *       - in: query
 *         name: is_resolved
 *         schema:
 *           type: boolean
 *         description: Filter by resolved status
 *     responses:
 *       200:
 *         description: All reports retrieved successfully
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
 *                   example: "All reports retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TaskReport'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *                         total_reports:
 *                           type: integer
 *                         reports_per_page:
 *                           type: integer
 *       403:
 *         description: Forbidden (Admin only)
 */
router.get('/reports', requireAdmin, generalLimiter, getAllReports);

/**
 * @swagger
 * /api/reports/{id}/resolve:
 *   put:
 *     summary: Đánh dấu báo cáo đã xử lý (Admin only)
 *     tags: [Task Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report marked as resolved successfully
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
 *                   example: "Report marked as resolved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/TaskReport'
 *       400:
 *         description: Report already resolved
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Report not found
 */
router.put('/reports/:id/resolve', requireAdmin, generalLimiter, markReportAsResolved);

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Xóa báo cáo đã xử lý (Admin only)
 *     tags: [Task Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report deleted successfully
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
 *                   example: "Report deleted successfully"
 *       400:
 *         description: Cannot delete unresolved report
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Report not found
 */
router.delete('/reports/:id', requireAdmin, generalLimiter, deleteResolvedReport);

module.exports = router;
