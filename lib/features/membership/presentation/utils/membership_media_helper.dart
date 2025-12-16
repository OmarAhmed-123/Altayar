import 'dart:math';

import 'package:altayar/core/utils/url_builder.dart';
import 'package:altayar/features/membership/data/models/membership_plan.dart';

const _unstableHosts = <String>[
  'source.unsplash.com',
  'images.unsplash.com',
  'unsplash.com',
  'picsum.photos',
  'loremflickr.com',
];

String resolveMembershipImage(MembershipPlan plan) {
  final candidate = plan.imageUrl?.trim() ?? '';
  if (candidate.isNotEmpty) {
    final resolved = UrlBuilder.resolveMedia(candidate);
    if (resolved.isNotEmpty && !_isUnstable(resolved)) {
      return resolved;
    }
  }
  return _buildAiImage(plan);
}

String _buildAiImage(MembershipPlan plan) {
  final prompt = [
    plan.tier,
    plan.name,
    plan.description,
    'premium membership card design',
    'luxury travel loyalty program',
    'Altayar Tourism brand colors',
  ]
      .whereType<String>()
      .map((value) => value.trim())
      .where((value) => value.isNotEmpty)
      .join(', ');

  final encoded = Uri.encodeComponent(prompt);
  final seed = max(plan.id, 1).toString();
  return 'https://image.pollinations.ai/prompt/$encoded'
      '?width=1024&height=768&seed=$seed&nologo=true';
}

bool _isUnstable(String url) {
  final normalized = url.toLowerCase();
  return _unstableHosts.any(normalized.contains);
}
