import 'package:equatable/equatable.dart';

class AppNotification extends Equatable {
  const AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.createdAt,
    required this.type,
    this.isRead = false,
  });

  final String id;
  final String title;
  final String message;
  final DateTime createdAt;
  final String type;
  final bool isRead;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id']?.toString() ??
          json['notification_id']?.toString() ??
          '',
      title: json['title']?.toString() ?? 'إشعار',
      message: json['message']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
      type: json['type']?.toString() ?? 'general',
      isRead: json['is_read'] as bool? ?? json['isRead'] as bool? ?? false,
    );
  }

  AppNotification markRead() => AppNotification(
        id: id,
        title: title,
        message: message,
        createdAt: createdAt,
        type: type,
        isRead: true,
      );

  @override
  List<Object?> get props => [id, title, message, isRead];
}

