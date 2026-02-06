/**
 * Socket.IO Service for Real-time Communication
 * Handles all Socket.IO connections and events for Live Chat
 */

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/theme';

// Extract base URL without /api
const SOCKET_URL = API_BASE_URL.replace('/api', '');

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  /**
   * Initialize Socket.IO connection
   */
  async connect(userId: number, userName: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create socket connection with authentication
      this.socket = io(SOCKET_URL, {
        auth: {
          token: token,
        },
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('[Socket] Connected:', this.socket?.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Setup user room (userId is already available from auth)
        this.socket?.emit('setup', { id: userId, name: userName });
      });

      this.socket.on('connected', () => {
        console.log('[Socket] Setup complete');
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error.message);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('[Socket] Max reconnection attempts reached');
        }
      });

      // Message event handlers
      this.socket.on('message received', (newMessage) => {
        console.log('[Socket] Message received:', newMessage);
        this.emit('message received', newMessage);
      });

      this.socket.on('typing', (data) => {
        this.emit('typing', data);
      });

      this.socket.on('stop typing', (data) => {
        this.emit('stop typing', data);
      });

      this.socket.on('user online', (data) => {
        this.emit('user online', data);
      });

      this.socket.on('user offline', (data) => {
        this.emit('user offline', data);
      });

      this.socket.on('notification', (data) => {
        this.emit('notification', data);
      });

    } catch (error) {
      console.error('[Socket] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect Socket.IO
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  /**
   * Join a chat room
   */
  joinChat(chatId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('join chat', chatId);
      console.log('[Socket] Joined chat:', chatId);
    } else {
      console.warn('[Socket] Cannot join chat - socket not connected');
    }
  }

  /**
   * Leave a chat room
   */
  leaveChat(chatId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('leave chat', chatId);
      console.log('[Socket] Left chat:', chatId);
    }
  }

  /**
   * Send a new message via Socket.IO
   */
  sendMessage(messageData: {
    chatId: number;
    content: string;
    sender: { id: number; name: string };
    chat: { participants: Array<{ id: number }> };
  }): void {
    if (this.socket?.connected) {
      this.socket.emit('new message', messageData);
      console.log('[Socket] Message sent:', messageData);
    }
  }

  /**
   * Send typing indicator
   */
  sendTyping(chatId: number, userId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { chatId, userId });
    }
  }

  /**
   * Stop typing indicator
   */
  stopTyping(chatId: number, userId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('stop typing', { chatId, userId });
    }
  }

  /**
   * Subscribe to an event
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback?: (data: any) => void): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Check if socket is connected
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get socket instance
   */
  get socketInstance(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();

