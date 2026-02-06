/**
 * Chat Service
 * Uses the unified API client
 */
import { API } from './apiClient';

export const chatService = {
  getBotInfo: API.chat.getBotInfo,
  startBotChat: API.chat.startBotChat,
  accessChat: API.chat.accessChat,
  fetchChats: API.chat.fetchChats,
  sendMessage: API.chat.sendMessage,
  allMessages: API.chat.allMessages,
  getAllUsersForChat: API.chat.getAllUsersForChat,
  markMessagesAsRead: API.chat.markMessagesAsRead,
  sendGeminiBotMessage: API.chat.sendGeminiBotMessage,
};

