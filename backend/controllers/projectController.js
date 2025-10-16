const { Project } = require('../models');
const { asyncHandler, AppError } = require('../middleware');

// Get all projects (admin only)
const getAllProjects = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let projects;
    if (status) {
        projects = await Project.findByStatus(status, parseInt(limit), offset);
    } else {
        // Get projects with task count
        projects = await Project.getAllWithTaskCount(parseInt(limit), offset);
    }

    const totalProjects = await Project.count();

    res.status(200).json({
        success: true,
        message: 'Projects retrieved successfully',
        data: {
            projects,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(totalProjects / limit),
                total_projects: totalProjects,
                projects_per_page: parseInt(limit)
            }
        }
    });
});

// Get projects for dropdown (admin only) - lightweight version
const getProjectsForDropdown = asyncHandler(async (req, res) => {
    const projects = await Project.getProjectsForDropdown();

    res.status(200).json({
        success: true,
        message: 'Projects for dropdown retrieved successfully',
        data: {
            projects
        }
    });
});

// Create new project (admin only)
const createProject = asyncHandler(async (req, res) => {
    const { name, description, status = 'active' } = req.body;
    const created_by = req.user.id;

    // Validation
    if (!name || !name.trim()) {
        throw new AppError('Project name is required', 400, 'VALIDATION_ERROR');
    }
    if (name.trim().length > 255) {
        throw new AppError('Project name must not exceed 255 characters', 400, 'VALIDATION_ERROR');
    }

    // Validate status
    const validStatuses = ['active', 'completed', 'on_hold'];
    if (!validStatuses.includes(status)) {
        throw new AppError('Invalid status value', 400, 'VALIDATION_ERROR');
    }

    const newProject = await Project.create({
        name: name.trim(),
        description: description ? description.trim() : null,
        created_by,
        status
    });

    res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: {
            project: newProject
        }
    });
});

// Get project by ID (admin only)
const getProjectById = asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id);

    const project = await Project.findById(projectId);

    if (!project) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    res.status(200).json({
        success: true,
        message: 'Project retrieved successfully',
        data: {
            project
        }
    });
});

// Update project (admin only)
const updateProject = asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id);
    const { name, description, status } = req.body;

    // Validation
    if (name !== undefined) {
        if (!name.trim()) {
            throw new AppError('Project name cannot be empty', 400, 'VALIDATION_ERROR');
        }
        if (name.trim().length > 255) {
            throw new AppError('Project name must not exceed 255 characters', 400, 'VALIDATION_ERROR');
        }
    }

    // Validate status if provided
    if (status !== undefined) {
        const validStatuses = ['active', 'completed', 'on_hold'];
        if (!validStatuses.includes(status)) {
            throw new AppError('Invalid status value', 400, 'VALIDATION_ERROR');
        }
    }

    const updatedProject = await Project.updateById(projectId, {
        name: name ? name.trim() : undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        status
    });

    if (!updatedProject) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: {
            project: updatedProject
        }
    });
});

// Delete project (admin only)
const deleteProject = asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id);

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    // Update tasks: set project_id to NULL for all tasks in this project
    // This ensures tasks are not deleted, only unlinked from the project
    const { query } = require('../config/database');
    const taskUpdateResult = await query(
        'UPDATE tasks SET project_id = NULL WHERE project_id = $1',
        [projectId]
    );
    const affectedTasksCount = taskUpdateResult.rowCount;

    // Delete the project
    const deletedProject = await Project.deleteById(projectId);

    res.status(200).json({
        success: true,
        message: `Project deleted successfully. ${affectedTasksCount} task(s) unlinked from this project.`,
        data: {
            project: deletedProject,
            affectedTasksCount
        }
    });
});

module.exports = {
    getAllProjects,
    getProjectsForDropdown,
    createProject,
    getProjectById,
    updateProject,
    deleteProject
};