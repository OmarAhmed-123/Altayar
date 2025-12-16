import 'dart:math';

import 'package:altayar/core/utils/url_builder.dart';
import 'package:altayar/features/ad_manager/data/models/ad_campaign.dart';

const _unstableHosts = <String>[
  'source.unsplash.com',
  'images.unsplash.com',
  'unsplash.com',
  'picsum.photos',
  'loremflickr.com',
  'placeimg.com',
];

String resolveAdImage(AdCampaign ad) {
  final source = ad.imageUrl?.trim();
  if (source != null && source.isNotEmpty) {
    final resolved = UrlBuilder.resolveMedia(source);
    if (resolved.isNotEmpty && !_isUnstable(resolved)) {
      return resolved;
    }
  }
  return _buildAiImage(ad);
}

bool _isUnstable(String url) {
  final normalized = url.toLowerCase();
  return _unstableHosts.any(normalized.contains);
}

String _buildAiImage(AdCampaign ad) {
  // تصحيح الخطأ: استنتاج وصف لنوع الإعلان بدلاً من استخدام ad.type غير الموجود
  // إذا كان هناك packageId، نعتبره عرض سياحي، وإلا نعتبره ترويج عام
  final derivedType =
      ad.packageId != null ? 'Tour Package Offer' : 'Travel Promotion';

  final prompt = [
    ad.title,
    ad.description,
    derivedType, // تم استخدام القيمة المستنتجة هنا بدلاً من ad.type
    'premium travel advertisement poster',
    'Altayar Tourism brand',
    'luxury vacation photography',
  ]
      .whereType<String>()
      .map((value) => value.trim())
      .where((value) => value.isNotEmpty)
      .join(', ');

  final encoded = Uri.encodeComponent(
    '$prompt, cinematic lighting, arabic typography, ultra hd, vibrant colors',
  );

  // ضمان أن الـ seed رقم صحيح موجب دائماً
  final seed = max(ad.id, 1).toString();

  return 'https://image.pollinations.ai/prompt/$encoded'
      '?width=1024&height=768&seed=$seed&nologo=true';
}
