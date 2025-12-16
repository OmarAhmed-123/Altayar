import 'package:altayar/features/notifications/data/models/app_notification.dart';
import 'package:altayar/features/notifications/data/notification_api.dart';

class NotificationRepository {
  NotificationRepository(this._api);

  final NotificationApi _api;

  List<AppNotification>? _cache;
  int _unread = 0;

  Future<List<AppNotification>> getNotifications({bool force = false}) async {
    if (!force && _cache != null) return _cache!;
    final data = await _api.fetchNotifications();
    _cache = data;
    _unread = data.where((n) => !n.isRead).length;
    return data;
  }

  Future<int> getUnreadCount({bool force = false}) async {
    if (!force && _cache != null) return _unread;
    _unread = await _api.fetchUnreadCount();
    return _unread;
  }

  Future<void> markAsRead(String id) async {
    await _api.markAsRead(id);
    _cache = _cache?.map((n) => n.id == id ? n.markRead() : n).toList();
    _unread = _cache?.where((n) => !n.isRead).length ?? 0;
  }
}
