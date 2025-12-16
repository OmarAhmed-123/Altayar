import 'dart:async';
import 'dart:collection';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import 'package:altayar/core/config/app_config.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/chat/data/chat_repository.dart';
import 'package:altayar/features/chat/data/models/chat_message.dart';
import 'package:altayar/features/chat/data/models/chat_thread.dart';
import 'package:altayar/features/chat/data/models/chat_user.dart';

class ChatProvider extends ChangeNotifier {
  ChatProvider(this._repository, AuthProvider authProvider)
      : _authProvider = authProvider;

  final ChatRepository _repository;
  AuthProvider _authProvider;

  List<ChatThread> threads = [];
  List<ChatMessage> currentMessages = [];
  List<ChatUser> supportDirectory = [];

  ChatThread? activeThread;
  int? _joinedChatId;

  bool isLoadingThreads = false;
  bool isLoadingMessages = false;
  bool isSending = false;
  bool isLoadingSupport = false;

  String? errorMessage;
  Timer? _poller;
  io.Socket? _socket;
  // ignore: unused_field
  bool _socketConnected = false;
  final Set<int> _knownMessageIds = <int>{};
  final Set<String> _messageFingerprints = <String>{};
  final ListQueue<String> _fingerprintQueue = ListQueue<String>();
  static const int _fingerprintWindow = 250;

  int get currentUserId => _authProvider.currentUser?.id ?? 0;

  void updateAuth(AuthProvider newAuth) {
    final previousUserId = _authProvider.currentUser?.id;
    _authProvider = newAuth;
    final newUserId = _authProvider.currentUser?.id;
    if (previousUserId != newUserId) {
      _reconnectSocket();
    }
    notifyListeners();
  }

  void initializeRealtime() {
    loadThreads();
    startPolling();
    _connectSocket();
  }

  void disposeRealtime() {
    disposePolling();
    _disconnectSocket();
  }

  void startPolling() {
    _poller?.cancel();
    _poller = Timer.periodic(const Duration(seconds: 15), (_) {
      if (_authProvider.isAuthenticated) {
        loadThreads();
      }
    });
  }

  void disposePolling() {
    _poller?.cancel();
    _poller = null;
  }

  Future<void> loadThreads({bool refresh = false}) async {
    if (!_authProvider.isAuthenticated) return;
    isLoadingThreads = true;
    notifyListeners();
    try {
      threads = await _repository.getThreads(force: refresh);
      errorMessage = null;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isLoadingThreads = false;
      notifyListeners();
    }
  }

  Future<void> selectThread(ChatThread thread) async {
    activeThread = thread;
    await loadMessages(thread.id);
    await _repository.markAsRead(thread.id);
    _joinChatRoom(thread.id);
    notifyListeners();
  }

  Future<void> loadMessages(int chatId, {bool refresh = false}) async {
    isLoadingMessages = true;
    notifyListeners();
    try {
      currentMessages = await _repository.getMessages(
        chatId: chatId,
        currentUserId: currentUserId,
        force: refresh,
      );
      _knownMessageIds
        ..clear()
        ..addAll(
          currentMessages.where((msg) => msg.id > 0).map((msg) => msg.id),
        );
      _messageFingerprints.clear();
      _fingerprintQueue.clear();
      for (final message in currentMessages) {
        final fingerprint = _fingerprint(message);
        _messageFingerprints.add(fingerprint);
        _fingerprintQueue.addLast(fingerprint);
      }
      errorMessage = null;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isLoadingMessages = false;
      notifyListeners();
    }
  }

  Future<void> sendMessage({required String content, File? attachment}) async {
    final thread = activeThread;
    if (thread == null) return;
    isSending = true;
    notifyListeners();
    try {
      final message = await _repository.sendMessage(
        chatId: thread.id,
        content: content,
        attachment: attachment,
        currentUserId: currentUserId,
      );
      if (message != null) {
        _appendMessage(message);
        threads = threads
            .map(
              (item) => item.id == thread.id
                  ? item.copyWith(unreadCount: 0, lastMessage: message.content)
                  : item,
            )
            .toList();
      }
      if (thread.isBot && content.trim().isNotEmpty) {
        unawaited(requestBotReply(content));
      }
      errorMessage = null;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isSending = false;
      notifyListeners();
    }
  }

  Future<void> requestBotReply(String prompt) async {
    final thread = activeThread;
    if (thread == null) return;
    try {
      final message = await _repository.requestBotResponse(
        chatId: thread.id,
        message: prompt,
        currentUserId: currentUserId,
      );
      if (message != null) {
        _appendMessage(message);
        threads = threads
            .map(
              (item) => item.id == thread.id
                  ? item.copyWith(lastMessage: message.content)
                  : item,
            )
            .toList();
        notifyListeners();
      } else {
        await loadMessages(thread.id, refresh: true);
      }
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
    }
  }

  Future<void> startBotConversation() async {
    try {
      final thread = await _repository.startBotChat();
      if (thread != null) {
        await loadThreads(refresh: true);
        await selectThread(thread);
      }
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
    }
  }

  Future<void> startSupportChat(int userId) async {
    try {
      await _repository.startChatWithUser(userId);
      await loadThreads(refresh: true);
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
    }
  }

  Future<void> loadSupportDirectory() async {
    isLoadingSupport = true;
    notifyListeners();
    try {
      supportDirectory = await _repository.getSupportDirectory();
      errorMessage = null;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isLoadingSupport = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    disposePolling();
    _disconnectSocket();
    super.dispose();
  }

  void _connectSocket() {
    final token = _authProvider.currentUser?.token;
    if (token == null || token.isEmpty) return;
    if (_socket != null) return;
    final base = AppConfig.resolvedBaseUrl();
    final origin = base.replaceFirst(RegExp(r'/api/?$'), '');
    _socket = io.io(
      origin,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .enableForceNew()
          .build(),
    );
    _socket!
      ..onConnect((_) {
        _socketConnected = true;
        _socket!.emit('setup', {'id': currentUserId});
      })
      ..onDisconnect((_) {
        _socketConnected = false;
      })
      ..on('message received', (data) {
        if (data is Map<String, dynamic>) {
          _handleIncomingMessage(data);
        } else if (data is Map) {
          _handleIncomingMessage(Map<String, dynamic>.from(data));
        }
      })
      ..onError((error) {
        debugPrint('[Socket] error: $error');
      });
    _socket!.connect();
  }

  void _disconnectSocket() {
    _socketConnected = false;
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _joinedChatId = null;
  }

  void _reconnectSocket() {
    _disconnectSocket();
    if (_authProvider.isAuthenticated) {
      _connectSocket();
    }
  }

  void _joinChatRoom(int chatId) {
    if (_joinedChatId == chatId) return;
    if (_joinedChatId != null) {
      _socket?.emit('leave chat', _joinedChatId);
    }
    _joinedChatId = chatId;
    _socket?.emit('join chat', chatId);
  }

  void _handleIncomingMessage(Map<String, dynamic> data) {
    final chatId = data['chat_id'] ?? data['chatId'];
    if (chatId == null) return;
    final message = ChatMessage.fromJson(data, currentUserId: currentUserId);
    if (activeThread?.id == chatId) {
      final inserted = _appendMessage(message);
      if (inserted) {
        _repository.markAsRead(chatId);
      }
    }
    threads = threads.map((thread) {
      if (thread.id != chatId) return thread;
      final unread =
          thread.id == activeThread?.id ? 0 : (thread.unreadCount + 1);
      return thread.copyWith(unreadCount: unread, lastMessage: message.content);
    }).toList();
    notifyListeners();
  }

  bool _appendMessage(ChatMessage message) {
    if (message.id > 0 && _knownMessageIds.contains(message.id)) {
      return false;
    }
    final fingerprint = _fingerprint(message);
    if (_messageFingerprints.contains(fingerprint)) {
      return false;
    }
    if (message.id > 0) {
      _knownMessageIds.add(message.id);
    }
    _rememberFingerprint(fingerprint);
    currentMessages = [...currentMessages, message];
    return true;
  }

  void _rememberFingerprint(String fingerprint) {
    _messageFingerprints.add(fingerprint);
    _fingerprintQueue.addLast(fingerprint);
    if (_fingerprintQueue.length > _fingerprintWindow) {
      final oldest = _fingerprintQueue.removeFirst();
      _messageFingerprints.remove(oldest);
    }
  }

  String _fingerprint(ChatMessage message) {
    final attachmentKey = message.attachments.map((att) => att.url).join('|');
    return '${message.senderId}|${message.content}|${message.createdAt.toIso8601String()}|$attachmentKey';
  }
}
