import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/value_parser.dart';

class QuotationItem extends Equatable {
  const QuotationItem({
    required this.name,
    required this.quantity,
    required this.price,
  });

  final String name;
  final int quantity;
  final double price;

  double get total => quantity * price;

  factory QuotationItem.fromJson(Map<String, dynamic> json) {
    final parsedQuantity = parseInt(json['quantity'], fallback: 1);
    final safeQuantity = parsedQuantity <= 0 ? 1 : parsedQuantity;
    return QuotationItem(
      name: json['name']?.toString() ?? 'بند',
      quantity: safeQuantity,
      price: parseDouble(json['price']),
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'quantity': quantity,
        'price': price,
      };

  @override
  List<Object?> get props => [name, quantity, price];
}
