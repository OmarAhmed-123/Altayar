import 'package:equatable/equatable.dart';

class RevenueAnalytics extends Equatable {
  const RevenueAnalytics({
    required this.summary,
    required this.byStatus,
    required this.byMethod,
    required this.monthlyTrend,
    required this.byType,
    required this.topUsers,
    required this.dailyRevenue,
    required this.users,
    required this.bookings,
    required this.memberships,
  });

  final RevenueSummary summary;
  final List<StatusData> byStatus;
  final List<MethodData> byMethod;
  final List<MonthlyData> monthlyTrend;
  final List<TypeData> byType;
  final List<UserData> topUsers;
  final List<DailyData> dailyRevenue;
  final UsersAnalytics users;
  final BookingsAnalytics bookings;
  final MembershipsAnalytics memberships;

  factory RevenueAnalytics.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>? ?? json;
    return RevenueAnalytics(
      summary: RevenueSummary.fromJson(
          data['summary'] as Map<String, dynamic>? ?? {}),
      byStatus: (data['byStatus'] as List<dynamic>? ?? [])
          .map((e) => StatusData.fromJson(e as Map<String, dynamic>))
          .toList(),
      byMethod: (data['byMethod'] as List<dynamic>? ?? [])
          .map((e) => MethodData.fromJson(e as Map<String, dynamic>))
          .toList(),
      monthlyTrend: (data['monthlyTrend'] as List<dynamic>? ?? [])
          .map((e) => MonthlyData.fromJson(e as Map<String, dynamic>))
          .toList(),
      byType: (data['byType'] as List<dynamic>? ?? [])
          .map((e) => TypeData.fromJson(e as Map<String, dynamic>))
          .toList(),
      topUsers: (data['topUsers'] as List<dynamic>? ?? [])
          .map((e) => UserData.fromJson(e as Map<String, dynamic>))
          .toList(),
      dailyRevenue: (data['dailyRevenue'] as List<dynamic>? ?? [])
          .map((e) => DailyData.fromJson(e as Map<String, dynamic>))
          .toList(),
      users:
          UsersAnalytics.fromJson(data['users'] as Map<String, dynamic>? ?? {}),
      bookings: BookingsAnalytics.fromJson(
          data['bookings'] as Map<String, dynamic>? ?? {}),
      memberships: MembershipsAnalytics.fromJson(
          data['memberships'] as Map<String, dynamic>? ?? {}),
    );
  }

  @override
  List<Object?> get props => [
        summary,
        byStatus,
        byMethod,
        monthlyTrend,
        byType,
        topUsers,
        dailyRevenue,
        users,
        bookings,
        memberships,
      ];
}

class RevenueSummary extends Equatable {
  const RevenueSummary({
    required this.totalRevenue,
    required this.paidRevenue,
    required this.pendingRevenue,
    required this.period,
  });

  final double totalRevenue;
  final double paidRevenue;
  final double pendingRevenue;
  final String period;

  factory RevenueSummary.fromJson(Map<String, dynamic> json) {
    return RevenueSummary(
      totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0.0,
      paidRevenue: (json['paidRevenue'] as num?)?.toDouble() ?? 0.0,
      pendingRevenue: (json['pendingRevenue'] as num?)?.toDouble() ?? 0.0,
      period: json['period']?.toString() ?? '',
    );
  }

  @override
  List<Object?> get props =>
      [totalRevenue, paidRevenue, pendingRevenue, period];
}

class StatusData extends Equatable {
  const StatusData({
    required this.status,
    required this.total,
    required this.count,
  });

  final String status;
  final double total;
  final int count;

  factory StatusData.fromJson(Map<String, dynamic> json) {
    return StatusData(
      status: json['status']?.toString() ?? 'unknown',
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      count: (json['count'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props => [status, total, count];
}

class MethodData extends Equatable {
  const MethodData({
    required this.method,
    required this.total,
    required this.count,
  });

  final String method;
  final double total;
  final int count;

  factory MethodData.fromJson(Map<String, dynamic> json) {
    return MethodData(
      method: json['method']?.toString() ?? 'unknown',
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      count: (json['count'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props => [method, total, count];
}

class MonthlyData extends Equatable {
  const MonthlyData({
    required this.year,
    required this.month,
    required this.total,
    required this.count,
    required this.label,
  });

  final int year;
  final int month;
  final double total;
  final int count;
  final String label;

  factory MonthlyData.fromJson(Map<String, dynamic> json) {
    return MonthlyData(
      year: (json['year'] as num?)?.toInt() ?? 0,
      month: (json['month'] as num?)?.toInt() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      count: (json['count'] as num?)?.toInt() ?? 0,
      label: json['label']?.toString() ?? '',
    );
  }

  @override
  List<Object?> get props => [year, month, total, count, label];
}

class TypeData extends Equatable {
  const TypeData({
    required this.type,
    required this.total,
    required this.count,
  });

  final String type;
  final double total;
  final int count;

  factory TypeData.fromJson(Map<String, dynamic> json) {
    return TypeData(
      type: json['type']?.toString() ?? 'unknown',
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      count: (json['count'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props => [type, total, count];
}

class UserData extends Equatable {
  const UserData({
    required this.userId,
    required this.userName,
    required this.userEmail,
    required this.total,
    required this.count,
  });

  final int userId;
  final String userName;
  final String userEmail;
  final double total;
  final int count;

  factory UserData.fromJson(Map<String, dynamic> json) {
    return UserData(
      userId: (json['userId'] as num?)?.toInt() ?? 0,
      userName: json['userName']?.toString() ?? 'Unknown',
      userEmail: json['userEmail']?.toString() ?? '',
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      count: (json['count'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props => [userId, userName, userEmail, total, count];
}

class DailyData extends Equatable {
  const DailyData({
    required this.date,
    required this.total,
    required this.count,
  });

  final String date;
  final double total;
  final int count;

  factory DailyData.fromJson(Map<String, dynamic> json) {
    return DailyData(
      date: json['date']?.toString() ?? '',
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      count: (json['count'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props => [date, total, count];
}

class UsersAnalytics extends Equatable {
  const UsersAnalytics({
    required this.byRole,
    required this.byMonth,
    required this.summary,
  });

  final List<RoleData> byRole;
  final List<MonthlyData> byMonth;
  final UsersSummary summary;

  factory UsersAnalytics.fromJson(Map<String, dynamic> json) {
    return UsersAnalytics(
      byRole: (json['byRole'] as List<dynamic>? ?? [])
          .map((e) => RoleData.fromJson(e as Map<String, dynamic>))
          .toList(),
      byMonth: (json['byMonth'] as List<dynamic>? ?? [])
          .map((e) => MonthlyData.fromJson(e as Map<String, dynamic>))
          .toList(),
      summary:
          UsersSummary.fromJson(json['summary'] as Map<String, dynamic>? ?? {}),
    );
  }

  @override
  List<Object?> get props => [byRole, byMonth, summary];
}

class RoleData extends Equatable {
  const RoleData({
    required this.role,
    required this.count,
  });

  final String role;
  final int count;

  factory RoleData.fromJson(Map<String, dynamic> json) {
    return RoleData(
      role: json['role']?.toString() ?? 'unknown',
      count: (json['count'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props => [role, count];
}

class UsersSummary extends Equatable {
  const UsersSummary({
    required this.total,
    required this.withMembership,
    required this.withoutMembership,
    required this.active,
    required this.inactive,
    required this.banned,
  });

  final int total;
  final int withMembership;
  final int withoutMembership;
  final int active;
  final int inactive;
  final int banned;

  factory UsersSummary.fromJson(Map<String, dynamic> json) {
    return UsersSummary(
      total: (json['total'] as num?)?.toInt() ?? 0,
      withMembership: (json['withMembership'] as num?)?.toInt() ?? 0,
      withoutMembership: (json['withoutMembership'] as num?)?.toInt() ?? 0,
      active: (json['active'] as num?)?.toInt() ?? 0,
      inactive: (json['inactive'] as num?)?.toInt() ?? 0,
      banned: (json['banned'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props =>
      [total, withMembership, withoutMembership, active, inactive, banned];
}

class BookingsAnalytics extends Equatable {
  const BookingsAnalytics({
    required this.byStatus,
    required this.byType,
    required this.byMonth,
    required this.daily,
    required this.summary,
  });

  final List<BookingStatusData> byStatus;
  final List<BookingTypeData> byType;
  final List<BookingMonthlyData> byMonth;
  final List<BookingDailyData> daily;
  final BookingsSummary summary;

  factory BookingsAnalytics.fromJson(Map<String, dynamic> json) {
    return BookingsAnalytics(
      byStatus: (json['byStatus'] as List<dynamic>? ?? [])
          .map((e) => BookingStatusData.fromJson(e as Map<String, dynamic>))
          .toList(),
      byType: (json['byType'] as List<dynamic>? ?? [])
          .map((e) => BookingTypeData.fromJson(e as Map<String, dynamic>))
          .toList(),
      byMonth: (json['byMonth'] as List<dynamic>? ?? [])
          .map((e) => BookingMonthlyData.fromJson(e as Map<String, dynamic>))
          .toList(),
      daily: (json['daily'] as List<dynamic>? ?? [])
          .map((e) => BookingDailyData.fromJson(e as Map<String, dynamic>))
          .toList(),
      summary: BookingsSummary.fromJson(
          json['summary'] as Map<String, dynamic>? ?? {}),
    );
  }

  @override
  List<Object?> get props => [byStatus, byType, byMonth, daily, summary];
}

class BookingStatusData extends Equatable {
  const BookingStatusData({
    required this.status,
    required this.count,
    required this.total,
  });

  final String status;
  final int count;
  final double total;

  factory BookingStatusData.fromJson(Map<String, dynamic> json) {
    return BookingStatusData(
      status: json['status']?.toString() ?? 'unknown',
      count: (json['count'] as num?)?.toInt() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
    );
  }

  @override
  List<Object?> get props => [status, count, total];
}

class BookingTypeData extends Equatable {
  const BookingTypeData({
    required this.type,
    required this.count,
    required this.total,
  });

  final String type;
  final int count;
  final double total;

  factory BookingTypeData.fromJson(Map<String, dynamic> json) {
    return BookingTypeData(
      type: json['type']?.toString() ?? 'unknown',
      count: (json['count'] as num?)?.toInt() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
    );
  }

  @override
  List<Object?> get props => [type, count, total];
}

class BookingMonthlyData extends Equatable {
  const BookingMonthlyData({
    required this.year,
    required this.month,
    required this.count,
    required this.total,
    required this.label,
  });

  final int year;
  final int month;
  final int count;
  final double total;
  final String label;

  factory BookingMonthlyData.fromJson(Map<String, dynamic> json) {
    return BookingMonthlyData(
      year: (json['year'] as num?)?.toInt() ?? 0,
      month: (json['month'] as num?)?.toInt() ?? 0,
      count: (json['count'] as num?)?.toInt() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      label: json['label']?.toString() ?? '',
    );
  }

  @override
  List<Object?> get props => [year, month, count, total, label];
}

class BookingDailyData extends Equatable {
  const BookingDailyData({
    required this.date,
    required this.count,
    required this.total,
  });

  final String date;
  final int count;
  final double total;

  factory BookingDailyData.fromJson(Map<String, dynamic> json) {
    return BookingDailyData(
      date: json['date']?.toString() ?? '',
      count: (json['count'] as num?)?.toInt() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
    );
  }

  @override
  List<Object?> get props => [date, count, total];
}

class BookingsSummary extends Equatable {
  const BookingsSummary({required this.total});

  final int total;

  factory BookingsSummary.fromJson(Map<String, dynamic> json) {
    return BookingsSummary(
      total: (json['total'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props => [total];
}

class MembershipsAnalytics extends Equatable {
  const MembershipsAnalytics({
    required this.byTier,
    required this.byStatus,
    required this.byMonth,
    required this.summary,
  });

  final List<TierData> byTier;
  final List<MembershipStatusData> byStatus;
  final List<MonthlyData> byMonth;
  final MembershipsSummary summary;

  factory MembershipsAnalytics.fromJson(Map<String, dynamic> json) {
    return MembershipsAnalytics(
      byTier: (json['byTier'] as List<dynamic>? ?? [])
          .map((e) => TierData.fromJson(e as Map<String, dynamic>))
          .toList(),
      byStatus: (json['byStatus'] as List<dynamic>? ?? [])
          .map((e) => MembershipStatusData.fromJson(e as Map<String, dynamic>))
          .toList(),
      byMonth: (json['byMonth'] as List<dynamic>? ?? [])
          .map((e) => MonthlyData.fromJson(e as Map<String, dynamic>))
          .toList(),
      summary: MembershipsSummary.fromJson(
          json['summary'] as Map<String, dynamic>? ?? {}),
    );
  }

  @override
  List<Object?> get props => [byTier, byStatus, byMonth, summary];
}

class TierData extends Equatable {
  const TierData({
    required this.tier,
    required this.count,
  });

  final String tier;
  final int count;

  factory TierData.fromJson(Map<String, dynamic> json) {
    return TierData(
      tier: json['tier']?.toString() ?? 'unknown',
      count: (json['count'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props => [tier, count];
}

class MembershipStatusData extends Equatable {
  const MembershipStatusData({
    required this.status,
    required this.count,
  });

  final String status;
  final int count;

  factory MembershipStatusData.fromJson(Map<String, dynamic> json) {
    return MembershipStatusData(
      status: json['status']?.toString() ?? 'unknown',
      count: (json['count'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props => [status, count];
}

class MembershipsSummary extends Equatable {
  const MembershipsSummary({
    required this.total,
    required this.active,
    required this.expired,
  });

  final int total;
  final int active;
  final int expired;

  factory MembershipsSummary.fromJson(Map<String, dynamic> json) {
    return MembershipsSummary(
      total: (json['total'] as num?)?.toInt() ?? 0,
      active: (json['active'] as num?)?.toInt() ?? 0,
      expired: (json['expired'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props => [total, active, expired];
}
