import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/value_parser.dart';

enum TransactionType {
  membershipPurchase,
  bookingPayment,
  cashbackEarned,
  pointsSpent,
  manualDeposit,
  invoicePayment,
}

class TransactionModel extends Equatable {
  const TransactionModel({
    required this.id,
    required this.type,
    required this.amount,
    required this.pointsChange,
    required this.cashbackChange,
    required this.createdAt,
    required this.status,
    this.currency = 'EGP',
    this.paymentMethod,
    this.completedAt,
    this.description,
    this.relatedBookingId,
  });

  final int id;
  final TransactionType type;
  final double amount;
  final int pointsChange;
  final double cashbackChange;
  final DateTime createdAt;
  final String status;
  final String currency;
  final String? paymentMethod;
  final DateTime? completedAt;
  final String? description;
  final int? relatedBookingId;

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] as int? ?? 0,
      type: _typeFrom(json['type']),
      amount: parseDouble(json['amount']),
      pointsChange: parseInt(json['points_change']),
      cashbackChange: parseDouble(json['cashback_change']),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
      status: (json['status']?.toString() ?? 'pending').toLowerCase(),
      currency: (json['currency']?.toString() ?? 'EGP').toUpperCase(),
      paymentMethod: json['payment_method']?.toString(),
      completedAt: DateTime.tryParse(json['completed_at']?.toString() ?? ''),
      description: json['description']?.toString(),
      relatedBookingId: json['related_booking_id'] as int?,
    );
  }

  static TransactionType _typeFrom(dynamic value) {
    switch (value?.toString()) {
      case 'membership_purchase':
        return TransactionType.membershipPurchase;
      case 'booking_payment':
        return TransactionType.bookingPayment;
      case 'cashback_earned':
        return TransactionType.cashbackEarned;
      case 'points_spent':
        return TransactionType.pointsSpent;
      case 'manual_deposit':
        return TransactionType.manualDeposit;
      case 'invoice_payment':
        return TransactionType.invoicePayment;
      default:
        return TransactionType.manualDeposit;
    }
  }

  String get readableType {
    switch (type) {
      case TransactionType.membershipPurchase:
        return 'شراء عضوية';
      case TransactionType.bookingPayment:
        return 'حجز رحلة';
      case TransactionType.cashbackEarned:
        return 'كاش باك مكتسب';
      case TransactionType.pointsSpent:
        return 'صرف نقاط';
      case TransactionType.manualDeposit:
        return 'عملية محاسبية';
      case TransactionType.invoicePayment:
        return 'سداد فاتورة';
    }
  }

  bool get isPositive => amount > 0 || pointsChange > 0 || cashbackChange > 0;

  bool get isPending => status == 'pending';

  String get readableStatus {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'failed':
        return 'فشل الدفع';
      case 'cancelled':
        return 'ملغي';
      case 'pending':
        return 'قيد المعالجة';
      default:
        return status;
    }
  }

  @override
  List<Object?> get props => [
        id,
        type,
        amount,
        pointsChange,
        cashbackChange,
        createdAt,
        status,
        currency,
        paymentMethod,
        completedAt,
        description,
        relatedBookingId,
      ];
}
