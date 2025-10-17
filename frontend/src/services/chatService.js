// ================================================
// CHAT SERVICE
// REST API calls cho chat feature
// ================================================

import api from './api';

const chatService = {
    /**
     * Lấy danh sách conversations của user hiện tại
     */
    async getConversations() {
        try {
            const response = await api.get('/chat/conversations');
            return response.data;
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    },

    /**
     * Lấy chi tiết một conversation
     * @param {Number} conversationId
     */
    async getConversation(conversationId) {
        try {
            const response = await api.get(`/chat/conversations/${conversationId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching conversation:', error);
            throw error;
        }
    },

    /**
     * Tạo conversation mới (group chat)
     * @param {Object} data - { type: 'group', name: string, participants: [{participantId, participantType}] }
     */
    async createConversation(data) {
        try {
            const response = await api.post('/chat/conversations', data);
            return response.data;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    },

    /**
     * Tạo hoặc lấy direct conversation với user cụ thể
     * @param {Number} targetUserId
     * @param {String} targetUserType - 'user' hoặc 'admin'
     */
    async createDirectConversation(targetUserId, targetUserType = 'user') {
        try {
            const response = await api.post('/chat/conversations/direct', {
                targetUserId,
                targetUserType
            });
            return response.data;
        } catch (error) {
            console.error('Error creating direct conversation:', error);
            throw error;
        }
    },

    /**
     * Tạo hoặc lấy conversation với user cụ thể (alias)
     * @param {Object} data - { participantId, participantType }
     */
    async createOrGetConversation(data) {
        try {
            const { participantId, participantType = 'user' } = data;
            const response = await api.post('/chat/conversations/direct', {
                targetUserId: participantId,
                targetUserType: participantType
            });
            return response.data;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    },

    /**
     * Lấy messages của một conversation (có phân trang)
     * @param {Number} conversationId
     * @param {Number} page - Default: 1
     * @param {Number} limit - Default: 50
     */
    async getMessages(conversationId, page = 1, limit = 50) {
        try {
            const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    },

    /**
     * Gửi message mới (REST API backup khi socket fail)
     * @param {Number} conversationId
     * @param {String} messageText
     * @param {String} messageType - 'text', 'file', 'image'
     * @param {String} fileUrl - Optional
     */
    async sendMessage(conversationId, messageText, messageType = 'text', fileUrl = null) {
        try {
            const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
                messageText,
                messageType,
                fileUrl
            });
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    /**
     * Gửi message với nhiều ảnh
     * @param {Number} conversationId
     * @param {String} messageText - Optional text message
     * @param {Array<File>} imageFiles - Array of File objects (max 5)
     * @returns {Promise} - Response với message và attachments
     */
    async sendMessageWithImages(conversationId, messageText, imageFiles) {
        try {
            const formData = new FormData();

            // Thêm text message (nếu có)
            if (messageText && messageText.trim()) {
                formData.append('messageText', messageText.trim());
            }

            // Thêm các ảnh
            if (imageFiles && imageFiles.length > 0) {
                imageFiles.forEach(file => {
                    formData.append('images', file);
                });
            }

            const response = await api.post(
                `/chat/conversations/${conversationId}/messages`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error sending message with images:', error);
            throw error;
        }
    },

    /**
     * Upload nhiều files trước (preview)
     * @param {Array<File>} files - Array of File objects
     * @returns {Promise} - Array of uploaded file info
     */
    async uploadMultipleFiles(files) {
        try {
            const formData = new FormData();

            files.forEach(file => {
                formData.append('images', file);
            });

            const response = await api.post('/chat/upload-multiple', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading multiple files:', error);
            throw error;
        }
    },

    /**
     * Edit message
     * @param {Number} messageId
     * @param {String} messageText
     */
    async editMessage(messageId, messageText) {
        try {
            const response = await api.put(`/chat/messages/${messageId}`, {
                messageText
            });
            return response.data;
        } catch (error) {
            console.error('Error editing message:', error);
            throw error;
        }
    },

    /**
     * Delete message
     * @param {Number} messageId
     */
    async deleteMessage(messageId) {
        try {
            const response = await api.delete(`/chat/messages/${messageId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    },

    /**
     * Đánh dấu conversation đã đọc
     * @param {Number} conversationId
     */
    async markAsRead(conversationId) {
        try {
            const response = await api.post(`/chat/conversations/${conversationId}/read`);
            return response.data;
        } catch (error) {
            console.error('Error marking as read:', error);
            throw error;
        }
    },

    /**
     * Thêm participant vào group conversation
     * @param {Number} conversationId
     * @param {Number} participantId
     * @param {String} participantType - 'user' hoặc 'admin'
     */
    async addParticipant(conversationId, participantId, participantType = 'user') {
        try {
            const response = await api.post(`/chat/conversations/${conversationId}/participants`, {
                participantId,
                participantType
            });
            return response.data;
        } catch (error) {
            console.error('Error adding participant:', error);
            throw error;
        }
    },

    /**
     * Xóa participant khỏi group conversation
     * @param {Number} conversationId
     * @param {Number} participantId
     * @param {String} participantType - 'user' hoặc 'admin'
     */
    async removeParticipant(conversationId, participantId, participantType = 'user') {
        try {
            const response = await api.delete(
                `/chat/conversations/${conversationId}/participants/${participantId}`,
                {
                    params: { participantType }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error removing participant:', error);
            throw error;
        }
    },

    /**
     * Search messages across all conversations
     * @param {String} query - Search term
     */
    async searchMessages(query) {
        try {
            const response = await api.get('/chat/search', {
                params: { q: query }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching messages:', error);
            throw error;
        }
    },

    /**
     * Upload file cho chat
     * @param {File} file - File object từ input
     * @returns {Promise} - { fileUrl, fileName, fileSize, mimeType, messageType }
     */
    async uploadFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/chat/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }
};

export default chatService;
