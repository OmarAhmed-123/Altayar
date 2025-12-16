import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/url_builder.dart';

class ChatThread extends Equatable {
  const ChatThread({
    required this.id,
    required this.title,
    required this.lastMessage,
    required this.updatedAt,
    required this.unreadCount,
    required this.isBot,
    this.avatarUrl,
  });

  final int id;
  final String title;
  final String lastMessage;
  final DateTime updatedAt;
  final int unreadCount;
  final bool isBot;
  final String? avatarUrl;

  factory ChatThread.fromJson(Map<String, dynamic> json) {
    // Check if it's a bot chat by checking participants or email
    final participants = json['participants'] as List<dynamic>?;
    final otherParticipant = json['other_participant'] as Map<String, dynamic>?;
    final user = json['user'] as Map<String, dynamic>?;

    // Determine if it's a bot chat
    bool isBot = json['is_bot'] as bool? ?? false;
    if (!isBot && otherParticipant != null) {
      final email = otherParticipant['email']?.toString() ?? '';
      isBot = email.toLowerCase() == 'bot@altayar.com' ||
          otherParticipant['role']?.toString().toLowerCase() == 'bot';
    }
    if (!isBot && user != null) {
      final email = user['email']?.toString() ?? '';
      isBot = email.toLowerCase() == 'bot@altayar.com' ||
          user['role']?.toString().toLowerCase() == 'bot';
    }

    // Get the name from multiple possible sources
    String? userName;
    String? avatarUrl;

    // Priority: other_participant > user > participants[0]
    if (otherParticipant != null) {
      userName = otherParticipant['name']?.toString();
      avatarUrl = otherParticipant['avatar']?.toString() ??
          otherParticipant['profile_picture_url']?.toString();
    } else if (user != null) {
      userName = user['name']?.toString();
      avatarUrl =
          user['avatar']?.toString() ?? user['profile_picture_url']?.toString();
    } else if (participants != null && participants.isNotEmpty) {
      final participant = participants.first as Map<String, dynamic>?;
      userName = participant?['name']?.toString();
      avatarUrl = participant?['avatar']?.toString() ??
          participant?['profile_picture_url']?.toString();
    }

    // For bot chats, use "الشات بوت", otherwise use participant name or chat_name
    String title;
    if (isBot) {
      title = 'الشات بوت';
    } else {
      // Use chat_name from backend (which contains the participant's name) or fallback to userName
      title = json['chat_name']?.toString() ??
          userName ??
          json['title']?.toString() ??
          'محادثة';
    }

    return ChatThread(
      id: json['id'] as int? ?? json['chat_id'] as int? ?? 0,
      title: title,
      lastMessage: json['last_message']?.toString() ??
          json['lastMessage']?.toString() ??
          'ابدأ المحادثة الآن',
      updatedAt: DateTime.tryParse(json['updated_at']?.toString() ?? '') ??
          DateTime.now(),
      unreadCount: json['unread_count'] as int? ?? json['unread'] as int? ?? 0,
      isBot: isBot,
      avatarUrl: UrlBuilder.resolveMedia(avatarUrl),
    );
  }

  ChatThread copyWith({int? unreadCount, String? lastMessage}) {
    return ChatThread(
      id: id,
      title: title,
      lastMessage: lastMessage ?? this.lastMessage,
      updatedAt: DateTime.now(),
      unreadCount: unreadCount ?? this.unreadCount,
      isBot: isBot,
      avatarUrl: avatarUrl,
    );
  }

  @override
  List<Object?> get props => [id, title, lastMessage, unreadCount, updatedAt];
}
