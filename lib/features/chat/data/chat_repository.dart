import 'dart:io';

import 'package:altayar/features/chat/data/chat_api.dart';
import 'package:altayar/features/chat/data/models/chat_message.dart';
import 'package:altayar/features/chat/data/models/chat_thread.dart';
import 'package:altayar/features/chat/data/models/chat_user.dart';

class ChatRepository {
  ChatRepository(this._api);

  final ChatApi _api;

  List<ChatThread>? _threadsCache;
  final Map<int, List<ChatMessage>> _messagesCache = {};

  Future<List<ChatThread>> getThreads({bool force = false}) async {
    if (!force && _threadsCache != null) return _threadsCache!;
    final data = await _api.fetchThreads();
    _threadsCache = data;
    return data;
  }

  Future<List<ChatMessage>> getMessages({
    required int chatId,
    required int currentUserId,
    bool force = false,
  }) async {
    if (!force && _messagesCache.containsKey(chatId)) {
      return _messagesCache[chatId]!;
    }
    final data = await _api.fetchMessages(chatId, currentUserId);
    _messagesCache[chatId] = data;
    return data;
  }

  Future<ChatThread?> startBotChat() async {
    final data = await _api.startBotChat();
    _threadsCache = null;
    return ChatThread.fromJson(data);
  }

  Future<void> startChatWithUser(int userId) async {
    await _api.startChatWithUser(userId);
    _threadsCache = null;
  }

  Future<ChatMessage?> sendMessage({
    required int chatId,
    String? content,
    File? attachment,
    required int currentUserId,
  }) async {
    final response = await _api.sendMessage(
      chatId: chatId,
      content: content,
      attachment: attachment,
    );
    final message = ChatMessage.fromJson(
      response,
      currentUserId: currentUserId,
    );
    final existing = _messagesCache[chatId] ?? [];
    _messagesCache[chatId] = [...existing, message];
    _threadsCache = _threadsCache?.map((thread) {
      if (thread.id == chatId) {
        return thread.copyWith(lastMessage: message.content, unreadCount: 0);
      }
      return thread;
    }).toList();
    return message;
  }

  Future<void> markAsRead(int chatId) async {
    await _api.markAsRead(chatId);
    _threadsCache = _threadsCache?.map((thread) {
      if (thread.id == chatId) {
        return thread.copyWith(unreadCount: 0);
      }
      return thread;
    }).toList();
  }

  Future<List<ChatUser>> getSupportDirectory() => _api.fetchSupportDirectory();

  Future<ChatMessage?> requestBotResponse({
    required int chatId,
    required String message,
    required int currentUserId,
  }) async {
    final response = await _api.sendGeminiMessage(
      chatId: chatId,
      message: message,
    );
    final botMessage = ChatMessage.fromJson(
      response,
      currentUserId: currentUserId,
    );
    final existing = _messagesCache[chatId] ?? [];
    _messagesCache[chatId] = [...existing, botMessage];
    return botMessage;
  }
}
