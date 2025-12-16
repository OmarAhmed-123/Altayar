import 'package:altayar/features/reports/data/models/revenue_analytics.dart';
import 'package:altayar/features/reports/data/revenue_analytics_api.dart';

class RevenueAnalyticsRepository {
  RevenueAnalyticsRepository(this._api);

  final RevenueAnalyticsApi _api;

  RevenueAnalytics? _cache;

  Future<RevenueAnalytics> getAnalytics({
    bool force = false,
    int months = 12,
  }) async {
    if (!force && _cache != null) return _cache!;
    final data = await _api.fetchAnalytics(months: months);
    _cache = data;
    return data;
  }
}
