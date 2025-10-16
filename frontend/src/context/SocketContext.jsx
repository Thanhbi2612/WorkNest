// ================================================
// SOCKET CONTEXT
// Quản lý WebSocket connection với Socket.IO
// ================================================

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const { user } = useAuth();
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    useEffect(() => {
        // Lấy token từ localStorage
        const token = localStorage.getItem('accessToken');

        // Chỉ connect khi user đã login và có token
        if (!user || !token) {
            // Disconnect nếu đang connect
            if (socket) {
                console.log('🔌 Disconnecting socket (user logged out)');
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // Tạo socket connection
        const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

        const newSocket = io(SOCKET_URL, {
            auth: {
                token: token
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: maxReconnectAttempts,
            transports: ['websocket', 'polling']
        });

        // Connection events
        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            setIsConnected(true);
            setConnectionError(null);
            reconnectAttempts.current = 0;
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            setIsConnected(false);

            if (reason === 'io server disconnect') {
                // Server forced disconnect, try to reconnect manually
                console.log('🔄 Server disconnected, attempting to reconnect...');
                newSocket.connect();
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('🔥 Socket connection error:', error.message);
            setConnectionError(error.message);
            reconnectAttempts.current += 1;

            if (reconnectAttempts.current >= maxReconnectAttempts) {
                console.error('❌ Max reconnection attempts reached');
                setConnectionError('Failed to connect after multiple attempts');
            }
        });

        newSocket.on('error', (error) => {
            console.error('🔥 Socket error:', error);
            setConnectionError(error.message || 'Socket error occurred');
        });

        // Reconnection events
        newSocket.io.on('reconnect', (attemptNumber) => {
            console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
            reconnectAttempts.current = 0;
        });

        newSocket.io.on('reconnect_attempt', (attemptNumber) => {
            console.log('🔄 Reconnection attempt:', attemptNumber);
        });

        newSocket.io.on('reconnect_error', (error) => {
            console.error('🔥 Reconnection error:', error.message);
        });

        newSocket.io.on('reconnect_failed', () => {
            console.error('❌ Reconnection failed');
            setConnectionError('Reconnection failed');
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            console.log('🔌 Cleaning up socket connection');
            newSocket.disconnect();
            setSocket(null);
            setIsConnected(false);
        };
    }, [user]); // Chỉ depend on user, token lấy trực tiếp từ localStorage

    const value = {
        socket,
        isConnected,
        connectionError
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;
