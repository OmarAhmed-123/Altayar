import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/url_builder.dart';
import 'package:altayar/features/chat/data/models/chat_attachment.dart';

class ChatMessage extends Equatable {
  const ChatMessage({
    required this.id,
    required this.chatId,
    required this.senderId,
    required this.senderName,
    required this.content,
    required this.createdAt,
    required this.isMine,
    required this.isBot,
    this.attachments = const [],
    this.status,
  });

  final int id;
  final int chatId;
  final int senderId;
  final String senderName;
  final String content;
  final DateTime createdAt;
  final bool isMine;
  final bool isBot;
  final List<ChatAttachment> attachments;
  final String? status;

  factory ChatMessage.fromJson(
    Map<String, dynamic> json, {
    required int currentUserId,
  }) {
    final sender = json['sender'] as Map<String, dynamic>? ?? {};
    final senderId = sender['id'] as int? ??
        json['sender_id'] as int? ??
        json['user_id'] as int? ??
        0;
    return ChatMessage(
      id: json['id'] as int? ?? json['message_id'] as int? ?? 0,
      chatId: json['chat_id'] as int? ?? json['chatId'] as int? ?? 0,
      senderId: senderId,
      senderName: sender['name']?.toString() ??
          json['sender_name']?.toString() ??
          'عضو',
      content: json['content']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
      isMine: senderId == currentUserId,
      isBot: sender['role']?.toString() == 'bot' ||
          (json['is_bot'] as bool? ?? false),
      attachments: _parseAttachments(json),
      status: json['status']?.toString(),
    );
  }

  @override
  List<Object?> get props => [id, content, createdAt, attachments, status];

  static List<ChatAttachment> _parseAttachments(
    Map<String, dynamic> json,
  ) {
    final list = (json['attachments'] as List<dynamic>?)
            ?.whereType<Map<String, dynamic>>()
            .map(ChatAttachment.fromJson)
            .toList() ??
        <ChatAttachment>[];
    if (list.isNotEmpty) return list;
    final url =
        json['attachment_url']?.toString() ?? json['attachmentUrl']?.toString();
    if (url == null || url.isEmpty || url.toLowerCase() == 'null') {
      return const [];
    }
    return [
      ChatAttachment(
        url: UrlBuilder.resolveMedia(url),
        name: json['attachment_name']?.toString(),
        mime: json['attachment_type']?.toString(),
        type: (json['attachment_type']?.toString() ?? '').startsWith('image/')
            ? ChatAttachmentType.image
            : ChatAttachmentType.file,
      ),
    ];
  }
}
