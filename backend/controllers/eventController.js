const { query } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware');
const { Notification } = require('../models');

// GET /api/events - Lấy danh sách events của user
const getEvents = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await query(
            `SELECT id, title, start_date, end_date, description, user_id, created_at, updated_at
             FROM events
             WHERE user_id = $1
             ORDER BY start_date ASC`,
            [userId]
        );

        res.status(200).json({
            success: true,
            message: 'Events retrieved successfully',
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        throw new AppError('Failed to retrieve events', 500);
    }
});

// POST /api/events - Tạo event mới
const createEvent = asyncHandler(async (req, res) => {
    const { title, start_date, end_date, description } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!title || !start_date) {
        return res.status(400).json({
            success: false,
            message: 'Title and start_date are required'
        });
    }

    try {
        const result = await query(
            `INSERT INTO events (title, start_date, end_date, description, user_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             RETURNING id, title, start_date, end_date, description, user_id, created_at, updated_at`,
            [title, start_date, end_date || null, description || null, userId]
        );

        const event = result.rows[0];

        // Tạo notification cho user
        try {
            const startDate = new Date(start_date);
            const formattedDate = startDate.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            await Notification.create({
                user_id: userId,
                type: 'calendar_event_created',
                title: 'Lịch mới được tạo',
                message: `Bạn có lịch "${title}" vào ${formattedDate}${description ? ': ' + description : ''}`
            });
        } catch (notifError) {
            console.error('Failed to create calendar notification:', notifError);
            // Không throw error - vẫn trả về success cho event
        }

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: event
        });
    } catch (error) {
        console.error('Create event error:', error);
        throw new AppError('Failed to create event', 500);
    }
});

// PUT /api/events/:id - Cập nhật event
const updateEvent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, start_date, end_date, description } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!title || !start_date) {
        return res.status(400).json({
            success: false,
            message: 'Title and start_date are required'
        });
    }

    try {
        // Check if event exists and belongs to user
        const existingEvent = await query(
            'SELECT id FROM events WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingEvent.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found or you do not have permission to update it'
            });
        }

        const result = await query(
            `UPDATE events
             SET title = $1, start_date = $2, end_date = $3, description = $4, updated_at = NOW()
             WHERE id = $5 AND user_id = $6
             RETURNING id, title, start_date, end_date, description, created_at, updated_at`,
            [title, start_date, end_date || null, description || null, id, userId]
        );

        const event = result.rows[0];

        // Tạo notification cho user
        try {
            const startDate = new Date(start_date);
            const formattedDate = startDate.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            await Notification.create({
                user_id: userId,
                type: 'calendar_event_updated',
                title: 'Lịch được cập nhật',
                message: `Lịch "${title}" đã được cập nhật thành ${formattedDate}${description ? ': ' + description : ''}`
            });
        } catch (notifError) {
            console.error('Failed to create calendar notification:', notifError);
            // Không throw error - vẫn trả về success cho event
        }

        res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: event
        });
    } catch (error) {
        console.error('Update event error:', error);
        throw new AppError('Failed to update event', 500);
    }
});

// DELETE /api/events/:id - Xóa event
const deleteEvent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // Check if event exists and belongs to user
        const existingEvent = await query(
            'SELECT id FROM events WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingEvent.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found or you do not have permission to delete it'
            });
        }

        await query(
            'DELETE FROM events WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        res.status(200).json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Delete event error:', error);
        throw new AppError('Failed to delete event', 500);
    }
});

// GET /api/events/:id - Lấy chi tiết một event
const getEventById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await query(
            `SELECT id, title, start_date, end_date, description, created_at, updated_at
             FROM events
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Event retrieved successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get event error:', error);
        throw new AppError('Failed to retrieve event', 500);
    }
});

// GET /api/events/today - Lấy events của hôm nay
const getTodayEvents = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    try {
        const result = await query(
            `SELECT id, title, start_date, end_date, description, created_at, updated_at
             FROM events
             WHERE user_id = $1
             AND start_date >= $2
             AND start_date < $3
             ORDER BY start_date ASC`,
            [userId, startOfDay.toISOString(), endOfDay.toISOString()]
        );

        res.status(200).json({
            success: true,
            message: 'Today events retrieved successfully',
            data: result.rows,
            count: result.rows.length,
            date: today.toISOString().split('T')[0]
        });
    } catch (error) {
        throw new AppError('Failed to retrieve today events', 500);
    }
});

module.exports = {
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    getTodayEvents
};