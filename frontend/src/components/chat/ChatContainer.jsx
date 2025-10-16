// ================================================
// CHAT CONTAINER
// Container chính cho chat feature
// Logic xử lý được giữ nguyên, UI sẽ làm sau
// ================================================

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useChatContext } from '../../context/ChatContext';
import chatService from '../../services/chatService';
import toast from 'react-hot-toast';
import UserListSidebar from './UserListSidebar';
import ChatWindow from './ChatWindow';
import './ChatContainer.css';

const ChatContainer = () => {
    const { socket, isConnected } = useSocket();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sử dụng ChatContext thay vì local state
    const {
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
        messages,
        setMessages,
        userSidebarOpen,
        setUserSidebarOpen,
        onlineUsers,
        setOnlineUsers,
    } = useChatContext();

    // ================================================
    // FETCH CONVERSATIONS
    // ================================================
    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await chatService.getConversations();

            if (response.success) {
                setConversations(response.data.conversations || []);
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setError('Failed to load conversations');
            toast.error('Không thể tải danh sách hội thoại');
        } finally {
            setLoading(false);
        }
    };

    // ================================================
    // HANDLE SELECT CONVERSATION
    // ================================================
    const handleSelectConversation = useCallback(async (conversation) => {
        setSelectedConversation(conversation);

        // Join conversation room qua socket
        if (socket && isConnected) {
            socket.emit('join_conversation',
                { conversationId: conversation.id },
                (response) => {
                    if (response.success) {
                        console.log('✅ Joined conversation:', conversation.id);
                    } else {
                        console.error('❌ Failed to join conversation:', response.message);
                        toast.error('Không thể tham gia hội thoại');
                    }
                }
            );
        }

        // Load messages
        try {
            const response = await chatService.getMessages(conversation.id);
            if (response.success) {
                setMessages(response.data.messages || []);
            }
        } catch (err) {
            console.error('Error loading messages:', err);
            toast.error('Không thể tải tin nhắn');
        }
    }, [socket, isConnected]);

    // ================================================
    // LISTEN FOR NEW MESSAGES
    // ================================================
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (data) => {
            console.log('📨 New message received:', data);
            const { message } = data;

            // Nếu message thuộc conversation đang mở
            if (selectedConversation && message.conversation_id === selectedConversation.id) {
                // Kiểm tra xem message đã tồn tại chưa (tránh duplicate)
                setMessages(prev => {
                    const exists = prev.some(m => m.id === message.id);
                    if (exists) {
                        return prev; // Đã có rồi, không thêm
                    }
                    return [...prev, message];
                });
            }

            // Update last message trong conversations list
            setConversations(prev => prev.map(conv => {
                if (conv.id === message.conversation_id) {
                    return {
                        ...conv,
                        last_message: {
                            messageText: message.message_text,
                            createdAt: message.created_at,
                            senderName: message.sender_username
                        },
                        unread_count: conv.id === selectedConversation?.id
                            ? conv.unread_count
                            : (conv.unread_count || 0) + 1
                    };
                }
                return conv;
            }));
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [socket, selectedConversation]);

    // ================================================
    // HANDLE TYPING INDICATORS
    // ================================================
    useEffect(() => {
        if (!socket) return;

        const handleUserTyping = (data) => {
            console.log('⌨️  User typing:', data.username);
            // TODO: Show typing indicator in UI
        };

        const handleUserStoppedTyping = (data) => {
            console.log('⌨️  User stopped typing:', data.username);
            // TODO: Hide typing indicator in UI
        };

        socket.on('user_typing', handleUserTyping);
        socket.on('user_stopped_typing', handleUserStoppedTyping);

        return () => {
            socket.off('user_typing', handleUserTyping);
            socket.off('user_stopped_typing', handleUserStoppedTyping);
        };
    }, [socket]);

    // Handle user click from sidebar
    const handleUserClick = async (user) => {
        try {
            // Create or get direct conversation
            const response = await chatService.createDirectConversation(user.id, user.userType);

            if (response.success) {
                const conversation = response.data.conversation;
                // Select conversation
                handleSelectConversation(conversation);
                // Đóng sidebar sau khi chọn user
                setUserSidebarOpen(false);
            } else {
                toast.error('Không thể tạo hội thoại');
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            toast.error('Không thể tạo hội thoại');
        }
    };

    // Handle close chat
    const handleCloseChat = () => {
        setSelectedConversation(null);
        setMessages([]);
    };

    // ================================================
    // HANDLE NAVIGATION FROM NOTIFICATION
    // Auto-open conversation when navigating from notification
    // ================================================
    useEffect(() => {
        if (location.state?.openConversationId && conversations.length > 0) {
            const conversationId = location.state.openConversationId;

            // Find conversation by ID
            const conversation = conversations.find(c => c.id === conversationId);

            if (conversation) {
                // Select conversation
                handleSelectConversation(conversation);
                // Close sidebar
                setUserSidebarOpen(false);
            } else {
                console.warn('Conversation not found:', conversationId);
                toast.error('Không tìm thấy hội thoại');
            }

            // Clear navigation state
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, conversations, navigate, location.pathname, handleSelectConversation]);

    // ================================================
    // RENDER - RESPONSIVE LAYOUT
    // ================================================
    return (
        <div className="chat-container-main">
            {/* Toggle Button - Floating */}
            <button
                className="user-list-toggle-btn"
                onClick={() => setUserSidebarOpen(!userSidebarOpen)}
                title="Danh sách người dùng"
            >
                <img
                    src="/group_user.png"
                    alt="Users"
                    style={{
                        width: '28px',
                        height: '28px',
                        filter: 'brightness(0) invert(1)'
                    }}
                />
            </button>

            {/* Chat Area */}
            <div className={`chat-area ${userSidebarOpen ? 'sidebar-open' : ''}`}>
                {selectedConversation ? (
                    <ChatWindow
                        conversation={selectedConversation}
                        messages={messages}
                        setMessages={setMessages}
                        socket={socket}
                        isConnected={isConnected}
                        onClose={handleCloseChat}
                        onlineUsers={onlineUsers}
                    />
                ) : (
                    <div className="chat-empty-state">
                        <h2>💬 Trò chuyện</h2>
                        <p>Phần chat của bạn sẽ hiển thị ở đây, hãy chọn người dùng muốn chat...</p>
                    </div>
                )}
            </div>

            {/* User List Sidebar */}
            <UserListSidebar
                isOpen={userSidebarOpen}
                onClose={() => setUserSidebarOpen(false)}
                onUserClick={handleUserClick}
                onlineUsers={onlineUsers}
                setOnlineUsers={setOnlineUsers}
            />
        </div>
    );
};

export default ChatContainer;
