const { TaskReport, Task, Notification, User, UserAdmin } = require('../models');
const { asyncHandler, AppError } = require('../middleware');
const path = require('path');
const fs = require('fs').promises;

// Tạo báo cáo mới (draft)
const createReport = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { description } = req.body;
    const userId = req.user.id;

    // Validate description
    if (!description || !description.trim()) {
        throw new AppError('Description is required', 400, 'DESCRIPTION_REQUIRED');
    }

    // Kiểm tra task có tồn tại không
    const task = await Task.findById(taskId);
    if (!task) {
        throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Kiểm tra task có được giao cho user này không
    if (task.assignee_id !== userId) {
        throw new AppError('You are not assigned to this task', 403, 'FORBIDDEN');
    }

    // Kiểm tra task đã hoàn thành chưa
    if (task.status !== 'completed') {
        throw new AppError('Task must be completed before creating report', 400, 'TASK_NOT_COMPLETED');
    }

    // Kiểm tra đã có báo cáo chưa
    const existingReport = await TaskReport.findByTaskAndUser(taskId, userId);
    if (existingReport) {
        throw new AppError('Report already exists for this task', 400, 'REPORT_EXISTS');
    }

    // Xử lý file upload (nếu có)
    let fileData = {};
    if (req.file) {
        fileData = {
            file_url: `/uploads/reports/${req.file.filename}`,
            file_name: req.file.originalname,
            file_size: req.file.size,
            file_type: req.file.mimetype
        };
    }

    // Tạo báo cáo
    const report = await TaskReport.create({
        task_id: taskId,
        user_id: userId,
        description: description.trim(),
        ...fileData
    });

    res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: {
            report
        }
    });
});

// Cập nhật báo cáo (chỉ khi draft)
const updateReport = asyncHandler(async (req, res) => {
    const { taskId, reportId } = req.params;
    const { description } = req.body;
    const userId = req.user.id;

    // Validate description
    if (!description || !description.trim()) {
        throw new AppError('Description is required', 400, 'DESCRIPTION_REQUIRED');
    }

    // Kiểm tra báo cáo có tồn tại không
    const report = await TaskReport.findById(reportId);
    if (!report) {
        throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }

    // Kiểm tra quyền sở hữu
    if (report.user_id !== userId) {
        throw new AppError('You are not authorized to update this report', 403, 'FORBIDDEN');
    }

    // Kiểm tra status
    if (report.status !== 'draft') {
        throw new AppError('Cannot update submitted report', 400, 'REPORT_ALREADY_SUBMITTED');
    }

    // Xử lý file upload mới (nếu có)
    let fileData = {};
    if (req.file) {
        // Xóa file cũ nếu có
        if (report.file_url) {
            const oldFilePath = path.join(__dirname, '..', report.file_url);
            try {
                await fs.unlink(oldFilePath);
            } catch (error) {
                console.error('Error deleting old file:', error);
            }
        }

        fileData = {
            file_url: `/uploads/reports/${req.file.filename}`,
            file_name: req.file.originalname,
            file_size: req.file.size,
            file_type: req.file.mimetype
        };
    }

    // Cập nhật báo cáo
    const updatedReport = await TaskReport.update(reportId, {
        description: description.trim(),
        ...fileData
    });

    if (!updatedReport) {
        throw new AppError('Failed to update report', 500, 'UPDATE_FAILED');
    }

    res.status(200).json({
        success: true,
        message: 'Report updated successfully',
        data: {
            report: updatedReport
        }
    });
});

// Gửi báo cáo (draft -> submitted)
const submitReport = asyncHandler(async (req, res) => {
    const { taskId, reportId } = req.params;
    const userId = req.user.id;

    // Kiểm tra báo cáo có tồn tại không
    const report = await TaskReport.findById(reportId);
    if (!report) {
        throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }

    // Kiểm tra quyền sở hữu
    if (report.user_id !== userId) {
        throw new AppError('You are not authorized to submit this report', 403, 'FORBIDDEN');
    }

    // Kiểm tra status
    if (report.status !== 'draft') {
        throw new AppError('Report already submitted', 400, 'REPORT_ALREADY_SUBMITTED');
    }

    // Kiểm tra báo cáo có đầy đủ nội dung không
    if (!report.description || !report.description.trim()) {
        throw new AppError('Report must have description before submitting', 400, 'DESCRIPTION_REQUIRED');
    }

    // Lấy thông tin task để tạo notification
    const task = await Task.findById(taskId);
    if (!task) {
        throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Gửi báo cáo
    const submittedReport = await TaskReport.submit(reportId);

    if (!submittedReport) {
        throw new AppError('Failed to submit report', 500, 'SUBMIT_FAILED');
    }

    // Tạo notification cho tất cả admin
    try {
        // Lấy danh sách admin từ bảng user_admin
        const admins = await UserAdmin.getAllActiveAdmins();

        console.log('📢 Found admins:', admins.length);

        // Lấy thông tin user hiện tại
        const currentUser = await User.findById(userId);
        const userName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'User';

        // Tạo notification cho mỗi admin
        for (const admin of admins) {
            const notification = await Notification.create({
                user_id: admin.id,
                task_id: parseInt(taskId),
                report_id: reportId,
                type: 'report_submitted',
                title: 'Báo cáo mới được gửi',
                message: `${userName} đã gửi báo cáo cho task: ${task.title}`
            });
            console.log('✅ Created notification for admin:', admin.id, notification);
        }
    } catch (error) {
        // Log error nhưng không fail request
        console.error('❌ Error creating notifications:', error);
    }

    res.status(200).json({
        success: true,
        message: 'Report submitted successfully',
        data: {
            report: submittedReport
        }
    });
});

// Lấy báo cáo của 1 task
const getTaskReports = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Kiểm tra task có tồn tại không
    const task = await Task.findById(taskId);
    if (!task) {
        throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Lấy tất cả báo cáo của task
    let reports = await TaskReport.findByTaskId(taskId);

    // Nếu không phải admin, chỉ trả về báo cáo của user
    if (!isAdmin) {
        reports = reports.filter(report => report.user_id === userId);
    }

    res.status(200).json({
        success: true,
        message: 'Reports retrieved successfully',
        data: {
            reports
        }
    });
});

// Lấy tất cả báo cáo (admin only)
const getAllReports = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, user_id, task_id, is_resolved } = req.query;
    const offset = (page - 1) * limit;

    const filters = {};
    if (status) filters.status = status;
    if (user_id) filters.user_id = parseInt(user_id);
    if (task_id) filters.task_id = parseInt(task_id);
    if (is_resolved !== undefined) {
        filters.is_resolved = is_resolved === 'true' || is_resolved === true;
    }

    const reports = await TaskReport.findAll(parseInt(limit), offset, filters);
    const totalReports = await TaskReport.count(filters);

    res.status(200).json({
        success: true,
        message: 'All reports retrieved successfully',
        data: {
            reports,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(totalReports / limit),
                total_reports: totalReports,
                reports_per_page: parseInt(limit)
            }
        }
    });
});

// Lấy tất cả báo cáo của user hiện tại
const getMyReports = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    const reports = await TaskReport.findByUserId(userId, parseInt(limit), offset);
    const totalReports = await TaskReport.count({ user_id: userId });

    res.status(200).json({
        success: true,
        message: 'Your reports retrieved successfully',
        data: {
            reports,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(totalReports / limit),
                total_reports: totalReports,
                reports_per_page: parseInt(limit)
            }
        }
    });
});

// Xóa báo cáo (chỉ khi draft) - User function
const deleteReport = asyncHandler(async (req, res) => {
    const { taskId, reportId } = req.params;
    const userId = req.user.id;

    // Kiểm tra báo cáo có tồn tại không
    const report = await TaskReport.findById(reportId);
    if (!report) {
        throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }

    // Kiểm tra quyền sở hữu
    if (report.user_id !== userId) {
        throw new AppError('You are not authorized to delete this report', 403, 'FORBIDDEN');
    }

    // Kiểm tra status
    if (report.status !== 'draft') {
        throw new AppError('Cannot delete submitted report', 400, 'REPORT_ALREADY_SUBMITTED');
    }

    // Xóa file nếu có
    if (report.file_url) {
        const filePath = path.join(__dirname, '..', report.file_url);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }

    // Xóa báo cáo
    const deletedReport = await TaskReport.deleteById(reportId);

    if (!deletedReport) {
        throw new AppError('Failed to delete report', 500, 'DELETE_FAILED');
    }

    res.status(200).json({
        success: true,
        message: 'Report deleted successfully',
        data: {
            report: deletedReport
        }
    });
});

// Đánh dấu báo cáo đã xử lý (admin only)
const markReportAsResolved = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;

    // Kiểm tra báo cáo có tồn tại không
    const report = await TaskReport.findById(id);
    if (!report) {
        throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }

    // Kiểm tra report đã resolved chưa
    if (report.is_resolved) {
        throw new AppError('Report already marked as resolved', 400, 'ALREADY_RESOLVED');
    }

    // Đánh dấu resolved
    const resolvedReport = await TaskReport.markAsResolved(id, adminId);

    if (!resolvedReport) {
        throw new AppError('Failed to mark report as resolved', 500, 'UPDATE_FAILED');
    }

    // ✅ CONFIRM TASK COMPLETION - Đánh dấu task đã được xác nhận hoàn thành
    try {
        await Task.confirmTaskCompletion(report.task_id, adminId);
        console.log(`✅ Task ${report.task_id} confirmed as completed by admin ${adminId}`);
    } catch (error) {
        console.error('⚠️ Error confirming task completion:', error);
        // Không throw error vì đã mark report thành công
    }

    res.status(200).json({
        success: true,
        message: 'Report marked as resolved successfully',
        data: {
            report: resolvedReport
        }
    });
});

// Xóa báo cáo đã xử lý (admin only)
const deleteResolvedReport = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Kiểm tra báo cáo có tồn tại không
    const report = await TaskReport.findById(id);
    if (!report) {
        throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }

    // Kiểm tra report đã resolved chưa
    if (!report.is_resolved) {
        throw new AppError('Cannot delete unresolved report. Please mark as resolved first.', 400, 'NOT_RESOLVED');
    }

    // Xóa file nếu có
    if (report.file_url) {
        const filePath = path.join(__dirname, '..', report.file_url);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }

    // Xóa báo cáo
    try {
        const deletedReport = await TaskReport.deleteReport(id);

        res.status(200).json({
            success: true,
            message: 'Report deleted successfully',
            data: {
                report: deletedReport
            }
        });
    } catch (error) {
        throw new AppError(error.message, 400, 'DELETE_FAILED');
    }
});

module.exports = {
    createReport,
    updateReport,
    submitReport,
    getTaskReports,
    getAllReports,
    getMyReports,
    deleteReport,
    markReportAsResolved,
    deleteResolvedReport
};
