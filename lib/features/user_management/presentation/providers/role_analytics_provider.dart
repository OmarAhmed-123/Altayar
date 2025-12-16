import 'dart:async';

import 'package:flutter/foundation.dart';

import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/user_management/data/models/role_analytics_models.dart';
import 'package:altayar/features/user_management/data/user_management_repository.dart';

class RoleAnalyticsProvider extends ChangeNotifier {
  RoleAnalyticsProvider(this._userRepository, this._apiClient);

  final UserManagementRepository _userRepository;
  final ApiClient _apiClient;

  List<RoleMatrixEntry> matrix = const [];
  List<LiveMetric> liveMetrics = const [];
  List<RecentActivity> activities = const [];

  bool _isMatrixLoading = false;
  bool _isRealtimeLoading = false;
  bool get isMatrixLoading => _isMatrixLoading;
  bool get isRealtimeLoading => _isRealtimeLoading;

  bool _initialized = false;
  Timer? _timer;

  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;
    await Future.wait([
      refreshMatrix(),
      refreshRealtime(),
      refreshActivities(),
    ]);
    _timer ??= Timer.periodic(const Duration(seconds: 20), (_) {
      refreshRealtime();
      refreshActivities();
    });
  }

  Future<void> refreshMatrix() async {
    _isMatrixLoading = true;
    notifyListeners();
    try {
      final users = await _userRepository.getUsers();
      matrix = RoleMatrixEntry.fromUsers(users, kRoleBlueprint);
    } catch (_) {
      // Keep previous data
    } finally {
      _isMatrixLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshRealtime() async {
    _isRealtimeLoading = true;
    notifyListeners();
    try {
      final result = await _apiClient.get('dashboard/realtime');
      final data = result.data as Map<String, dynamic>? ?? {};
      final metrics = <LiveMetric>[];
      data.forEach((key, value) {
        if (key.endsWith('_trend')) return;
        final parsedValue = _tryParseDouble(value);
        if (parsedValue == null) return;
        metrics.add(
          LiveMetric(
            label: key,
            value: parsedValue,
            trend: _tryParseDouble(data['${key}_trend']),
          ),
        );
      });
      liveMetrics = metrics;
    } catch (_) {
      // ignore
    } finally {
      _isRealtimeLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshActivities() async {
    try {
      final result = await _apiClient.get('dashboard/recent-activities');
      final list = result.data as List<dynamic>? ?? [];
      activities = list
          .map((item) => RecentActivity.fromMap(item as Map<String, dynamic>))
          .toList();
      notifyListeners();
    } catch (_) {
      // ignore
    }
  }

  double? _tryParseDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
