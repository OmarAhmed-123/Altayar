import 'package:altayar/features/dashboard/data/dashboard_api.dart';
import 'package:altayar/features/dashboard/data/models/dashboard_stats.dart';

class DashboardRepository {
  DashboardRepository(this._api);

  final DashboardApi _api;

  DashboardStats? _cache;
  List<Map<String, dynamic>>? _activityCache;

  Future<DashboardStats> getStats(
      {bool force = false, int? chartMonths}) async {
    if (!force && _cache != null && chartMonths == null) return _cache!;
    final results = await Future.wait([
      _api.fetchStats(),
      _api.fetchRevenueChart(months: chartMonths ?? 6),
    ]);
    final stats = results[0] as DashboardStats;
    final chart = results[1] as List<ChartPoint>;
    final enriched = stats.copyWith(
      chartPoints: chart.isNotEmpty ? chart : stats.chartPoints,
    );
    _cache = enriched;
    return enriched;
  }

  Future<List<Map<String, dynamic>>> getActivities({bool force = false}) async {
    if (!force && _activityCache != null) return _activityCache!;
    final data = await _api.fetchRecentActivities();
    _activityCache = data;
    return data;
  }
}
