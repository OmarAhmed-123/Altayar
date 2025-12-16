import 'package:flutter/material.dart';

import 'package:altayar/features/dashboard/data/dashboard_repository.dart';
import 'package:altayar/features/dashboard/data/models/dashboard_stats.dart';

class DashboardProvider extends ChangeNotifier {
  DashboardProvider(this._repository);

  final DashboardRepository _repository;

  DashboardStats? stats;
  List<Map<String, dynamic>> activities = [];
  bool isLoading = false;
  String? errorMessage;

  Future<void> loadDashboard({bool refresh = false, int? chartMonths}) async {
    isLoading = true;
    notifyListeners();
    try {
      final results = await Future.wait([
        _repository.getStats(force: refresh, chartMonths: chartMonths),
        _repository.getActivities(force: refresh),
      ]);
      stats = results[0] as DashboardStats;
      activities = results[1] as List<Map<String, dynamic>>;
      errorMessage = null;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}
