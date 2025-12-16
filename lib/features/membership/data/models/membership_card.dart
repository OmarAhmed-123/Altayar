import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/value_parser.dart';

class MembershipCard extends Equatable {
  const MembershipCard({
    required this.hasMembership,
    required this.membershipNumber,
    required this.userName,
    required this.userEmail,
    required this.membershipType,
    required this.subscriptionDate,
    required this.expiryDate,
    required this.pointsBalance,
    required this.cashbackBalance,
    required this.benefits,
  });

  final bool hasMembership;
  final String membershipNumber;
  final String userName;
  final String userEmail;
  final String membershipType;
  final DateTime? subscriptionDate;
  final DateTime? expiryDate;
  final int pointsBalance;
  final double cashbackBalance;
  final List<String> benefits;

  factory MembershipCard.fromJson(Map<String, dynamic> json) {
    return MembershipCard(
      hasMembership: json['hasMembership'] as bool? ?? false,
      membershipNumber: json['membership_number'] as String? ?? 'N/A',
      userName: json['user_name'] as String? ?? 'Member',
      userEmail: json['user_email'] as String? ?? '',
      membershipType: json['membership_type'] as String? ?? 'Silver',
      subscriptionDate: _parseDate(json['subscription_date']),
      expiryDate: _parseDate(json['expiry_date']),
      pointsBalance: json['points_balance'] as int? ?? 0,
      cashbackBalance: parseDouble(json['cashback_balance']),
      benefits: List<String>.from(
        (json['benefits'] as List?)?.map((e) => e.toString()) ?? const [],
      ),
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    return DateTime.tryParse(value.toString());
  }

  @override
  List<Object?> get props => [
        hasMembership,
        membershipNumber,
        userName,
        userEmail,
        membershipType,
        subscriptionDate,
        expiryDate,
        pointsBalance,
        cashbackBalance,
        benefits,
      ];
}
