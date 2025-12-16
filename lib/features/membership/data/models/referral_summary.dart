import 'package:equatable/equatable.dart';

class ReferralSummary extends Equatable {
  const ReferralSummary({
    required this.referralCode,
    required this.totalInvites,
    required this.successfulInvites,
    required this.rewardPoints,
    required this.rewardValue,
    required this.statusBreakdown,
  });

  final String referralCode;
  final int totalInvites;
  final int successfulInvites;
  final int rewardPoints;
  final double rewardValue;
  final Map<String, int> statusBreakdown;

  int get completedReferrals =>
      statusBreakdown['completed'] ?? successfulInvites;

  int get pendingReferrals =>
      statusBreakdown['pending'] ??
      (totalInvites - completedReferrals).clamp(0, totalInvites);

  int get earnedPoints => rewardPoints;

  double get earnedCashback => rewardValue;

  factory ReferralSummary.fromJson(Map<String, dynamic> json) {
    if (_looksLikeAffiliatePayload(json)) {
      return _fromAffiliateJson(json);
    }
    final breakdown = <String, int>{};
    if (json['status_breakdown'] is Map) {
      (json['status_breakdown'] as Map).forEach((key, value) {
        breakdown[key.toString()] = _asInt(value);
      });
    }

    return ReferralSummary(
      referralCode: json['referral_code']?.toString() ?? '',
      totalInvites: _asInt(json['total_invites']),
      successfulInvites: _asInt(json['successful_invites']),
      rewardPoints: _asInt(json['reward_points']),
      rewardValue: _asDouble(json['reward_value']),
      statusBreakdown: breakdown,
    );
  }

  ReferralSummary copyWith({
    int? totalInvites,
    int? successfulInvites,
  }) {
    return ReferralSummary(
      referralCode: referralCode,
      totalInvites: totalInvites ?? this.totalInvites,
      successfulInvites: successfulInvites ?? this.successfulInvites,
      rewardPoints: rewardPoints,
      rewardValue: rewardValue,
      statusBreakdown: statusBreakdown,
    );
  }

  @override
  List<Object?> get props => [
        referralCode,
        totalInvites,
        successfulInvites,
        rewardPoints,
        rewardValue,
        statusBreakdown,
      ];

  static bool _looksLikeAffiliatePayload(Map<String, dynamic> json) {
    return json.containsKey('affiliate_links') ||
        json.containsKey('total_earnings') ||
        json.containsKey('pending_earnings');
  }

  static ReferralSummary _fromAffiliateJson(Map<String, dynamic> json) {
    final links = (json['affiliate_links'] as List<dynamic>? ?? [])
        .whereType<Map<String, dynamic>>()
        .toList();
    final primary = links.isNotEmpty ? links.first : null;
    final referralCode = primary?['affiliate_code']?.toString() ??
        primary?['code']?.toString() ??
        '';

    var totalInvites = 0;
    var successfulInvites = 0;
    var pending = 0;
    var paid = 0;
    var rewardPoints = 0;

    for (final link in links) {
      totalInvites += _asInt(
        link['signups'] ?? link['total_referrals'] ?? link['totalInvites'],
      );
      successfulInvites += _asInt(
        link['conversions'] ??
            link['confirmed_referrals'] ??
            link['successfulInvites'],
      );
      pending += _asInt(link['pending_referrals'] ?? link['pending']);
      paid += _asInt(link['paid_referrals'] ?? link['paid']);
      rewardPoints += _asInt(
        link['pending_points'] ?? link['reward_points'] ?? link['points'],
      );
    }

    final totalNormalized =
        totalInvites == 0 ? successfulInvites + pending : totalInvites;

    final breakdown = <String, int>{
      if (successfulInvites > 0) 'completed': successfulInvites,
      if (pending > 0) 'pending': pending,
      if (paid > 0) 'paid': paid,
    };

    return ReferralSummary(
      referralCode: referralCode,
      totalInvites: totalNormalized,
      successfulInvites: successfulInvites,
      rewardPoints: rewardPoints,
      rewardValue: _asDouble(
        json['paid_earnings'] ??
            json['total_earnings'] ??
            json['pending_earnings'],
      ),
      statusBreakdown: breakdown,
    );
  }

  static int _asInt(dynamic value) {
    if (value is int) return value;
    if (value is double) return value.round();
    if (value is num) return value.toInt();
    if (value is String) {
      return int.tryParse(value) ?? double.tryParse(value)?.round() ?? 0;
    }
    return 0;
  }

  static double _asDouble(dynamic value) {
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is num) return value.toDouble();
    if (value is String) {
      return double.tryParse(value) ?? int.tryParse(value)?.toDouble() ?? 0;
    }
    return 0;
  }
}
