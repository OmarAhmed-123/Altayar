import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/value_parser.dart';

import 'quotation_item.dart';

class QuotationSummary extends Equatable {
  const QuotationSummary({
    required this.id,
    required this.status,
    required this.createdAt,
    required this.items,
    this.validUntil,
    this.notes,
    this.discount,
  });

  final int id;
  final String status;
  final DateTime createdAt;
  final DateTime? validUntil;
  final List<QuotationItem> items;
  final String? notes;
  final double? discount;

  double get subtotal => items.fold<double>(0, (sum, item) => sum + item.total);

  double get total {
    if (discount == null) return subtotal;
    return (subtotal - discount!).clamp(0, double.infinity);
  }

  factory QuotationSummary.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List<dynamic>?)
            ?.map(
              (item) => QuotationItem.fromJson(item as Map<String, dynamic>),
            )
            .toList() ??
        const [];
    return QuotationSummary(
      id: json['id'] as int? ?? json['quotation_id'] as int? ?? 0,
      status: json['status']?.toString() ?? 'draft',
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
      validUntil: DateTime.tryParse(json['valid_until']?.toString() ?? ''),
      items: items,
      notes: json['notes']?.toString(),
      discount: json['discount'] == null ? null : parseDouble(json['discount']),
    );
  }

  @override
  List<Object?> get props => [id, status, createdAt, validUntil, items];
}
