const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { errorHandler, notFoundHandler, generalLimiter } = require('./middleware');
const { specs, swaggerUi, swaggerOptions } = require('./config/swagger');
const {
    securityHeaders,
    userAgentFilter,
    corsOptions,
    requestLogger,
    validateContentType,
    requestSizeLimiter,
    trackSecurityEvents
} = require('./middleware/security');
const apiRoutes = require('./routes');
const { initializeSocket } = require('./socket/socketServer');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware (apply early)
app.use(securityHeaders);
app.use(requestLogger);
app.use(userAgentFilter);
app.use(requestSizeLimiter);
app.use(trackSecurityEvents);

// CORS with custom options
app.use(cors(corsOptions));

// Content-Type validation
app.use(validateContentType);

// Body parsing middleware (only for non-multipart requests)
app.use((req, res, next) => {
    const contentType = req.get('Content-Type') || '';

    if (!contentType.includes('multipart/form-data')) {
        express.json({ limit: '10mb' })(req, res, next);
    } else {
        next();
    }
});

app.use((req, res, next) => {
    const contentType = req.get('Content-Type') || '';
    if (!contentType.includes('multipart/form-data')) {
        express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
    } else {
        next();
    }
});

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Serve static files (avatars, uploads)
// Serve public/uploads (avatars)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// Serve uploads (tasks, chat files, reports)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'Task Management API Server is running!',
        timestamp: new Date().toISOString()
    });
});

// Health check route
app.get('/health', async (req, res) => {
    try {
        const dbStatus = await testConnection();
        res.status(200).json({
            status: 'OK',
            database: dbStatus ? 'Connected' : 'Disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            database: 'Disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
});

// API routes
app.use('/api', apiRoutes);

// Error handling middleware (must be after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // Test database connection before starting server
        console.log('Starting server...');
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.log(' Server starting without database connection');
        }

        // Initialize Socket.IO
        initializeSocket(server);

        server.listen(PORT, () => {
            console.log(` -Server is running on port ${PORT}`);
            console.log(` -Server URL: http://localhost:${PORT}`);
            console.log(` -Health check: http://localhost:${PORT}/health`);
            console.log(` -API Documentation: http://localhost:${PORT}/api-docs`);
            console.log(` -Socket.IO ready for connections`);
        });
    } catch (error) {
        console.error(' Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();