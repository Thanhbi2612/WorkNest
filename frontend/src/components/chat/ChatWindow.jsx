// ================================================
// CHAT WINDOW
// Hiển thị conversation và messages
// ================================================

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chatService';
import toast from 'react-hot-toast';
import ImagePreview from './ImagePreview';
import ImageLightbox from './ImageLightbox';
import MessageMenu from './MessageMenu';
import ConfirmDialog from '../ConfirmDialog';
import './ChatWindow.css';

const ChatWindow = ({
    conversation,
    messages,
    setMessages,
    socket,
    isConnected,
    onClose,
    onlineUsers = []
}) => {
    const { user } = useAuth();
    const [messageInput, setMessageInput] = useState('');
    const [typingUsers, setTypingUsers] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]); // Array of {id, file, preview, name, size}
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null); // URL của ảnh đang xem
    const [editingMessageId, setEditingMessageId] = useState(null); // ID tin nhắn đang sửa
    const [editingText, setEditingText] = useState(''); // Text đang sửa
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, messageId: null }); // Confirm dialog state
    const messageListRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
    const chatInputRef = useRef(null);
    const prevMessagesLengthRef = useRef(messages.length); // Track số lượng messages

    const currentUserId = user?.id;
    const currentUserType = user?.userType || (user?.role === 'admin' ? 'admin' : 'user');

    // Auto scroll to bottom CHỈ KHI có tin nhắn mới (không scroll khi edit/delete)
    useEffect(() => {
        if (messageListRef.current) {
            const currentLength = messages.length;
            const prevLength = prevMessagesLengthRef.current;

            // Chỉ scroll xuống khi có tin nhắn mới được thêm vào (length tăng)
            if (currentLength > prevLength) {
                messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
            }

            // Update prev length
            prevMessagesLengthRef.current = currentLength;
        }
    }, [messages]);

    // Listen for typing indicators and message updates
    useEffect(() => {
        if (!socket || !conversation) return;

        const handleUserTyping = (data) => {
            if (data.conversationId === conversation.id) {
                setTypingUsers(prev => {
                    if (!prev.find(u => u.userId === data.userId && u.userType === data.userType)) {
                        return [...prev, { userId: data.userId, userType: data.userType, username: data.username }];
                    }
                    return prev;
                });
            }
        };

        const handleUserStoppedTyping = (data) => {
            if (data.conversationId === conversation.id) {
                setTypingUsers(prev =>
                    prev.filter(u => !(u.userId === data.userId && u.userType === data.userType))
                );
            }
        };

        // Handle message edited
        const handleMessageEdited = (data) => {
            if (data.message && data.message.conversation_id === conversation.id) {
                setMessages(prev => prev.map(msg =>
                    msg.id === data.message.id
                        ? { ...msg, message_text: data.message.message_text, is_edited: true, edited_at: data.message.edited_at }
                        : msg
                ));
            }
        };

        // Handle message deleted
        const handleMessageDeleted = (data) => {
            if (data.conversationId === conversation.id) {
                setMessages(prev => prev.map(msg =>
                    msg.id === data.messageId
                        ? { ...msg, isDeleted: true, deletedBy: data.deletedBy }
                        : msg
                ));
            }
        };

        socket.on('user_typing', handleUserTyping);
        socket.on('user_stopped_typing', handleUserStoppedTyping);
        socket.on('message_edited', handleMessageEdited);
        socket.on('message_deleted', handleMessageDeleted);

        return () => {
            socket.off('user_typing', handleUserTyping);
            socket.off('user_stopped_typing', handleUserStoppedTyping);
            socket.off('message_edited', handleMessageEdited);
            socket.off('message_deleted', handleMessageDeleted);
        };
    }, [socket, conversation]);

    // Mark as read when open conversation
    useEffect(() => {
        if (!conversation) return;

        const markAsRead = async () => {
            try {
                await chatService.markAsRead(conversation.id);
                if (socket && isConnected) {
                    socket.emit('mark_as_read', { conversationId: conversation.id });
                }
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        };

        markAsRead();
    }, [conversation, socket, isConnected]);

    // Handle typing
    const handleTyping = () => {
        if (!socket || !isConnected || !conversation) return;

        socket.emit('typing_start', { conversationId: conversation.id });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', { conversationId: conversation.id });
        }, 2000);
    };

    // Cleanup blob URLs khi component unmount
    useEffect(() => {
        return () => {
            selectedImages.forEach(img => {
                if (img.preview) {
                    URL.revokeObjectURL(img.preview);
                }
            });
        };
    }, [selectedImages]);

    // Validate và thêm ảnh vào state
    const addImages = (files) => {
        const MAX_FILES = 5;
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB

        const imageFiles = Array.from(files).filter(file => {
            // Check file type
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} không phải là ảnh`);
                return false;
            }

            // Check file size
            if (file.size > MAX_SIZE) {
                toast.error(`${file.name} quá lớn (max 10MB)`);
                return false;
            }

            return true;
        });

        // Check số lượng
        const totalFiles = selectedImages.length + imageFiles.length;
        if (totalFiles > MAX_FILES) {
            toast.error(`Chỉ được chọn tối đa ${MAX_FILES} ảnh`);
            return;
        }

        // Tạo preview URLs
        const newImages = imageFiles.map(file => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file: file,
            preview: URL.createObjectURL(file),
            name: file.name,
            size: file.size
        }));

        setSelectedImages(prev => [...prev, ...newImages]);
    };

    // Remove ảnh
    const removeImage = (imageId) => {
        setSelectedImages(prev => {
            const image = prev.find(img => img.id === imageId);
            if (image && image.preview) {
                URL.revokeObjectURL(image.preview);
            }
            return prev.filter(img => img.id !== imageId);
        });
    };

    // Handle file input change
    const handleFileInputChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            addImages(files);
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle paste event
    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const files = [];
        for (let item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    files.push(file);
                }
            }
        }

        if (files.length > 0) {
            addImages(files);
            toast.success(`Đã thêm ${files.length} ảnh từ clipboard`);
        }
    };

    // Handle drag events
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            addImages(files);
            toast.success(`Đã thêm ${files.length} ảnh`);
        }
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File quá lớn! Giới hạn 10MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    // Handle remove selected file
    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle send message (text or file or images)
    const handleSendMessage = async (e) => {
        e.preventDefault();

        // Check if có message text hoặc file hoặc images
        if (!messageInput.trim() && !selectedFile && selectedImages.length === 0) return;
        if (isSending || isUploading) return;
        if (!conversation) {
            toast.error('Chưa chọn hội thoại');
            return;
        }

        const messageText = messageInput.trim();
        const fileToSend = selectedFile;
        const imagesToSend = selectedImages.map(img => img.file);

        // Clear inputs
        setMessageInput('');
        setSelectedFile(null);
        setSelectedImages([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setIsSending(true);

        // Clear typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            socket?.emit('typing_stop', { conversationId: conversation.id });
        }

        try {
            // Nếu có nhiều ảnh, dùng API mới
            if (imagesToSend.length > 0) {
                setIsUploading(true);
                try {
                    const response = await chatService.sendMessageWithImages(
                        conversation.id,
                        messageText,
                        imagesToSend
                    );

                    if (response.success) {
                        // CHỈ thêm message nếu socket KHÔNG connected
                        // Nếu socket connected, backend sẽ emit new_message và socket handler sẽ thêm
                        if (!socket || !isConnected) {
                            setMessages(prev => [...prev, response.data.message]);
                        }
                        // toast.success('Đã gửi tin nhắn'); // Bỏ toast vì quá nhiều notification
                    } else {
                        throw new Error('Send failed');
                    }
                } catch (error) {
                    console.error('Error sending message with images:', error);
                    toast.error('Không thể gửi tin nhắn');
                } finally {
                    setIsUploading(false);
                    setIsSending(false);
                }
                return;
            }

            // Logic cũ cho single file
            let fileUrl = null;
            let messageType = 'text';
            let finalMessageText = messageText;

            // Upload file first if có file
            if (fileToSend) {
                setIsUploading(true);
                try {
                    const uploadResponse = await chatService.uploadFile(fileToSend);
                    if (uploadResponse.success) {
                        fileUrl = uploadResponse.data.fileUrl;
                        messageType = uploadResponse.data.messageType;
                        // Nếu không có text, dùng fileName làm message text
                        if (!finalMessageText) {
                            finalMessageText = uploadResponse.data.fileName;
                        }
                    } else {
                        throw new Error('Upload failed');
                    }
                } catch (uploadError) {
                    console.error('Error uploading file:', uploadError);
                    toast.error('Không thể upload file');
                    setIsSending(false);
                    setIsUploading(false);
                    return;
                } finally {
                    setIsUploading(false);
                }
            }

            // Optimistic UI update
            const tempMessage = {
                id: `temp-${Date.now()}`,
                conversation_id: conversation.id,
                sender_id: currentUserId,
                sender_type: currentUserType,
                sender_username: user?.username || user?.first_name || 'You',
                message_text: finalMessageText,
                message_type: messageType,
                file_url: fileUrl,
                created_at: new Date().toISOString(),
                is_edited: false
            };
            setMessages(prev => [...prev, tempMessage]);

            // Send via socket if connected
            if (socket && isConnected) {
                socket.emit('send_message', {
                    conversationId: conversation.id,
                    messageText: finalMessageText,
                    messageType,
                    fileUrl
                }, (response) => {
                    if (!response.success) {
                        console.error('Failed to send via socket:', response.message);
                        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
                        sendViaRestAPI(finalMessageText, messageType, fileUrl);
                    } else {
                        // Remove temp message, backend sẽ broadcast new_message
                        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
                    }
                });
            } else {
                // Fallback to REST API
                setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
                await sendViaRestAPI(finalMessageText, messageType, fileUrl);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Không thể gửi tin nhắn');
        } finally {
            setIsSending(false);
        }
    };

    const sendViaRestAPI = async (messageText, messageType = 'text', fileUrl = null) => {
        try {
            const response = await chatService.sendMessage(conversation.id, messageText, messageType, fileUrl);
            if (response.success) {
                setMessages(prev => [...prev, response.data.message]);
            } else {
                toast.error('Không thể gửi tin nhắn');
            }
        } catch (error) {
            console.error('REST API send failed:', error);
            toast.error('Không thể gửi tin nhắn');
        }
    };

    // Handle edit message
    const handleEditMessage = (messageId) => {
        const message = messages.find(m => m.id === messageId);
        if (message && message.message_text) {
            setEditingMessageId(messageId);
            setEditingText(message.message_text);
        }
    };

    // Handle save edited message
    const handleSaveEdit = async (messageId) => {
        if (!editingText.trim()) {
            toast.error('Tin nhắn không được rỗng');
            return;
        }

        try {
            const response = await chatService.editMessage(messageId, editingText.trim());
            if (response.success) {
                // Update local state (socket sẽ handle nếu có nhiều users)
                setMessages(prev => prev.map(msg =>
                    msg.id === messageId
                        ? { ...msg, message_text: editingText.trim(), is_edited: true }
                        : msg
                ));
                toast.success('Đã chỉnh sửa tin nhắn');
            }
        } catch (error) {
            console.error('Error editing message:', error);
            toast.error('Không thể chỉnh sửa tin nhắn');
        } finally {
            setEditingMessageId(null);
            setEditingText('');
        }
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditingText('');
    };

    // Handle delete message - show confirm dialog
    const handleDeleteMessage = (messageId) => {
        setConfirmDelete({ isOpen: true, messageId });
    };

    // Confirm delete
    const confirmDeleteMessage = async () => {
        const messageId = confirmDelete.messageId;
        setConfirmDelete({ isOpen: false, messageId: null });

        try {
            const response = await chatService.deleteMessage(messageId);
            if (response.success) {
                // Mark as deleted (socket sẽ handle nếu có nhiều users)
                setMessages(prev => prev.map(msg =>
                    msg.id === messageId
                        ? { ...msg, isDeleted: true }
                        : msg
                ));
                toast.success('Đã xóa tin nhắn');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            toast.error('Không thể xóa tin nhắn');
        }
    };

    // Cancel delete
    const cancelDeleteMessage = () => {
        setConfirmDelete({ isOpen: false, messageId: null });
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    // Format date separator
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hôm nay';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Hôm qua';
        } else {
            return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
    };

    // Group messages by date
    const groupedMessages = [];
    let currentDate = null;

    messages.forEach(msg => {
        const msgDate = new Date(msg.created_at).toDateString();
        if (msgDate !== currentDate) {
            groupedMessages.push({ type: 'date', date: formatDate(msg.created_at) });
            currentDate = msgDate;
        }
        groupedMessages.push({ type: 'message', data: msg });
    });

    if (!conversation) {
        return null;
    }

    // Extract thông tin người chat (không phải mình)
    let conversationName = 'Unknown';
    let otherUser = null;

    if (conversation.type === 'direct' && conversation.participants) {
        // Tìm participant không phải mình
        otherUser = conversation.participants.find(
            p => !(p.participantId === currentUserId && p.participantType === currentUserType)
        );

        if (otherUser) {
            conversationName = otherUser.fullName || otherUser.username || 'Unknown';
        }
    } else if (conversation.type === 'group') {
        conversationName = conversation.name || 'Group Chat';
    }

    const conversationAvatar = conversationName.substring(0, 2).toUpperCase();

    // Check if other user is online
    const isOtherUserOnline = otherUser
        ? onlineUsers.some(u => u.userId === otherUser.participantId && u.userType === otherUser.participantType)
        : false;

    return (
        <div className="chat-window">
            {/* Header */}
            <div className="chat-window-header">
                <div className="chat-header-info">
                    <div className="chat-avatar">{conversationAvatar}</div>
                    <div className="chat-header-text">
                        <h3>{conversationName}</h3>
                        <span className={`chat-status ${isOtherUserOnline ? 'online' : 'offline'}`}>
                            {isOtherUserOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                        </span>
                    </div>
                </div>
                <button className="close-chat-btn" onClick={onClose} title="Đóng">
                    ✕
                </button>
            </div>

            {/* Messages */}
            <div className="chat-messages" ref={messageListRef}>
                {groupedMessages.map((item, index) => {
                    if (item.type === 'date') {
                        return (
                            <div key={`date-${index}`} className="message-date-separator">
                                {item.date}
                            </div>
                        );
                    }

                    const msg = item.data;
                    const isOwn = msg.sender_id === currentUserId && msg.sender_type === currentUserType;
                    const senderName = msg.sender_username || 'Unknown';
                    const isEditing = editingMessageId === msg.id;
                    const isDeleted = msg.isDeleted;

                    // Get avatar URL (prepend server URL if needed)
                    const getAvatarUrl = (avatarUrl) => {
                        if (!avatarUrl) return null;
                        if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl;
                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                        const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
                        return `${baseUrl}${avatarUrl}`;
                    };
                    const senderAvatar = getAvatarUrl(msg.sender_avatar_url);

                    return (
                        <div key={msg.id} className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
                            {!isOwn && (
                                <div className="message-avatar" style={{
                                    backgroundImage: senderAvatar ? `url(${senderAvatar})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}>
                                    {!senderAvatar && senderName.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div className="message-content">
                                {!isOwn && conversation.type === 'group' && (
                                    <div className="message-sender">{senderName}</div>
                                )}
                                <div className="message-bubble">
                                    {/* Message Menu - hiện cho TẤT CẢ message types của mình, chưa bị xóa */}
                                    {isOwn && !isDeleted && !isEditing && (
                                        <MessageMenu
                                            messageId={msg.id}
                                            onEdit={handleEditMessage}
                                            onDelete={handleDeleteMessage}
                                            isOwn={isOwn}
                                            canEdit={msg.message_type === 'text'} // CHỈ cho edit text messages
                                        />
                                    )}

                                    {/* Hiển thị deleted message */}
                                    {isDeleted ? (
                                        <div className="deleted-message">
                                            <span className="deleted-text">Tin nhắn đã bị xóa</span>
                                        </div>
                                    ) : isEditing ? (
                                        /* Edit mode */
                                        <div className="edit-message-container">
                                            <input
                                                type="text"
                                                className="edit-message-input"
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSaveEdit(msg.id);
                                                    } else if (e.key === 'Escape') {
                                                        handleCancelEdit();
                                                    }
                                                }}
                                                autoFocus
                                            />
                                            <div className="edit-message-actions">
                                                <button
                                                    className="edit-btn save"
                                                    onClick={() => handleSaveEdit(msg.id)}
                                                >
                                                    Lưu
                                                </button>
                                                <button
                                                    className="edit-btn cancel"
                                                    onClick={handleCancelEdit}
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Normal message */
                                        <>
                                    {/* Hiển thị attachments nếu có nhiều ảnh */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="message-attachments">
                                            {msg.attachments.map((attachment, idx) => {
                                                const isImage = attachment.file_type && attachment.file_type.startsWith('image/');
                                                const fileUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${attachment.file_path}`;

                                                return isImage ? (
                                                    <div key={attachment.id || idx} className="message-attachment-image">
                                                        <img
                                                            src={fileUrl}
                                                            alt={attachment.file_name}
                                                            onClick={() => setLightboxImage(fileUrl)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div key={attachment.id || idx} className="message-attachment-file">
                                                        <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
                                                            <img src="/file_display.png" alt="File" className="file-icon" />
                                                            {attachment.file_name}
                                                        </a>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Hiển thị file nếu là image (old single file) */}
                                    {msg.message_type === 'image' && msg.file_url && (!msg.attachments || msg.attachments.length === 0) && (
                                        <div className="message-image">
                                            <img
                                                src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${msg.file_url}`}
                                                alt={msg.message_text}
                                                onClick={() => setLightboxImage(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${msg.file_url}`)}
                                            />
                                        </div>
                                    )}

                                    {/* Hiển thị file download link nếu là file (old single file) */}
                                    {msg.message_type === 'file' && msg.file_url && (!msg.attachments || msg.attachments.length === 0) && (
                                        <div className="message-file">
                                            <a
                                                href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${msg.file_url}`}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <img
                                                    src="/file_display.png"
                                                    alt="File"
                                                    className="file-icon"
                                                />
                                                {msg.message_text}
                                            </a>
                                        </div>
                                    )}

                                    {/* Text message hoặc caption */}
                                    {msg.message_text && (msg.message_type === 'text' || !msg.file_url || (msg.attachments && msg.attachments.length > 0)) && (
                                        <div className="message-text">{msg.message_text}</div>
                                    )}

                                    <div className="message-time">
                                        {formatTime(msg.created_at)}
                                        {msg.is_edited && <span className="edited-label"> (Đã chỉnh sửa)</span>}
                                    </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                    <div className="typing-indicator">
                        <div className="typing-avatar">
                            {typingUsers[0].username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div
                className={`chat-input-container ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Image Preview */}
                {selectedImages.length > 0 && (
                    <ImagePreview images={selectedImages} onRemove={removeImage} />
                )}

                {/* File Preview (old single file) */}
                {selectedFile && (
                    <div className="file-preview">
                        <div className="file-preview-content">
                            <img
                                src="/file_display.png"
                                alt="File"
                                className="file-preview-icon"
                            />
                            <span className="file-preview-name">{selectedFile.name}</span>
                            <span className="file-preview-size">
                                ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </span>
                            <button
                                type="button"
                                className="file-preview-remove"
                                onClick={handleRemoveFile}
                                title="Xóa file"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Drag overlay */}
                {isDragging && (
                    <div className="drag-overlay">
                        <div className="drag-overlay-content">
                            <span className="drag-icon">📷</span>
                            <p>Thả ảnh vào đây</p>
                        </div>
                    </div>
                )}

                <form className="chat-input-form" onSubmit={handleSendMessage}>
                    {/* Hidden file input - Cho phép chọn nhiều ảnh */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                    />

                    {/* Attachment button */}
                    <button
                        type="button"
                        className="chat-attach-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending || isUploading}
                        title="Đính kèm ảnh (hoặc kéo thả, paste)"
                    >
                        <img
                            src="/file_attachment.png"
                            alt="Attach"
                            style={{
                                width: '24px',
                                height: '24px',
                                opacity: (isSending || isUploading) ? 0.5 : 1
                            }}
                        />
                    </button>

                    <input
                        ref={chatInputRef}
                        type="text"
                        className="chat-input"
                        placeholder={isUploading ? "Đang upload..." : "Aa"}
                        value={messageInput}
                        onChange={(e) => {
                            setMessageInput(e.target.value);
                            handleTyping();
                        }}
                        onPaste={handlePaste}
                        disabled={isSending || isUploading}
                    />
                    <button
                        type="submit"
                        className="chat-send-btn"
                        disabled={(!messageInput.trim() && !selectedFile && selectedImages.length === 0) || isSending || isUploading}
                    >
                        {isSending || isUploading ? (
                            '...'
                        ) : (
                            <img
                                src="/send_button.png"
                                alt="Send"
                                style={{
                                    width: '50px',
                                    height: '50px',
                                }}
                            />
                        )}
                    </button>
                </form>
            </div>

            {/* Image Lightbox */}
            {lightboxImage && (
                <ImageLightbox
                    imageUrl={lightboxImage}
                    onClose={() => setLightboxImage(null)}
                />
            )}

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={confirmDelete.isOpen}
                title="Xóa tin nhắn"
                message="Bạn có chắc chắn muốn xóa tin nhắn này? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={confirmDeleteMessage}
                onCancel={cancelDeleteMessage}
                variant="danger"
            />
        </div>
    );
};

export default ChatWindow;
