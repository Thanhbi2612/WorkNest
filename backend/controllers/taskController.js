const { Task, Notification, User, TaskFile } = require('../models');
const { asyncHandler, AppError } = require('../middleware');

// Create new task (admin only)
const createTask = asyncHandler(async (req, res) => {
    console.log(' Backend - req.files:', req.files);
    console.log(' Backend - req.body:', req.body);

    let {
        title,
        description,
        assignee_id,
        watcher_id,
        project_id,
        start_date,
        due_date,
        priority = 'medium',
        status = 'not_started'
    } = req.body;

    const creator_id = req.user.id;

    // Validation
    if (!title || !title.trim()) {
        throw new AppError('Task title is required', 400, 'VALIDATION_ERROR');
    }
    if (title.trim().length > 255) {
        throw new AppError('Task title must not exceed 255 characters', 400, 'VALIDATION_ERROR');
    }
    if (!assignee_id) {
        throw new AppError('Assignee is required', 400, 'VALIDATION_ERROR');
    }
    if (!due_date) {
        throw new AppError('Due date is required', 400, 'VALIDATION_ERROR');
    }

    // Validate date format và logic
    const dueDateObj = new Date(due_date);
    if (isNaN(dueDateObj.getTime())) {
        throw new AppError('Invalid due date format', 400, 'VALIDATION_ERROR');
    }

    // Check if due date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDateObj < today) {
        throw new AppError('Due date cannot be in the past', 400, 'VALIDATION_ERROR');
    }

    // Validate start_date if provided
    if (start_date) {
        const startDateObj = new Date(start_date);
        if (isNaN(startDateObj.getTime())) {
            throw new AppError('Invalid start date format', 400, 'VALIDATION_ERROR');
        }
        if (startDateObj > dueDateObj) {
            throw new AppError('Start date cannot be after due date', 400, 'VALIDATION_ERROR');
        }
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
        throw new AppError('Invalid priority value', 400, 'VALIDATION_ERROR');
    }

    // Validate status
    const validStatuses = ['not_started', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new AppError('Invalid status value', 400, 'VALIDATION_ERROR');
    }

    // Validate assignee exists
    const assignee = await User.findById(assignee_id);
    if (!assignee) {
        throw new AppError('Assignee not found', 404, 'USER_NOT_FOUND');
    }

    // Validate watcher exists if provided
    if (watcher_id) {
        const watcher = await User.findById(watcher_id);
        if (!watcher) {
            throw new AppError('Watcher not found', 404, 'USER_NOT_FOUND');
        }
    }

    // Create task
    const newTask = await Task.create({
        title: title.trim(),
        description: description ? description.trim() : null,
        assignee_id,
        watcher_id: watcher_id || null,
        creator_id,
        project_id: project_id || null,
        start_date: start_date || new Date().toISOString().split('T')[0],
        due_date,
        priority,
        status
    });

    // Lưu files nếu có upload
    if (req.files && req.files.length > 0) {
        const filesData = req.files.map(file => ({
            file_name: file.originalname,
            file_path: file.path,
            file_size: file.size,
            file_type: file.mimetype
        }));

        await TaskFile.createMultipleTaskFiles(newTask.id, filesData);
    }

    // Create notification for assignee (không tạo nếu assignee là admin)
    const assigneeUser = await User.findById(assignee_id);
    if (assigneeUser && assigneeUser.role !== 'admin') {
        await Notification.create({
            user_id: assignee_id,
            task_id: newTask.id,
            type: 'task_assigned',
            title: 'Bạn được giao task mới',
            message: `Task "${title}" đã được giao cho bạn`
        });
    }

    // Create notification for watcher if exists (không tạo nếu watcher là admin)
    if (watcher_id && watcher_id !== assignee_id) {
        const watcherUser = await User.findById(watcher_id);
        if (watcherUser && watcherUser.role !== 'admin') {
            await Notification.create({
                user_id: watcher_id,
                task_id: newTask.id,
                type: 'task_assigned',
                title: 'Bạn được theo dõi task mới',
                message: `Bạn được thêm vào theo dõi task "${title}"`
            });
        }
    }

    // Get complete task info
    const taskWithDetails = await Task.getTaskWithDetails(newTask.id);

    res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: {
            task: taskWithDetails
        }
    });
});

// Get tasks assigned to current user (SỬ DỤNG METHOD MỚI findWithPagination)
const getMyTasks = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
        status,
        priority,
        project_id,
        page = 1,
        limit = 6,  // Mặc định 6 tasks/trang theo yêu cầu
        sort = 'created_at',
        order = 'desc',
        search,
        overdue,
        today,
        upcoming
    } = req.query;

    // Build filters
    const filters = {
        assignee_id: userId,  // Chỉ lấy tasks của user hiện tại
        status,
        priority,
        project_id,
        sort,
        order,
        search,
        overdue,
        today,
        upcoming
    };

    // Sử dụng method mới findWithPagination
    const result = await Task.findWithPagination(
        parseInt(page),
        parseInt(limit),
        filters
    );

    res.status(200).json({
        success: true,
        message: 'My tasks retrieved successfully',
        data: result  // { tasks: [...], pagination: {...} }
    });
});

// Get task by ID
const getTaskById = asyncHandler(async (req, res) => {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const task = await Task.getTaskWithDetails(taskId);

    if (!task) {
        throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Check if user has permission to view this task
    if (userRole !== 'admin' &&
        task.assignee_id !== userId &&
        task.watcher_id !== userId &&
        task.creator_id !== userId) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    res.status(200).json({
        success: true,
        message: 'Task retrieved successfully',
        data: {
            task
        }
    });
});

// Update task status (user can update their assigned tasks)
const updateTaskStatus = asyncHandler(async (req, res) => {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status } = req.body;

    if (!status) {
        throw new AppError('Status is required', 400, 'VALIDATION_ERROR');
    }

    const task = await Task.findById(taskId);

    if (!task) {
        throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Check if user has permission to update this task
    if (userRole !== 'admin' && task.assignee_id !== userId) {
        throw new AppError('Only assigned user or admin can update task status', 403, 'ACCESS_DENIED');
    }

    const updatedTask = await Task.updateStatus(taskId, status);

    // Create notification for status change (không tạo nếu creator là admin)
    if (task.creator_id !== userId) {
        const creatorUser = await User.findById(task.creator_id);
        if (creatorUser && creatorUser.role !== 'admin') {
            await Notification.create({
                user_id: task.creator_id,
                task_id: taskId,
                type: 'task_updated',
                title: 'Task được cập nhật',
                message: `Task "${task.title}" đã được cập nhật trạng thái thành "${status}"`
            });
        }
    }

    res.status(200).json({
        success: true,
        message: 'Task status updated successfully',
        data: {
            task: updatedTask
        }
    });
});

// Update task (admin only)
const updateTask = asyncHandler(async (req, res) => {
    const taskId = parseInt(req.params.id);
    let {
        title,
        description,
        assignee_id,
        watcher_id,
        project_id,
        start_date,
        due_date,
        priority,
        status
    } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
        throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    const updatedTask = await Task.updateById(taskId, {
        title,
        description,
        assignee_id,
        watcher_id,
        project_id,
        start_date,
        due_date,
        priority,
        status
    });

    // Create notification if assignee changed (không tạo nếu assignee là admin)
    if (assignee_id && assignee_id !== task.assignee_id) {
        const newAssigneeUser = await User.findById(assignee_id);
        if (newAssigneeUser && newAssigneeUser.role !== 'admin') {
            await Notification.create({
                user_id: assignee_id,
                task_id: taskId,
                type: 'task_assigned',
                title: 'Bạn được giao task mới',
                message: `Task "${title || task.title}" đã được giao cho bạn`
            });
        }
    }

    const taskWithDetails = await Task.getTaskWithDetails(taskId);

    res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: {
            task: taskWithDetails
        }
    });
});

// Delete task (admin only)
const deleteTask = asyncHandler(async (req, res) => {
    const taskId = parseInt(req.params.id);

    const deletedTask = await Task.deleteById(taskId);

    if (!deletedTask) {
        throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
        data: {
            task: deletedTask
        }
    });
});

// Get dashboard stats for current user
const getMyDashboardStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const taskStats = await Task.getTaskStatsByUser(userId);

    const stats = {
        tasks: {
            total: parseInt(taskStats.total_tasks),
            completed: parseInt(taskStats.completed_tasks),
            in_progress: parseInt(taskStats.in_progress_tasks),
            not_started: parseInt(taskStats.not_started_tasks),
            overdue: parseInt(taskStats.overdue_tasks)
        }
    };

    res.status(200).json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: {
            stats
        }
    });
});

// Get all tasks (admin only) - SỬ DỤNG METHOD MỚI findWithPagination
const getAllTasks = asyncHandler(async (req, res) => {
    const {
        status,
        priority,
        project_id,
        assignee_id,
        creator_id,
        page = 1,
        limit = 6,  // Mặc định 6 tasks/trang
        sort = 'created_at',
        order = 'desc',
        search,
        overdue,
        today,
        upcoming
    } = req.query;

    // Build filters (admin có thể filter tất cả)
    const filters = {
        status,
        priority,
        project_id,
        assignee_id,
        creator_id,
        sort,
        order,
        search,
        overdue,
        today,
        upcoming
    };

    // Sử dụng method mới findWithPagination
    const result = await Task.findWithPagination(
        parseInt(page),
        parseInt(limit),
        filters
    );

    res.status(200).json({
        success: true,
        message: 'Tasks retrieved successfully',
        data: result  // { tasks: [...], pagination: {...} }
    });
});

// Download task file
const downloadTaskFile = asyncHandler(async (req, res) => {
    const { taskId, fileId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Lấy thông tin task để kiểm tra quyền
    const task = await Task.findById(parseInt(taskId));

    if (!task) {
        throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Kiểm tra quyền truy cập task
    if (userRole !== 'admin' &&
        task.assignee_id !== userId &&
        task.watcher_id !== userId &&
        task.creator_id !== userId) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    // Lấy thông tin file
    const file = await TaskFile.getFileById(parseInt(fileId));

    if (!file) {
        throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
    }

    // Kiểm tra file có thuộc task này không
    if (file.task_id !== parseInt(taskId)) {
        throw new AppError('File does not belong to this task', 403, 'ACCESS_DENIED');
    }

    // Đường dẫn file trên server
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(file.file_path);

    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
        throw new AppError('File not found on server', 404, 'FILE_NOT_FOUND');
    }

    // Set headers để download
    res.setHeader('Content-Type', file.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.file_name)}"`);
    res.setHeader('Content-Length', file.file_size);

    // Stream file về client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
});

// Delete confirmed task (user can delete their own confirmed tasks)
const deleteConfirmedTask = asyncHandler(async (req, res) => {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;

    // Delete task using model method (includes permission checks)
    try {
        const deletedTask = await Task.deleteConfirmedTask(taskId, userId);

        if (!deletedTask) {
            throw new AppError('Failed to delete task', 500, 'DELETE_FAILED');
        }

        res.status(200).json({
            success: true,
            message: 'Confirmed task deleted successfully',
            data: {
                task: deletedTask
            }
        });
    } catch (error) {
        // Re-throw as AppError for consistent error handling
        if (error.message === 'Task not found') {
            throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
        } else if (error.message === 'You are not authorized to delete this task') {
            throw new AppError('You are not authorized to delete this task', 403, 'FORBIDDEN');
        } else if (error.message === 'Can only delete confirmed tasks') {
            throw new AppError('Can only delete confirmed tasks', 400, 'NOT_CONFIRMED');
        } else {
            throw error;
        }
    }
});

module.exports = {
    createTask,
    getMyTasks,
    getTaskById,
    updateTask,
    updateTaskStatus,
    deleteTask,
    getMyDashboardStats,
    getAllTasks,
    downloadTaskFile,
    deleteConfirmedTask
};