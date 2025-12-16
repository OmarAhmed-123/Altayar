import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/reports/data/models/revenue_analytics.dart';

class RevenueAnalyticsApi {
  RevenueAnalyticsApi(this._client);

  final ApiClient _client;

  Future<RevenueAnalytics> fetchAnalytics({int months = 12}) async {
    final response = await _client.get(
      'dashboard/revenue-analytics',
      queryParams: {'period': months.toString()},
    );
    final payload = response.data;
    final data = payload is Map<String, dynamic>
        ? (payload['data'] as Map<String, dynamic>? ?? payload)
        : payload as Map<String, dynamic>;
    return RevenueAnalytics.fromJson(data);
  }
}
