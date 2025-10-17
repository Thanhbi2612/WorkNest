// ================================================
// CHAT CONTAINER
// Container chính cho chat feature
// Logic xử lý được giữ nguyên, UI sẽ làm sau
// ================================================

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import chatService from '../../services/chatService';
import { notificationService } from '../../services/notificationService';
import toast from 'react-hot-toast';
import UserListSidebar from './UserListSidebar';
import ChatWindow from './ChatWindow';

const ChatContainer = () => {
    const location = useLocation();
    const { socket, isConnected } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(() => {
        // Restore từ sessionStorage khi mount
        const saved = sessionStorage.getItem('selectedConversation');
        return saved ? JSON.parse(saved) : null;
    });
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userSidebarOpen, setUserSidebarOpen] = useState(() => {
        // Restore trạng thái sidebar từ sessionStorage
        const saved = sessionStorage.getItem('userSidebarOpen');
        // Nếu chưa có trong storage, mặc định là true (mở)
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [onlineUsers, setOnlineUsers] = useState([]); // Track online users
    const [isLoadingMessages, setIsLoadingMessages] = useState(false); // Track message loading state

    // ================================================
    // SAVE SELECTED CONVERSATION TO SESSION STORAGE
    // ================================================
    useEffect(() => {
        if (selectedConversation) {
            sessionStorage.setItem('selectedConversation', JSON.stringify(selectedConversation));
        } else {
            sessionStorage.removeItem('selectedConversation');
        }
    }, [selectedConversation]);

    // ================================================
    // SAVE USER SIDEBAR STATE TO SESSION STORAGE
    // ================================================
    useEffect(() => {
        sessionStorage.setItem('userSidebarOpen', JSON.stringify(userSidebarOpen));
    }, [userSidebarOpen]);

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
    // HANDLE USER CLICK - Create or open conversation
    // ================================================
    const handleUserClick = useCallback(async (user) => {
        try {
            // Create or get existing conversation with this user
            const response = await chatService.createOrGetConversation({
                participantId: user.id,
                participantType: user.userType
            });

            if (response.success) {
                const conversation = response.data.conversation;

                // Update conversations list if it's a new conversation
                setConversations(prev => {
                    const exists = prev.find(c => c.id === conversation.id);
                    if (!exists) {
                        return [conversation, ...prev];
                    }
                    return prev;
                });

                // Select this conversation
                handleSelectConversation(conversation);

                // Close sidebar on mobile after selection
                if (window.innerWidth < 768) {
                    setUserSidebarOpen(false);
                }
            } else {
                toast.error('Không thể tạo cuộc trò chuyện');
            }
        } catch (err) {
            console.error('Error creating conversation:', err);
            toast.error('Không thể tạo cuộc trò chuyện');
        }
    }, []);

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
            setIsLoadingMessages(true); // Bắt đầu loading messages
            const response = await chatService.getMessages(conversation.id);
            if (response.success) {
                setMessages(response.data.messages || []);
            }
        } catch (err) {
            console.error('Error loading messages:', err);
            toast.error('Không thể tải tin nhắn');
        } finally {
            setIsLoadingMessages(false); // Kết thúc loading messages
        }

        // Đánh dấu conversation đã đọc và xóa message notifications
        try {
            await chatService.markAsRead(conversation.id);

            // Trigger refresh notification counts để badge biến mất
            window.dispatchEvent(new CustomEvent('refreshNotificationCounts'));
        } catch (err) {
            console.error('Error marking conversation as read:', err);
        }
    }, [socket, isConnected]);

    // ================================================
    // RESTORE MESSAGES FOR SELECTED CONVERSATION ON MOUNT
    // ================================================
    const [hasRestored, setHasRestored] = useState(false);

    useEffect(() => {
        // Chỉ chạy 1 lần khi mount và có selectedConversation từ sessionStorage
        if (selectedConversation && !hasRestored && !loading) {
            setHasRestored(true);
            handleSelectConversation(selectedConversation);
        }
    }, [selectedConversation, hasRestored, loading, handleSelectConversation]);

    // ================================================
    // HANDLE NAVIGATION STATE - Open conversation from notification
    // ================================================
    useEffect(() => {
        const openConversationId = location.state?.openConversationId;

        if (openConversationId && conversations.length > 0) {
            // Find conversation by ID
            const conversation = conversations.find(c => c.id === openConversationId);

            if (conversation) {
                handleSelectConversation(conversation);
            } else {
                // If conversation not found in list, fetch it from API
                const fetchConversation = async () => {
                    try {
                        const response = await chatService.getConversations();
                        if (response.success) {
                            const allConversations = response.data.conversations || [];
                            const targetConversation = allConversations.find(c => c.id === openConversationId);

                            if (targetConversation) {
                                setConversations(allConversations);
                                handleSelectConversation(targetConversation);
                            }
                        }
                    } catch (error) {
                        console.error('Failed to fetch conversation:', error);
                        toast.error('Không thể mở cuộc trò chuyện');
                    }
                };

                fetchConversation();
            }

            // Clear navigation state sau khi xử lý
            window.history.replaceState({}, document.title);
        }
    }, [location.state, conversations, handleSelectConversation]);

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
                setMessages(prev => {
                    // Xóa tất cả temp messages (messages có id bắt đầu bằng "temp-")
                    const filteredMessages = prev.filter(m => !m.id.toString().startsWith('temp-'));
                    // Thêm message thật từ backend
                    return [...filteredMessages, message];
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

    // ================================================
    // DETECT SIDEBAR STATE
    // ================================================
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        const checkSidebarState = () => {
            const mainContent = document.querySelector('.main-content');
            const isCollapsed = mainContent?.classList.contains('sidebar-collapsed');
            setSidebarCollapsed(isCollapsed || false);
        };

        // Check initial state
        checkSidebarState();

        // Listen for sidebar toggle (check every animation frame during transition)
        const observer = new MutationObserver(checkSidebarState);
        const mainContent = document.querySelector('.main-content');

        if (mainContent) {
            observer.observe(mainContent, {
                attributes: true,
                attributeFilter: ['class']
            });
        }

        return () => observer.disconnect();
    }, []);

    // ================================================
    // RENDER - EMPTY STATE WITH USER SIDEBAR
    // ================================================
    return (
        <div style={{
            position: 'fixed',
            top: '60px',
            left: sidebarCollapsed ? '0' : '280px',
            right: '0',
            bottom: '0',
            display: 'flex',
            overflow: 'hidden',
            transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            {/* Toggle Button - Floating */}
            <button
                onClick={() => setUserSidebarOpen(!userSidebarOpen)}
                style={{
                    position: 'fixed',
                    top: '80px',
                    right: '20px',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    zIndex: 100
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
                title="Danh sách người dùng"
            >
                <img
                    src="/group_user.png"
                    alt="Users"
                    style={{ width: '28px', height: '28px' }}
                />
            </button>

            {/* Main Chat Area */}
            {selectedConversation ? (
                <ChatWindow
                    conversation={selectedConversation}
                    messages={messages}
                    setMessages={setMessages}
                    socket={socket}
                    isConnected={isConnected}
                    onClose={() => setSelectedConversation(null)}
                    onlineUsers={onlineUsers}
                    isLoadingMessages={isLoadingMessages}
                />
            ) : (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    flexDirection: 'column',
                    gap: '1rem',
                    padding: '2rem'
                }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9ca3af' }}>
                         Trò chuyện
                    </h2>
                    <p style={{ fontSize: '1rem', color: '#6b7280' }}>
                        Phần chat của bạn sẽ hiển thị ở đây, hãy chọn người dùng muốn chat...
                    </p>
                </div>
            )}

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
