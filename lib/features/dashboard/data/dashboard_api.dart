import 'package:intl/intl.dart';

import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/core/utils/value_parser.dart';
import 'package:altayar/features/dashboard/data/models/dashboard_stats.dart';

class DashboardApi {
  DashboardApi(this._client);

  final ApiClient _client;

  Future<DashboardStats> fetchStats() async {
    final response = await _client.get('dashboard/stats');
    final raw = response.data as Map<String, dynamic>? ?? {};
    final data = raw['data'] is Map<String, dynamic>
        ? raw['data'] as Map<String, dynamic>
        : raw;
    return DashboardStats.fromJson(data);
  }

  Future<List<Map<String, dynamic>>> fetchRecentActivities() async {
    final response = await _client.get('dashboard/recent-activities');
    final payload = response.data;
    List<dynamic> list;
    if (payload is Map<String, dynamic>) {
      list = payload['data'] as List<dynamic>? ?? const [];
    } else if (payload is List) {
      list = payload;
    } else {
      list = const [];
    }
    return list.whereType<Map<String, dynamic>>().toList();
  }

  Future<List<ChartPoint>> fetchRevenueChart({int months = 6}) async {
    try {
      final response = await _client.get(
        'dashboard/charts',
        queryParams: {
          'type': 'sales',
          'period': months.toString(),
        },
      );
      final payload = response.data;
      List<dynamic> entries;
      if (payload is Map<String, dynamic>) {
        entries = payload['data'] as List<dynamic>? ?? const [];
      } else if (payload is List<dynamic>) {
        entries = payload;
      } else {
        entries = const [];
      }

      print(
          '📊 [DashboardAPI] Fetched ${entries.length} chart entries from backend');

      final formatter = DateFormat('MMM yy');
      final points = <ChartPoint>[];

      // CRITICAL: Process all entries to get real revenue data
      for (var i = 0; i < entries.length; i++) {
        final entry = entries[i];
        if (entry is! Map<String, dynamic>) continue;

        // Extract value from multiple possible field names
        final value = parseDouble(
          entry['totalSales'] ??
              entry['total_sales'] ??
              entry['total'] ??
              entry['value'] ??
              entry['amount'] ??
              0,
        );

        // Extract label from date fields
        final label = _extractLabel(entry, formatter, i);

        print('📊 [DashboardAPI] Chart point $i: $label = $value');

        points.add(ChartPoint(label: label, value: value));
      }

      // CRITICAL: If no data points, create empty chart with message
      if (points.isEmpty) {
        print('⚠️ [DashboardAPI] No revenue data found, creating empty chart');
        // Create placeholder points for the last N months
        final now = DateTime.now();
        for (var i = months - 1; i >= 0; i--) {
          final date = DateTime(now.year, now.month - i);
          points.add(ChartPoint(
            label: formatter.format(date),
            value: 0,
          ));
        }
      }

      print('✅ [DashboardAPI] Returning ${points.length} chart points');
      return points;
    } catch (error) {
      print('❌ [DashboardAPI] Error fetching revenue chart: $error');
      // Return empty chart on error
      final formatter = DateFormat('MMM yy');
      final now = DateTime.now();
      final points = <ChartPoint>[];
      for (var i = months - 1; i >= 0; i--) {
        final date = DateTime(now.year, now.month - i);
        points.add(ChartPoint(
          label: formatter.format(date),
          value: 0,
        ));
      }
      return points;
    }
  }

  String _extractLabel(
    Map<String, dynamic> entry,
    DateFormat formatter,
    int index,
  ) {
    final monthRaw = entry['month'];
    final yearRaw = entry['year'];
    final month = monthRaw == null ? null : int.tryParse(monthRaw.toString());
    final year = yearRaw == null ? null : int.tryParse(yearRaw.toString());
    if (month != null && year != null && month > 0 && month <= 12 && year > 0) {
      return formatter.format(DateTime(year, month));
    }
    return entry['label']?.toString() ?? 'M${index + 1}';
  }
}
