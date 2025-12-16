import 'package:equatable/equatable.dart';

class AuthUser extends Equatable {
  const AuthUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.token,
    this.membershipId,
    this.points = 0,
    this.cashback = 0,
    this.isSuperAdmin = false,
    this.profilePictureUrl,
    this.phone,
  });

  final int id;
  final String name;
  final String email;
  final String role;
  final String token;
  final int? membershipId;
  final int points;
  final double cashback;
  final bool isSuperAdmin;
  final String? profilePictureUrl;
  final String? phone;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final membershipSource = json['membershipId'] ?? json['membership_id'];
    final pointsSource = json['points'];
    final cashbackSource = json['cashback'];
    final isSuperAdminSource =
        json['is_super_admin'] ?? json['isSuperAdmin'] ?? json['superAdmin'];
    final profilePictureSource = json['profile_picture_url'] ??
        json['profilePictureUrl'] ??
        json['profile_picture'];
    final phoneSource = json['phone'];

    return AuthUser(
      id: _asInt(json['id']),
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'customer',
      token: json['token']?.toString() ?? '',
      membershipId: _asIntNullable(membershipSource),
      points: _asInt(pointsSource),
      cashback: _asDouble(cashbackSource),
      isSuperAdmin: _asBool(isSuperAdminSource),
      profilePictureUrl: profilePictureSource?.toString(),
      phone: phoneSource?.toString(),
    );
  }

  AuthUser copyWith({
    String? name,
    String? email,
    String? role,
    int? points,
    double? cashback,
    bool? isSuperAdmin,
    String? profilePictureUrl,
    String? phone,
  }) {
    return AuthUser(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      token: token,
      membershipId: membershipId,
      points: points ?? this.points,
      cashback: cashback ?? this.cashback,
      isSuperAdmin: isSuperAdmin ?? this.isSuperAdmin,
      profilePictureUrl: profilePictureUrl ?? this.profilePictureUrl,
      phone: phone ?? this.phone,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        email,
        role,
        token,
        membershipId,
        points,
        cashback,
        isSuperAdmin,
        profilePictureUrl,
        phone,
      ];

  static int _asInt(
    dynamic source, {
    int fallback = 0,
  }) {
    if (source is int) return source;
    if (source is double) return source.round();
    if (source is num) return source.toInt();
    if (source is String) {
      return int.tryParse(source) ??
          double.tryParse(source)?.round() ??
          fallback;
    }
    return fallback;
  }

  static int? _asIntNullable(dynamic source) {
    if (source == null) return null;
    if (source is String && source.trim().isEmpty) return null;
    return _asInt(source);
  }

  static double _asDouble(
    dynamic source, {
    double fallback = 0,
  }) {
    if (source is double) return source;
    if (source is int) return source.toDouble();
    if (source is num) return source.toDouble();
    if (source is String) {
      return double.tryParse(source) ??
          int.tryParse(source)?.toDouble() ??
          fallback;
    }
    return fallback;
  }

  static bool _asBool(dynamic source) {
    if (source is bool) return source;
    if (source is num) return source != 0;
    if (source is String) {
      final normalized = source.toLowerCase().trim();
      return normalized == 'true' ||
          normalized == '1' ||
          normalized == 'yes' ||
          normalized == 'y';
    }
    return false;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'token': token,
      'membership_id': membershipId,
      'points': points,
      'cashback': cashback,
      'is_super_admin': isSuperAdmin,
      'profile_picture_url': profilePictureUrl,
      'phone': phone,
    };
  }
}
