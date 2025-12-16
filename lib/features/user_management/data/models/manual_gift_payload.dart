class ManualGiftPayload {
  ManualGiftPayload({
    this.points,
    this.cashback,
    this.voucherType,
    this.description,
  });

  final int? points;
  final double? cashback;
  final String? voucherType;
  final String? description;

  Map<String, dynamic> toJson() {
    return {
      if (points != null) 'points': points,
      if (cashback != null) 'cashback': cashback,
      if (voucherType != null && voucherType!.isNotEmpty)
        'voucherType': voucherType,
      if (description != null && description!.isNotEmpty)
        'description': description,
    };
  }
}
