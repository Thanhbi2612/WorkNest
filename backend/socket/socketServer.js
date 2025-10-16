// ================================================
// SOCKET.IO SERVER
// Khởi tạo và cấu hình Socket.IO server
// ================================================

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const chatHandler = require('./chatHandler');

let io;

/**
 * Khởi tạo Socket.IO server
 * @param {Object} server - HTTP server instance
 */
const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000, // 60 seconds
        pingInterval: 25000  // 25 seconds
    });

    // Middleware xác thực JWT cho socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Lưu thông tin user vào socket
            socket.userId = decoded.userId || decoded.id; // Support both userId and id
            socket.userType = decoded.userType || (decoded.role === 'admin' ? 'admin' : 'user');
            socket.username = decoded.username;

            next();
        } catch (error) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    // Connection event
    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.username} (${socket.userType}) - Socket ID: ${socket.id}`);

        // Lưu mapping userId -> socketId để có thể emit targeted messages
        socket.join(`${socket.userType}_${socket.userId}`);

        // Initialize chat handlers
        chatHandler(io, socket);

        // Disconnect event
        socket.on('disconnect', (reason) => {
            console.log(`❌ User disconnected: ${socket.username} - Reason: ${reason}`);
        });
    });

    console.log('- Socket.IO server initialized');
    return io;
};

/**
 * Get Socket.IO instance
 */
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};

/**
 * Emit event đến specific user
 * @param {Number} userId - ID của user
 * @param {String} userType - 'user' hoặc 'admin'
 * @param {String} event - Tên event
 * @param {Object} data - Data để gửi
 */
const emitToUser = (userId, userType, event, data) => {
    if (!io) {
        console.error('Socket.IO not initialized');
        return;
    }
    io.to(`${userType}_${userId}`).emit(event, data);
};

/**
 * Emit event đến tất cả users trong một conversation
 * @param {Number} conversationId - ID của conversation
 * @param {String} event - Tên event
 * @param {Object} data - Data để gửi
 */
const emitToConversation = (conversationId, event, data) => {
    if (!io) {
        console.error('Socket.IO not initialized');
        return;
    }
    io.to(`conversation_${conversationId}`).emit(event, data);
};

module.exports = {
    initializeSocket,
    getIO,
    emitToUser,
    emitToConversation
};
