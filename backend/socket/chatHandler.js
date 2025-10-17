// ================================================
// CHAT SOCKET HANDLERS
// Xử lý tất cả socket events liên quan đến chat
// ================================================

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

/**
 * Initialize chat socket handlers
 * @param {Object} io - Socket.IO instance
 * @param {Object} socket - Socket connection
 */
const chatHandler = (io, socket) => {
    const { userId, userType, username } = socket;

    // ================================================
    // JOIN CONVERSATION
    // User join vào một conversation room
    // ================================================
    socket.on('join_conversation', async (data, callback) => {
        try {
            const { conversationId } = data;

            // Verify user có quyền trong conversation này không
            const isParticipant = await Conversation.isParticipant(
                conversationId,
                userId,
                userType
            );

            if (!isParticipant) {
                return callback({
                    success: false,
                    message: 'You are not a participant of this conversation'
                });
            }

            // Join socket room
            socket.join(`conversation_${conversationId}`);

            console.log(`👥 ${username} joined conversation ${conversationId}`);

            // Update last_read_at
            await Conversation.updateLastRead(conversationId, userId, userType);

            callback({
                success: true,
                message: 'Joined conversation successfully'
            });
        } catch (error) {
            console.error('Error joining conversation:', error);
            callback({
                success: false,
                message: 'Failed to join conversation'
            });
        }
    });

    // ================================================
    // LEAVE CONVERSATION
    // User rời khỏi conversation room
    // ================================================
    socket.on('leave_conversation', async (data, callback) => {
        try {
            const { conversationId } = data;

            socket.leave(`conversation_${conversationId}`);

            console.log(`👋 ${username} left conversation ${conversationId}`);

            if (callback) {
                callback({
                    success: true,
                    message: 'Left conversation successfully'
                });
            }
        } catch (error) {
            console.error('Error leaving conversation:', error);
            if (callback) {
                callback({
                    success: false,
                    message: 'Failed to leave conversation'
                });
            }
        }
    });

    // ================================================
    // SEND MESSAGE
    // Gửi tin nhắn mới
    // ================================================
    socket.on('send_message', async (data, callback) => {
        try {
            const { conversationId, messageText, messageType = 'text', fileUrl = null } = data;

            // Verify user có quyền trong conversation
            const isParticipant = await Conversation.isParticipant(
                conversationId,
                userId,
                userType
            );

            if (!isParticipant) {
                return callback({
                    success: false,
                    message: 'You are not a participant of this conversation'
                });
            }

            // Validate message
            if (messageType === 'text' && (!messageText || messageText.trim().length === 0)) {
                return callback({
                    success: false,
                    message: 'Message text cannot be empty'
                });
            }

            if ((messageType === 'file' || messageType === 'image') && !fileUrl) {
                return callback({
                    success: false,
                    message: 'File URL is required for file/image messages'
                });
            }

            // Lưu message vào database
            const message = await Message.create({
                conversationId,
                senderId: userId,
                senderType: userType,
                messageText,
                messageType,
                fileUrl
            });

            // Lấy thông tin đầy đủ của message (kèm sender info)
            const fullMessage = await Message.getById(message.id);

            // Broadcast message đến tất cả participants trong room
            io.to(`conversation_${conversationId}`).emit('new_message', {
                message: fullMessage
            });

            // ================================================
            // TẠO NOTIFICATION CHO NGƯỜI NHẬN
            // ================================================
            try {
                // Lấy conversation với participants
                const conversation = await Conversation.getConversationById(conversationId);

                if (conversation && conversation.participants) {
                    // Tìm recipient (người không phải sender)
                    const recipient = conversation.participants.find(p => {
                        if (p.participantType === 'user') {
                            return !(p.participantId === userId && userType === 'user');
                        } else if (p.participantType === 'admin') {
                            return !(p.participantId === userId && userType === 'admin');
                        }
                        return false;
                    });

                    if (recipient) {
                        const recipientId = recipient.participantId;
                        const recipientType = recipient.participantType;

                        // ✅ CHECK: Đã có notification chưa đọc từ conversation này chưa?
                        const existingNotification = await Notification.findUnreadMessageNotification(
                            recipientId,
                            conversationId
                        );

                        // ✅ CHỈ TẠO MỚI nếu chưa có notification chưa đọc
                        if (!existingNotification) {
                            // Tạo notification
                            await Notification.create({
                                user_id: recipientId,
                                conversation_id: conversationId,
                                type: 'message_new',
                                title: 'Tin nhắn mới',
                                message: `${username} đã gửi tin nhắn cho bạn`
                            });

                            // Emit notification event cho recipient
                            io.to(`${recipientType}_${recipientId}`).emit('new_notification', {
                                type: 'message_new',
                                conversation_id: conversationId,
                                sender_name: username,
                                message: `${username} đã gửi tin nhắn cho bạn`,
                                created_at: new Date()
                            });

                            console.log(`🔔 Notification sent to ${recipientType}_${recipientId}`);
                        } else {
                            console.log(`ℹ️  Notification already exists for conversation ${conversationId}, skipping...`);
                        }
                    }
                }
            } catch (notifError) {
                console.error('Error creating message notification:', notifError);
                // Không throw error - notification fail không nên block message sending
            }

            console.log(`💬 Message sent in conversation ${conversationId} by ${username}`);

            callback({
                success: true,
                message: 'Message sent successfully',
                data: fullMessage
            });
        } catch (error) {
            console.error('Error sending message:', error);
            callback({
                success: false,
                message: 'Failed to send message',
                error: error.message
            });
        }
    });

    // ================================================
    // TYPING START
    // User bắt đầu typing
    // ================================================
    socket.on('typing_start', async (data) => {
        try {
            const { conversationId } = data;

            // Verify user có quyền
            const isParticipant = await Conversation.isParticipant(
                conversationId,
                userId,
                userType
            );

            if (!isParticipant) return;

            // Broadcast đến tất cả users KHÁC trong room
            socket.to(`conversation_${conversationId}`).emit('user_typing', {
                conversationId,
                userId,
                userType,
                username
            });
        } catch (error) {
            console.error('Error handling typing_start:', error);
        }
    });

    // ================================================
    // TYPING STOP
    // User dừng typing
    // ================================================
    socket.on('typing_stop', async (data) => {
        try {
            const { conversationId } = data;

            // Verify user có quyền
            const isParticipant = await Conversation.isParticipant(
                conversationId,
                userId,
                userType
            );

            if (!isParticipant) return;

            // Broadcast đến tất cả users KHÁC trong room
            socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
                conversationId,
                userId,
                userType,
                username
            });
        } catch (error) {
            console.error('Error handling typing_stop:', error);
        }
    });

    // ================================================
    // MARK AS READ
    // Đánh dấu conversation đã đọc
    // ================================================
    socket.on('mark_as_read', async (data, callback) => {
        try {
            const { conversationId } = data;

            // Verify user có quyền
            const isParticipant = await Conversation.isParticipant(
                conversationId,
                userId,
                userType
            );

            if (!isParticipant) {
                if (callback) {
                    return callback({
                        success: false,
                        message: 'You are not a participant of this conversation'
                    });
                }
                return;
            }

            // Update last_read_at
            await Conversation.updateLastRead(conversationId, userId, userType);

            // Notify other participants (optional - để họ biết bạn đã đọc)
            socket.to(`conversation_${conversationId}`).emit('message_read', {
                conversationId,
                userId,
                userType,
                readAt: new Date()
            });

            if (callback) {
                callback({
                    success: true,
                    message: 'Marked as read successfully'
                });
            }
        } catch (error) {
            console.error('Error marking as read:', error);
            if (callback) {
                callback({
                    success: false,
                    message: 'Failed to mark as read'
                });
            }
        }
    });

    // ================================================
    // GET ONLINE USERS
    // Lấy danh sách ALL users online trong hệ thống
    // ================================================
    socket.on('get_online_users', async (data, callback) => {
        try {
            // Get all connected sockets
            const sockets = await io.fetchSockets();

            // Get user info for each socket
            const onlineUsers = [];
            const seenUsers = new Set(); // Để tránh duplicate

            for (const sock of sockets) {
                const userKey = `${sock.userType}_${sock.userId}`;
                if (!seenUsers.has(userKey)) {
                    seenUsers.add(userKey);
                    onlineUsers.push({
                        userId: sock.userId,
                        userType: sock.userType,
                        username: sock.username
                    });
                }
            }

            if (callback) {
                callback({
                    success: true,
                    onlineUsers: onlineUsers
                });
            }
        } catch (error) {
            console.error('Error getting online users:', error);
            if (callback) {
                callback({
                    success: false,
                    message: 'Failed to get online users'
                });
            }
        }
    });
};

module.exports = chatHandler;
