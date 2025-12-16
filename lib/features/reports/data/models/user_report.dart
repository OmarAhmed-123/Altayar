import 'package:altayar/core/utils/value_parser.dart';

class UserReportData {
  UserReportData({
    required this.user,
    required this.membership,
    required this.bookings,
    required this.trips,
    required this.transactions,
    required this.statistics,
  });

  final ReportUser user;
  final ReportMembership? membership;
  final List<ReportBooking> bookings;
  final List<ReportTrip> trips;
  final List<ReportTransaction> transactions;
  final ReportStatistics statistics;

  factory UserReportData.fromJson(Map<String, dynamic> json) {
    final data = json['data'] is Map<String, dynamic>
        ? json['data'] as Map<String, dynamic>
        : json;
    return UserReportData(
      user: ReportUser.fromJson(
        Map<String, dynamic>.from(data['user'] ?? const {}),
      ),
      membership: data['membership'] == null
          ? null
          : ReportMembership.fromJson(
              Map<String, dynamic>.from(data['membership']),
            ),
      bookings: _mapList(
        data['bookings'],
        (item) => ReportBooking.fromJson(item),
      ),
      trips: _mapList(
        data['trips'],
        (item) => ReportTrip.fromJson(item),
      ),
      transactions: _mapList(
        data['transactions'],
        (item) => ReportTransaction.fromJson(item),
      ),
      statistics: ReportStatistics.fromJson(
        Map<String, dynamic>.from(data['statistics'] ?? const {}),
      ),
    );
  }

  static List<T> _mapList<T>(
    dynamic source,
    T Function(Map<String, dynamic>) mapper,
  ) {
    if (source is List) {
      return source
          .whereType<Map<String, dynamic>>()
          .map(mapper)
          .toList(growable: false);
    }
    return <T>[];
  }
}

class ReportUser {
  ReportUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.createdAt,
    this.phone,
  });

  final int id;
  final String name;
  final String email;
  final String role;
  final DateTime createdAt;
  final String? phone;

  factory ReportUser.fromJson(Map<String, dynamic> json) {
    return ReportUser(
      id: parseInt(json['id']),
      name: json['name']?.toString() ?? 'العميل',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'customer',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      phone: json['phone']?.toString(),
    );
  }
}

class ReportMembership {
  ReportMembership({
    required this.type,
    required this.status,
    required this.cashbackBalance,
    this.subscriptionDate,
    this.expiryDate,
  });

  final String? type;
  final String? status;
  final double cashbackBalance;
  final String? subscriptionDate;
  final String? expiryDate;

  factory ReportMembership.fromJson(Map<String, dynamic> json) {
    return ReportMembership(
      type: json['type']?.toString(),
      status: json['status']?.toString(),
      cashbackBalance: parseDouble(json['cashbackBalance']),
      subscriptionDate: json['subscriptionDate']?.toString(),
      expiryDate: json['expiryDate']?.toString(),
    );
  }
}

class ReportBooking {
  ReportBooking({
    required this.id,
    required this.packageName,
    required this.status,
    required this.totalAmount,
    required this.bookingDate,
    required this.travelDate,
  });

  final int id;
  final String? packageName;
  final String? status;
  final double totalAmount;
  final String? bookingDate;
  final String? travelDate;

  factory ReportBooking.fromJson(Map<String, dynamic> json) {
    return ReportBooking(
      id: parseInt(json['id']),
      packageName: json['packageName']?.toString(),
      status: json['status']?.toString(),
      totalAmount: parseDouble(json['totalAmount']),
      bookingDate: json['bookingDate']?.toString(),
      travelDate: json['travelDate']?.toString(),
    );
  }
}

class ReportTrip {
  ReportTrip({
    required this.id,
    required this.destination,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.totalCost,
  });

  final int id;
  final String? destination;
  final String? status;
  final String? startDate;
  final String? endDate;
  final double totalCost;

  factory ReportTrip.fromJson(Map<String, dynamic> json) {
    return ReportTrip(
      id: parseInt(json['id']),
      destination: json['destination']?.toString(),
      status: json['status']?.toString(),
      startDate: json['startDate']?.toString(),
      endDate: json['endDate']?.toString(),
      totalCost: parseDouble(json['totalCost']),
    );
  }
}

class ReportTransaction {
  ReportTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.description,
    required this.createdAt,
    required this.status,
  });

  final int id;
  final String? type;
  final double amount;
  final String? description;
  final String? createdAt;
  final String? status;

  factory ReportTransaction.fromJson(Map<String, dynamic> json) {
    return ReportTransaction(
      id: parseInt(json['id']),
      type: json['type']?.toString(),
      amount: parseDouble(json['amount']),
      description: json['description']?.toString(),
      createdAt: json['createdAt']?.toString(),
      status: json['status']?.toString(),
    );
  }
}

class ReportStatistics {
  ReportStatistics({
    required this.totalBookings,
    required this.totalTrips,
    required this.totalSpent,
    required this.totalCashback,
    required this.pendingPayments,
  });

  final int totalBookings;
  final int totalTrips;
  final double totalSpent;
  final double totalCashback;
  final double pendingPayments;

  factory ReportStatistics.fromJson(Map<String, dynamic> json) {
    return ReportStatistics(
      totalBookings: parseInt(json['totalBookings']),
      totalTrips: parseInt(json['totalTrips']),
      totalSpent: parseDouble(json['totalSpent']),
      totalCashback: parseDouble(json['totalCashback']),
      pendingPayments: parseDouble(json['pendingPayments']),
    );
  }
}
