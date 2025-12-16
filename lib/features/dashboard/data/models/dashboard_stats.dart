import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/value_parser.dart';

class DashboardStats extends Equatable {
  const DashboardStats({
    required this.totalUsers,
    required this.activeMemberships,
    required this.monthlyRevenue,
    required this.pendingBookings,
    required this.chartPoints,
  });

  final int totalUsers;
  final int activeMemberships;
  final double monthlyRevenue;
  final int pendingBookings;
  final List<ChartPoint> chartPoints;

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    final users = json['users'] as Map<String, dynamic>? ?? {};
    final memberships = json['memberships'] as Map<String, dynamic>? ?? {};
    final bookings = json['bookings'] as Map<String, dynamic>? ?? {};
    final revenue = json['revenue'] as Map<String, dynamic>? ?? {};
    final chart = (json['chart'] ?? json['chartData']) as List<dynamic>? ?? [];
    final byStatus = bookings['by_status'] as List<dynamic>? ?? const [];
    return DashboardStats(
      totalUsers: parseInt(users['total']),
      activeMemberships: parseInt(
        memberships['active'] ??
            memberships['total'] ??
            bookings['recent'] ??
            bookings['total'],
      ),
      monthlyRevenue: parseDouble(
        revenue['recent'] ?? revenue['total'] ?? json['monthlyRevenue'],
      ),
      pendingBookings: _pendingFromStatus(byStatus) ??
          parseInt(bookings['pending'] ?? bookings['total']),
      chartPoints: chart
          .whereType<Map<String, dynamic>>()
          .map(ChartPoint.fromJson)
          .toList(),
    );
  }

  @override
  List<Object?> get props => [
        totalUsers,
        activeMemberships,
        monthlyRevenue,
        pendingBookings,
        chartPoints,
      ];

  DashboardStats copyWith({
    int? totalUsers,
    int? activeMemberships,
    double? monthlyRevenue,
    int? pendingBookings,
    List<ChartPoint>? chartPoints,
  }) {
    return DashboardStats(
      totalUsers: totalUsers ?? this.totalUsers,
      activeMemberships: activeMemberships ?? this.activeMemberships,
      monthlyRevenue: monthlyRevenue ?? this.monthlyRevenue,
      pendingBookings: pendingBookings ?? this.pendingBookings,
      chartPoints: chartPoints ?? this.chartPoints,
    );
  }
}

class ChartPoint extends Equatable {
  const ChartPoint({required this.label, required this.value});

  final String label;
  final double value;

  factory ChartPoint.fromJson(Map<String, dynamic> json) {
    return ChartPoint(
      label: json['label']?.toString() ?? '',
      value: parseDouble(json['value']),
    );
  }

  @override
  List<Object?> get props => [label, value];
}

int? _pendingFromStatus(List<dynamic> statusList) {
  for (final entry in statusList.whereType<Map<String, dynamic>>()) {
    final label = entry['status']?.toString().toLowerCase();
    if (label == null) continue;
    if (label.contains('pending') || label.contains('معل')) {
      final value = entry['count'];
      if (value is num) return value.toInt();
      final parsed = int.tryParse(value.toString());
      if (parsed != null) return parsed;
    }
  }
  return null;
}
