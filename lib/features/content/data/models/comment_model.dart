import 'package:equatable/equatable.dart';

class CommentModel extends Equatable {
  const CommentModel({
    required this.id,
    required this.content,
    required this.authorName,
    required this.createdAt,
    required this.resourceType,
    required this.resourceId,
    this.authorAvatar,
  });

  final int id;
  final String content;
  final String authorName;
  final DateTime createdAt;
  final String resourceType;
  final int resourceId;
  final String? authorAvatar;

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    // Extract author name from various possible structures
    String authorName = 'مستخدم';
    if (json['user'] is Map) {
      authorName = json['user']?['name']?.toString() ??
          json['user']?['username']?.toString() ??
          json['user']?['fullName']?.toString() ??
          'مستخدم';
    } else if (json['author'] != null) {
      if (json['author'] is Map) {
        authorName = json['author']?['name']?.toString() ??
            json['author']?['username']?.toString() ??
            'مستخدم';
      } else {
        authorName = json['author']?.toString() ?? 'مستخدم';
      }
    } else if (json['authorName'] != null) {
      authorName = json['authorName']?.toString() ?? 'مستخدم';
    } else if (json['author_name'] != null) {
      authorName = json['author_name']?.toString() ?? 'مستخدم';
    }

    // Extract author avatar from various possible structures
    String? authorAvatar;
    if (json['user'] is Map) {
      authorAvatar = json['user']?['avatar']?.toString() ??
          json['user']?['profilePictureUrl']?.toString() ??
          json['user']?['profile_picture_url']?.toString();
    } else if (json['author'] is Map) {
      authorAvatar = json['author']?['avatar']?.toString() ??
          json['author']?['profilePictureUrl']?.toString() ??
          json['author']?['profile_picture_url']?.toString();
    } else {
      authorAvatar =
          json['authorAvatar']?.toString() ?? json['author_avatar']?.toString();
    }

    // Parse date with multiple format support
    DateTime createdAt = DateTime.now();
    final dateStr = json['created_at']?.toString() ??
        json['createdAt']?.toString() ??
        json['date']?.toString() ??
        '';
    if (dateStr.isNotEmpty) {
      createdAt = DateTime.tryParse(dateStr) ?? DateTime.now();
    }

    return CommentModel(
      id: json['id'] as int? ?? json['comment_id'] as int? ?? 0,
      content: json['content']?.toString() ?? json['text']?.toString() ?? '',
      authorName: authorName,
      createdAt: createdAt,
      resourceType: json['resource_type']?.toString() ??
          json['resourceType']?.toString() ??
          'blog',
      resourceId:
          (json['resource_id'] as int?) ?? (json['resourceId'] as int?) ?? 0,
      authorAvatar: authorAvatar,
    );
  }

  CommentModel copyWith({
    String? content,
    String? authorName,
    String? authorAvatar,
  }) {
    return CommentModel(
      id: id,
      content: content ?? this.content,
      authorName: authorName ?? this.authorName,
      createdAt: createdAt,
      resourceType: resourceType,
      resourceId: resourceId,
      authorAvatar: authorAvatar ?? this.authorAvatar,
    );
  }

  @override
  List<Object?> get props =>
      [id, content, authorName, resourceType, resourceId];
}
