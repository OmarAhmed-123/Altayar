import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/value_parser.dart';

class VoucherModel extends Equatable {
  const VoucherModel({
    required this.id,
    required this.code,
    required this.type,
    required this.status,
    required this.createdAt,
    this.value,
    this.description,
    this.expiresAt,
    this.userId,
    this.userName,
    this.issuedBy,
  });

  final int id;
  final String code;
  final String type;
  final String status;
  final DateTime createdAt;
  final double? value;
  final String? description;
  final DateTime? expiresAt;
  final int? userId;
  final String? userName;
  final int? issuedBy;

  bool get isActive => status.toLowerCase() == 'active';
  bool get isRedeemed => status.toLowerCase() == 'redeemed';
  bool get isExpired =>
      status.toLowerCase() == 'expired' ||
      (expiresAt != null && expiresAt!.isBefore(DateTime.now()));

  factory VoucherModel.fromJson(Map<String, dynamic> json) {
    return VoucherModel(
      id: json['id'] as int,
      code: json['code']?.toString() ?? '',
      type: json['type']?.toString() ?? 'general',
      status: json['status']?.toString() ?? 'active',
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
      value: json['value'] == null ? null : parseDouble(json['value']),
      description: json['description']?.toString(),
      expiresAt: DateTime.tryParse(json['expires_at']?.toString() ?? ''),
      userId: json['user_id'] as int?,
      userName: json['user']?['name']?.toString(),
      issuedBy: json['issued_by'] as int?,
    );
  }

  @override
  List<Object?> get props => [id, code, status];
}
