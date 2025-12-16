import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as p;

import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/chat/data/models/chat_message.dart';
import 'package:altayar/features/chat/data/models/chat_thread.dart';
import 'package:altayar/features/chat/data/models/chat_user.dart';

class ChatApi {
  ChatApi(this._client);

  final ApiClient _client;

  Future<List<ChatThread>> fetchThreads() async {
    final response = await _client.get('chat');
    final data = response.data as List<dynamic>? ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(ChatThread.fromJson)
        .toList();
  }

  Future<List<ChatMessage>> fetchMessages(
    int chatId,
    int currentUserId,
  ) async {
    final response = await _client.get('chat/message/$chatId');
    final data = response.data as List<dynamic>? ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(
          (item) => ChatMessage.fromJson(
            item,
            currentUserId: currentUserId,
          ),
        )
        .toList();
  }

  Future<Map<String, dynamic>> startBotChat() async {
    final response = await _client.post('chat/bot');
    return response.data as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> startChatWithUser(int userId) async {
    final response = await _client.post(
      'chat',
      body: {'userId': userId},
    );
    return response.data as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> sendMessage({
    required int chatId,
    String? content,
    File? attachment,
  }) async {
    if (attachment != null) {
      final fileName = p.basename(attachment.path);
      final extension = p.extension(fileName).toLowerCase();
      final mimeType = _getMimeTypeFromExtension(extension);

      final file = await http.MultipartFile.fromPath(
        'file',
        attachment.path,
        filename: fileName,
        contentType: mimeType != null ? MediaType.parse(mimeType) : null,
      );
      final result = await _client.postMultipart(
        'chat/message',
        fields: {
          'chatId': chatId.toString(),
          'content': content ?? '',
        },
        files: [file],
      );
      return result.data as Map<String, dynamic>? ?? {};
    }
    final response = await _client.post(
      'chat/message',
      body: {
        'chatId': chatId,
        'content': content,
      },
    );
    return response.data as Map<String, dynamic>? ?? {};
  }

  String? _getMimeTypeFromExtension(String extension) {
    const mimeTypes = {
      // Images
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      // Videos
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.3gp': 'video/3gpp',
      '.mpeg': 'video/mpeg',
      '.mpg': 'video/mpeg',
      // Documents
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf',
      '.odt': 'application/vnd.oasis.opendocument.text',
      '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
      // Archives
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
      // Audio
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
    };
    return mimeTypes[extension];
  }

  Future<void> markAsRead(int chatId) {
    return _client.post('chat/message/$chatId/read');
  }

  Future<List<ChatUser>> fetchSupportDirectory() async {
    final response = await _client.get('chat/users');
    final data = response.data as List<dynamic>? ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(ChatUser.fromJson)
        .toList();
  }

  Future<Map<String, dynamic>> sendGeminiMessage({
    required int chatId,
    required String message,
  }) async {
    final response = await _client.post(
      'chat/gemini/bot',
      body: {
        'chatId': chatId,
        'message': message,
      },
    );
    return response.data as Map<String, dynamic>? ?? {};
  }
}
