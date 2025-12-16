import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/notifications/data/models/app_notification.dart';

class NotificationApi {
  NotificationApi(this._client);

  final ApiClient _client;

  Future<List<AppNotification>> fetchNotifications() async {
    final response = await _client.get('notifications');
    final data = response.data as List<dynamic>? ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(AppNotification.fromJson)
        .toList();
  }

  Future<int> fetchUnreadCount() async {
    final response = await _client.get('notifications/unread-count');
    final data = response.data as Map<String, dynamic>? ?? {};
    return data['unreadCount'] as int? ?? 0;
  }

  Future<void> markAsRead(String id) {
    return _client.put('notifications/$id/read');
  }

  Future<void> createNotification({
    required int userId,
    required String title,
    required String message,
    String? type,
  }) {
    return _client.post(
      'notifications',
      body: {
        'userId': userId,
        'title': title,
        'message': message,
        if (type != null) 'type': type,
      },
    );
  }
}
