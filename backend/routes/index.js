const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const adminRoutes = require('./admin');
const eventRoutes = require('./events');
const projectRoutes = require('./projects');
const taskRoutes = require('./tasks');
const notificationRoutes = require('./notifications');
const taskReportRoutes = require('./taskReports');
const chatRoutes = require('./chatRoutes');

// API info route
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Task Management API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            admin: '/api/admin',
            events: '/api/events',
            projects: '/api/projects',
            tasks: '/api/tasks',
            notifications: '/api/notifications',
            reports: '/api (task reports endpoints)',
            chat: '/api/chat'
        },
        documentation: 'Coming soon...',
        timestamp: new Date().toISOString()
    });
});

// Route mounting
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/events', eventRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);
router.use('/', taskReportRoutes);

module.exports = router;