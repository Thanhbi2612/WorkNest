// ================================================
// CHAT CONTEXT
// Context để lưu trữ state chat globally
// Giữ state khi chuyển trang (component unmount/mount)
// ================================================

import { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [userSidebarOpen, setUserSidebarOpen] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState([]);

    // Reset all chat state
    const resetChatState = useCallback(() => {
        setSelectedConversation(null);
        setMessages([]);
        setUserSidebarOpen(true);
    }, []);

    // Clear messages only
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    const value = {
        // State
        selectedConversation,
        messages,
        conversations,
        userSidebarOpen,
        onlineUsers,

        // Setters
        setSelectedConversation,
        setMessages,
        setConversations,
        setUserSidebarOpen,
        setOnlineUsers,

        // Actions
        resetChatState,
        clearMessages,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

// Custom hook để sử dụng ChatContext
export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within ChatProvider');
    }
    return context;
};

export default ChatContext;
