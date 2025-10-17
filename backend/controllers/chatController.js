// ================================================
// CHAT CONTROLLER
// REST API endpoints cho chat (không dùng socket)
// ================================================

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const MessageAttachment = require('../models/MessageAttachment');
const { asyncHandler, AppError } = require('../middleware');

/**
 * GET /api/chat/conversations
 * Lấy danh sách conversations của user hiện tại
 */
exports.getConversations = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userType = req.user.userType || 'user'; // Từ auth middleware

    const conversations = await Conversation.getUserConversations(userId, userType);

    res.status(200).json({
        success: true,
        data: {
            conversations
        }
    });
});

/**
 * GET /api/chat/conversations/:id
 * Lấy chi tiết một conversation
 */
exports.getConversationById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType || 'user';

    // Verify user có quyền xem conversation này không
    const isParticipant = await Conversation.isParticipant(id, userId, userType);

    if (!isParticipant) {
        throw new AppError('You do not have access to this conversation', 403);
    }

    const conversation = await Conversation.getConversationById(id);

    if (!conversation) {
        throw new AppError('Conversation not found', 404);
    }

    res.status(200).json({
        success: true,
        data: {
            conversation
        }
    });
});

/**
 * POST /api/chat/conversations
 * Tạo conversation mới
 * Body: { type: 'direct' | 'group', name?: string, participants: [{ participantId, participantType }] }
 */
exports.createConversation = asyncHandler(async (req, res) => {
    const { type, name, participants } = req.body;
    const userId = req.user.id;
    const userType = req.user.userType || 'user';

    // Validate
    if (!type || !['direct', 'group'].includes(type)) {
        throw new AppError('Type must be "direct" or "group"', 400);
    }

    if (type === 'group' && !name) {
        throw new AppError('Group conversation must have a name', 400);
    }

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
        throw new AppError('Participants are required', 400);
    }

    // Thêm current user vào participants nếu chưa có
    const hasCurrentUser = participants.some(
        p => p.participantId === userId && p.participantType === userType
    );

    const allParticipants = hasCurrentUser
        ? participants
        : [...participants, { participantId: userId, participantType: userType }];

    // Nếu là direct conversation, kiểm tra đã tồn tại chưa
    if (type === 'direct') {
        if (allParticipants.length !== 2) {
            throw new AppError('Direct conversation must have exactly 2 participants', 400);
        }

        const [p1, p2] = allParticipants;
        const existingConversation = await Conversation.findOrCreateDirectConversation(
            p1.participantId,
            p1.participantType,
            p2.participantId,
            p2.participantType
        );

        return res.status(200).json({
            success: true,
            message: 'Conversation retrieved or created successfully',
            data: {
                conversation: existingConversation
            }
        });
    }

    // Tạo group conversation
    const conversation = await Conversation.createConversation(
        { type, name },
        allParticipants
    );

    res.status(201).json({
        success: true,
        message: 'Conversation created successfully',
        data: {
            conversation
        }
    });
});

/**
 * POST /api/chat/conversations/direct
 * Tạo hoặc lấy direct conversation với user cụ thể
 * Body: { targetUserId, targetUserType }
 */
exports.createOrGetDirectConversation = asyncHandler(async (req, res) => {
    const { targetUserId, targetUserType = 'user' } = req.body;
    const userId = req.user.id;
    const userType = req.user.userType || 'user';

    if (!targetUserId) {
        throw new AppError('Target user ID is required', 400);
    }

    // Không cho phép chat với chính mình
    if (targetUserId === userId && targetUserType === userType) {
        throw new AppError('Cannot create conversation with yourself', 400);
    }

    const conversation = await Conversation.findOrCreateDirectConversation(
        userId,
        userType,
        targetUserId,
        targetUserType
    );

    // Lấy full details
    const fullConversation = await Conversation.getConversationById(conversation.id);

    res.status(200).json({
        success: true,
        message: 'Conversation retrieved successfully',
        data: {
            conversation: fullConversation
        }
    });
});

/**
 * GET /api/chat/conversations/:id/messages
 * Lấy messages của một conversation (có phân trang)
 * Query: ?page=1&limit=50
 */
exports.getMessages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType || 'user';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Verify user có quyền xem conversation này không
    const isParticipant = await Conversation.isParticipant(id, userId, userType);

    if (!isParticipant) {
        throw new AppError('You do not have access to this conversation', 403);
    }

    const result = await Message.getByConversationId(id, page, limit);

    // Lấy attachments cho tất cả messages
    const messageIds = result.messages.map(msg => msg.id);
    const attachmentsMap = await MessageAttachment.getByMessageIds(messageIds);

    // Thêm attachments vào từng message
    const messagesWithAttachments = result.messages.map(msg => ({
        ...msg,
        attachments: attachmentsMap[msg.id] || []
    }));

    res.status(200).json({
        success: true,
        data: {
            messages: messagesWithAttachments,
            pagination: result.pagination
        }
    });
});

/**
 * POST /api/chat/conversations/:id/messages
 * Gửi message mới (backup REST API nếu socket fail)
 * Body: { messageText, messageType, fileUrl }
 * Hoặc multipart/form-data với files và messageText
 */
exports.sendMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { messageText, messageType = 'text', fileUrl = null } = req.body;
    const userId = req.user.id;
    const userType = req.user.userType || 'user';
    const files = req.files; // Từ multer (nếu upload nhiều files)

    // Verify user có quyền
    const isParticipant = await Conversation.isParticipant(id, userId, userType);

    if (!isParticipant) {
        throw new AppError('You do not have access to this conversation', 403);
    }

    // Xác định message type dựa trên có files hay không
    let finalMessageType = messageType;
    if (files && files.length > 0) {
        // Nếu có files, check loại file đầu tiên
        const firstFile = files[0];
        if (firstFile.mimetype.startsWith('image/')) {
            finalMessageType = 'image';
        } else {
            finalMessageType = 'file';
        }
    }

    // Tạo message
    const message = await Message.create({
        conversationId: id,
        senderId: userId,
        senderType: userType,
        messageText: messageText || null,
        messageType: finalMessageType,
        fileUrl: fileUrl || null
    });

    // Nếu có files, lưu vào message_attachments
    if (files && files.length > 0) {
        const attachments = files.map(file => ({
            messageId: message.id,
            filePath: `/uploads/chat/${file.filename}`,
            fileName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype
        }));

        await MessageAttachment.createMany(attachments);
    }

    // Lấy full message details (kèm attachments)
    const fullMessage = await Message.getById(message.id);
    fullMessage.attachments = await MessageAttachment.getByMessageId(message.id);

    // Emit socket event (nếu socket đang chạy)
    try {
        const { emitToConversation } = require('../socket/socketServer');
        emitToConversation(id, 'new_message', { message: fullMessage });
    } catch (error) {
        console.log('Socket not available, message saved to DB only');
    }

    res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: {
            message: fullMessage
        }
    });
});

/**
 * PUT /api/chat/messages/:messageId
 * Edit message
 * Body: { messageText }
 */
exports.editMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { messageText } = req.body;
    const userId = req.user.id;
    const userType = req.user.userType || 'user';

    if (!messageText || messageText.trim().length === 0) {
        throw new AppError('Message text cannot be empty', 400);
    }

    const updatedMessage = await Message.updateMessage(
        messageId,
        messageText,
        userId,
        userType
    );

    // Get full message details
    const fullMessage = await Message.getById(updatedMessage.id);

    // Emit socket event
    try {
        const { emitToConversation } = require('../socket/socketServer');
        emitToConversation(fullMessage.conversation_id, 'message_edited', {
            message: fullMessage
        });
    } catch (error) {
        console.log('Socket not available');
    }

    res.status(200).json({
        success: true,
        message: 'Message edited successfully',
        data: {
            message: fullMessage
        }
    });
});

/**
 * DELETE /api/chat/messages/:messageId
 * Delete message
 */
exports.deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType || 'user';

    // Get message first để lấy conversation_id
    const message = await Message.getById(messageId);

    if (!message) {
        throw new AppError('Message not found', 404);
    }

    await Message.deleteMessage(messageId, userId, userType);

    // Emit socket event
    try {
        const { emitToConversation } = require('../socket/socketServer');
        emitToConversation(message.conversation_id, 'message_deleted', {
            messageId,
            conversationId: message.conversation_id,
            deletedBy: userId,
            deletedByType: userType
        });
    } catch (error) {
        console.log('Socket not available');
    }

    res.status(200).json({
        success: true,
        message: 'Message deleted successfully'
    });
});

/**
 * POST /api/chat/conversations/:id/participants
 * Thêm participant vào group conversation
 * Body: { participantId, participantType }
 */
exports.addParticipant = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { participantId, participantType = 'user' } = req.body;
    const userId = req.user.id;
    const userType = req.user.userType || 'user';

    // Verify user có quyền (phải là participant)
    const isParticipant = await Conversation.isParticipant(id, userId, userType);

    if (!isParticipant) {
        throw new AppError('You do not have access to this conversation', 403);
    }

    if (!participantId) {
        throw new AppError('Participant ID is required', 400);
    }

    await Conversation.addParticipant(id, participantId, participantType);

    // Emit socket event
    try {
        const { emitToConversation, emitToUser } = require('../socket/socketServer');

        // Notify all participants
        emitToConversation(id, 'participant_added', {
            conversationId: id,
            participantId,
            participantType
        });

        // Notify new participant
        emitToUser(participantId, participantType, 'added_to_conversation', {
            conversationId: id
        });
    } catch (error) {
        console.log('Socket not available');
    }

    res.status(200).json({
        success: true,
        message: 'Participant added successfully'
    });
});

/**
 * DELETE /api/chat/conversations/:id/participants/:participantId
 * Xóa participant khỏi group conversation
 * Query: ?participantType=user|admin
 */
exports.removeParticipant = asyncHandler(async (req, res) => {
    const { id, participantId } = req.params;
    const participantType = req.query.participantType || 'user';
    const userId = req.user.id;
    const userType = req.user.userType || 'user';

    // Verify user có quyền
    const isParticipant = await Conversation.isParticipant(id, userId, userType);

    if (!isParticipant) {
        throw new AppError('You do not have access to this conversation', 403);
    }

    await Conversation.removeParticipant(id, parseInt(participantId), participantType);

    // Emit socket event
    try {
        const { emitToConversation, emitToUser } = require('../socket/socketServer');

        emitToConversation(id, 'participant_removed', {
            conversationId: id,
            participantId: parseInt(participantId),
            participantType
        });

        emitToUser(parseInt(participantId), participantType, 'removed_from_conversation', {
            conversationId: id
        });
    } catch (error) {
        console.log('Socket not available');
    }

    res.status(200).json({
        success: true,
        message: 'Participant removed successfully'
    });
});

/**
 * POST /api/chat/conversations/:id/read
 * Đánh dấu conversation đã đọc
 */
exports.markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType || 'user';

    // Verify user có quyền
    const isParticipant = await Conversation.isParticipant(id, userId, userType);

    if (!isParticipant) {
        throw new AppError('You do not have access to this conversation', 403);
    }

    // Update conversation last_read_at
    await Conversation.updateLastRead(id, userId, userType);

    // ✅ Đánh dấu message notifications là đã đọc
    const Notification = require('../models/Notification');
    await Notification.markConversationMessagesAsRead(userId, parseInt(id));

    res.status(200).json({
        success: true,
        message: 'Marked as read successfully'
    });
});

/**
 * GET /api/chat/search
 * Search messages across all conversations
 * Query: ?q=search_term
 */
exports.searchMessages = asyncHandler(async (req, res) => {
    const { q } = req.query;
    const userId = req.user.id;
    const userType = req.user.userType || 'user';

    if (!q || q.trim().length === 0) {
        throw new AppError('Search term is required', 400);
    }

    // Get all user's conversations
    const conversations = await Conversation.getUserConversations(userId, userType);

    // Search in each conversation
    const searchResults = [];

    for (const conv of conversations) {
        const messages = await Message.searchMessages(conv.id, q, 10);
        if (messages.length > 0) {
            searchResults.push({
                conversation: conv,
                messages
            });
        }
    }

    res.status(200).json({
        success: true,
        data: {
            results: searchResults,
            total: searchResults.reduce((acc, r) => acc + r.messages.length, 0)
        }
    });
});

/**
 * POST /api/chat/upload
 * Upload file cho chat
 * File được gửi qua multipart/form-data với field name là 'file'
 */
exports.uploadChatFile = asyncHandler(async (req, res) => {
    // File được upload bởi multer middleware
    if (!req.file) {
        throw new AppError('No file uploaded', 400);
    }

    const file = req.file;

    // Tạo URL để access file
    const fileUrl = `/uploads/chat/${file.filename}`;

    // Xác định message type dựa trên MIME type
    let messageType = 'file';
    if (file.mimetype.startsWith('image/')) {
        messageType = 'image';
    }

    res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
            fileUrl,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            messageType
        }
    });
});

/**
 * POST /api/chat/upload-multiple
 * Upload nhiều files cùng lúc (preview trước khi gửi message)
 * Files được gửi qua multipart/form-data với field name là 'images'
 */
exports.uploadMultipleChatFiles = asyncHandler(async (req, res) => {
    // Files được upload bởi multer middleware
    if (!req.files || req.files.length === 0) {
        throw new AppError('No files uploaded', 400);
    }

    const files = req.files;

    // Map files thành response data
    const uploadedFiles = files.map(file => {
        const fileUrl = `/uploads/chat/${file.filename}`;
        let messageType = 'file';
        if (file.mimetype.startsWith('image/')) {
            messageType = 'image';
        }

        return {
            fileUrl,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            messageType
        };
    });

    res.status(200).json({
        success: true,
        message: `${files.length} file(s) uploaded successfully`,
        data: {
            files: uploadedFiles,
            count: files.length
        }
    });
});
