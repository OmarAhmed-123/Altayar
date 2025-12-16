import 'package:flutter/foundation.dart';
import 'package:altayar/features/reports/data/models/revenue_analytics.dart';
import 'package:altayar/features/reports/data/revenue_analytics_repository.dart';

class RevenueAnalyticsProvider extends ChangeNotifier {
  RevenueAnalyticsProvider(this._repository);

  final RevenueAnalyticsRepository _repository;

  RevenueAnalytics? analytics;
  bool isLoading = false;
  String? errorMessage;
  int selectedPeriod = 12;

  Future<void> loadAnalytics({bool refresh = false}) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      analytics = await _repository.getAnalytics(
        force: refresh,
        months: selectedPeriod,
      );
      errorMessage = null;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void setPeriod(int months) {
    selectedPeriod = months;
    loadAnalytics(refresh: true);
  }
}
