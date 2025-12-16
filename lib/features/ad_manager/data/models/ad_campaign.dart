import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/url_builder.dart';

class AdCampaign extends Equatable {
  const AdCampaign({
    required this.id,
    required this.title,
    required this.description,
    required this.isActive,
    required this.createdAt,
    this.imageUrl,
    this.linkUrl,
    this.startDate,
    this.endDate,
    this.packageId,
    this.ctaLabel,
  });

  final int id;
  final String title;
  final String description;
  final bool isActive;
  final DateTime createdAt;
  final String? imageUrl;
  final String? linkUrl;
  final DateTime? startDate;
  final DateTime? endDate;
  final int? packageId;
  final String? ctaLabel;

  factory AdCampaign.fromJson(Map<String, dynamic> json) {
    return AdCampaign(
      id: json['id'] as int? ?? json['ad_id'] as int? ?? 0,
      title: json['title']?.toString() ?? '',
      description:
          json['description']?.toString() ?? json['content']?.toString() ?? '',
      imageUrl: UrlBuilder.resolveMedia(
        json['image_url']?.toString() ?? json['image']?.toString(),
      ),
      linkUrl: json['link_url']?.toString() ??
          json['linkUrl']?.toString() ??
          json['cta_url']?.toString() ??
          json['link']?.toString(),
      isActive: json['is_active'] as bool? ?? json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse(
            json['created_at']?.toString() ??
                json['createdAt']?.toString() ??
                '',
          ) ??
          DateTime.now(),
      startDate: DateTime.tryParse(
        json['start_date']?.toString() ?? json['startDate']?.toString() ?? '',
      ),
      endDate: DateTime.tryParse(
        json['end_date']?.toString() ?? json['endDate']?.toString() ?? '',
      ),
      packageId: json['package_id'] as int? ?? json['packageId'] as int?,
      ctaLabel: json['cta_label']?.toString() ?? json['ctaLabel']?.toString(),
    );
  }

  AdCampaign copyWith({
    String? title,
    String? description,
    bool? isActive,
    String? imageUrl,
    String? linkUrl,
    DateTime? startDate,
    DateTime? endDate,
    int? packageId,
    String? ctaLabel,
  }) {
    return AdCampaign(
      id: id,
      title: title ?? this.title,
      description: description ?? this.description,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt,
      imageUrl: imageUrl ?? this.imageUrl,
      linkUrl: linkUrl ?? this.linkUrl,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      packageId: packageId ?? this.packageId,
      ctaLabel: ctaLabel ?? this.ctaLabel,
    );
  }

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        isActive,
        imageUrl,
        linkUrl,
        startDate,
        endDate,
        packageId,
        ctaLabel,
      ];
}
