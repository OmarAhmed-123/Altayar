import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/value_parser.dart';

class UserAccount extends Equatable {
  const UserAccount({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.points,
    required this.cashback,
    required this.createdAt,
    this.membershipId,
    this.createdBy,
    this.isSuperAdmin = false,
    this.banned = false,
    this.bannedAt,
    this.banReason,
  });

  final int id;
  final String name;
  final String email;
  final String role;
  final int points;
  final double cashback;
  final DateTime createdAt;
  final int? membershipId;
  final int? createdBy;
  final bool isSuperAdmin;
  final bool banned;
  final DateTime? bannedAt;
  final String? banReason;

  factory UserAccount.fromJson(Map<String, dynamic> json) {
    return UserAccount(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? 'customer',
      points: json['points'] as int? ?? 0,
      cashback: parseDouble(json['cashback']),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
      membershipId: json['membership_id'] as int?,
      createdBy: json['created_by'] as int?,
      isSuperAdmin: json['is_super_admin'] as bool? ?? false,
      banned: json['banned'] as bool? ?? false,
      bannedAt: json['banned_at'] != null
          ? DateTime.tryParse(json['banned_at'].toString())
          : null,
      banReason: json['ban_reason'] as String?,
    );
  }

  UserAccount copyWith({
    String? role,
    int? points,
    double? cashback,
    bool? banned,
    DateTime? bannedAt,
    String? banReason,
  }) {
    return UserAccount(
      id: id,
      name: name,
      email: email,
      role: role ?? this.role,
      points: points ?? this.points,
      cashback: cashback ?? this.cashback,
      createdAt: createdAt,
      membershipId: membershipId,
      createdBy: createdBy,
      isSuperAdmin: isSuperAdmin,
      banned: banned ?? this.banned,
      bannedAt: bannedAt ?? this.bannedAt,
      banReason: banReason ?? this.banReason,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        email,
        role,
        points,
        cashback,
        createdAt,
        membershipId,
        createdBy,
        isSuperAdmin,
        banned,
        bannedAt,
        banReason,
      ];
}
