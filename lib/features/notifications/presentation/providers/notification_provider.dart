import 'dart:async';

import 'package:flutter/foundation.dart';

import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/notifications/data/models/app_notification.dart';
import 'package:altayar/features/notifications/data/notification_repository.dart';

class NotificationProvider extends ChangeNotifier {
  NotificationProvider(this._repository);

  final NotificationRepository _repository;

  List<AppNotification> notifications = [];
  int unreadCount = 0;
  bool isLoading = false;
  Timer? _poller;
  bool _initialized = false;
  AuthProvider? _auth;
  int? _activeUserId;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
    final userId = auth.currentUser?.id;
    if (!auth.isAuthenticated) {
      _activeUserId = null;
      _initialized = false;
      _cancelPolling();
      _clearState();
      return;
    }
    if (_activeUserId != userId) {
      _activeUserId = userId;
      _initialized = false;
      _cancelPolling();
      _clearState();
      unawaited(initialize(force: true));
      return;
    }
    if (!_initialized) {
      unawaited(initialize(force: true));
    }
  }

  Future<void> initialize({bool force = false}) async {
    if (!_canFetch) return;
    if (_initialized && !force) return;
    _initialized = true;
    await refresh(force: true);
    _startPolling();
  }

  Future<void> refresh({bool force = true}) async {
    if (!_canFetch) {
      _cancelPolling();
      _clearState();
      return;
    }
    isLoading = true;
    notifyListeners();
    try {
      notifications = await _repository.getNotifications(force: force);
      unreadCount = await _repository.getUnreadCount(force: force);
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markAsRead(String id) async {
    await _repository.markAsRead(id);
    notifications =
        notifications.map((n) => n.id == id ? n.markRead() : n).toList();
    unreadCount = notifications.where((n) => !n.isRead).length;
    notifyListeners();
  }

  @override
  void dispose() {
    _poller?.cancel();
    super.dispose();
  }

  bool get _canFetch => _auth?.isAuthenticated ?? false;

  void _startPolling() {
    _cancelPolling();
    _poller = Timer.periodic(
      const Duration(seconds: 20),
      (_) => refresh(force: false),
    );
  }

  void _cancelPolling() {
    _poller?.cancel();
    _poller = null;
  }

  void _clearState() {
    notifications = [];
    unreadCount = 0;
    isLoading = false;
    notifyListeners();
  }
}
