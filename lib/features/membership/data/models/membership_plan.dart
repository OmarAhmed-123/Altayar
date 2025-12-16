import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/value_parser.dart';

class MembershipPlan extends Equatable {
  const MembershipPlan({
    required this.id,
    required this.name,
    required this.tier,
    required this.price,
    required this.points,
    required this.pointMultiplier,
    required this.cashbackRate,
    required this.welcomePoints,
    required this.welcomeCashback,
    required this.durationDays,
    required this.benefits,
    required this.isActive,
    this.description,
    this.imageUrl,
    this.pdfUrl,
    this.pdfViewUrl,
    this.pdfDownloadUrl,
  });

  final int id;
  final String name;
  final String tier;
  final double price;
  final int points;
  final double pointMultiplier;
  final double cashbackRate;
  final int welcomePoints;
  final double welcomeCashback;
  final int durationDays;
  final List<String> benefits;
  final bool isActive;
  final String? description;
  final String? imageUrl;
  final String? pdfUrl;
  final String? pdfViewUrl;
  final String? pdfDownloadUrl;

  factory MembershipPlan.fromJson(Map<String, dynamic> json) {
    return MembershipPlan(
      id: json['id'] as int,
      name: json['name'] as String? ?? 'Membership',
      tier: json['tier'] as String? ?? 'Silver',
      price: parseDouble(json['price']),
      points: json['points'] as int? ?? 0,
      pointMultiplier: json['point_multiplier'] == null
          ? 1
          : parseDouble(json['point_multiplier']),
      cashbackRate: parseDouble(json['cashback_rate']),
      welcomePoints: json['welcome_points'] as int? ?? 0,
      welcomeCashback: parseDouble(json['welcome_cashback']),
      durationDays: json['duration_days'] as int? ?? 365,
      benefits: List<String>.from(
        (json['benefits'] as List?)?.map((e) => e.toString()) ?? const [],
      ),
      isActive: json['is_active'] as bool? ?? true,
      description: json['description'] as String?,
      imageUrl: json['image_url'] as String?,
      pdfUrl: json['pdf_url'] as String?,
      pdfViewUrl: json['pdf_view_url'] as String?,
      pdfDownloadUrl: json['pdf_download_url'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'tier': tier,
      'price': price,
      'points': points,
      'point_multiplier': pointMultiplier,
      'cashback_rate': cashbackRate,
      'welcome_points': welcomePoints,
      'welcome_cashback': welcomeCashback,
      'duration_days': durationDays,
      'benefits': benefits,
      'is_active': isActive,
      'description': description,
      'image_url': imageUrl,
      'pdf_url': pdfUrl,
      'pdf_view_url': pdfViewUrl,
      'pdf_download_url': pdfDownloadUrl,
    };
  }

  MembershipPlan copyWith({
    double? price,
    int? points,
    int? welcomePoints,
    double? welcomeCashback,
  }) {
    return MembershipPlan(
      id: id,
      name: name,
      tier: tier,
      price: price ?? this.price,
      points: points ?? this.points,
      pointMultiplier: pointMultiplier,
      cashbackRate: cashbackRate,
      welcomePoints: welcomePoints ?? this.welcomePoints,
      welcomeCashback: welcomeCashback ?? this.welcomeCashback,
      durationDays: durationDays,
      benefits: benefits,
      isActive: isActive,
      description: description,
      imageUrl: imageUrl,
      pdfUrl: pdfUrl,
      pdfViewUrl: pdfViewUrl,
      pdfDownloadUrl: pdfDownloadUrl,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        tier,
        price,
        points,
        pointMultiplier,
        cashbackRate,
        welcomePoints,
        welcomeCashback,
        durationDays,
        benefits,
        isActive,
        description,
        imageUrl,
        pdfUrl,
        pdfViewUrl,
        pdfDownloadUrl,
      ];
}
