import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/value_parser.dart';

class PaymentRecord extends Equatable {
  const PaymentRecord({
    required this.id,
    required this.userId,
    required this.userName,
    required this.type,
    required this.amount,
    required this.method,
    required this.status,
    required this.createdAt,
    this.bookingId,
    this.notes,
  });

  final int id;
  final int userId;
  final String userName;
  final String type;
  final double amount;
  final String method;
  final String status;
  final DateTime createdAt;
  final int? bookingId;
  final String? notes;

  factory PaymentRecord.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? {};
    return PaymentRecord(
      id: json['id'] as int? ?? json['transaction_id'] as int? ?? 0,
      userId: user['id'] as int? ?? json['user_id'] as int? ?? 0,
      userName:
          user['name']?.toString() ?? json['user_name']?.toString() ?? 'عميل',
      type: json['type']?.toString() ?? 'payment',
      amount: parseDouble(json['amount']),
      method: json['method']?.toString() ?? 'unknown',
      status: json['status']?.toString() ?? 'pending',
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
      bookingId: json['booking_id'] as int?,
      notes: json['description']?.toString(),
    );
  }

  @override
  List<Object?> get props => [id, userId, type, amount, status];
}
