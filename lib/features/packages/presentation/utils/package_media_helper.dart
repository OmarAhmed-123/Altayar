import 'dart:math';

import 'package:altayar/core/utils/url_builder.dart';
import 'package:altayar/features/packages/data/models/travel_package.dart';

const _unstableHosts = <String>[
  'source.unsplash.com',
  'images.unsplash.com',
  'unsplash.com',
  'picsum.photos',
  'loremflickr.com',
];

String resolvePackageHeroImage(TravelPackage pkg) {
  final candidate = pkg.images.isNotEmpty ? pkg.images.first.trim() : '';
  if (candidate.isNotEmpty) {
    final resolved = UrlBuilder.resolveMedia(candidate);
    if (resolved.isNotEmpty && !_isUnstable(resolved)) {
      return resolved;
    }
  }
  return _buildAiUrl(pkg);
}

List<String> resolvePackageGalleryImages(TravelPackage pkg) {
  if (pkg.images.isEmpty) {
    return [_buildAiUrl(pkg)];
  }
  final sanitized = <String>[];
  for (var i = 0; i < pkg.images.length; i++) {
    final entry = pkg.images[i].trim();
    if (entry.isEmpty) {
      sanitized.add(_buildAiUrl(pkg, seedOffset: i + 1));
      continue;
    }
    final resolved = UrlBuilder.resolveMedia(entry);
    if (resolved.isEmpty || _isUnstable(resolved)) {
      sanitized.add(_buildAiUrl(pkg, seedOffset: i + 1));
    } else {
      sanitized.add(resolved);
    }
  }
  if (sanitized.isEmpty) {
    sanitized.add(_buildAiUrl(pkg));
  }
  return sanitized;
}

bool _isUnstable(String url) {
  final normalized = url.toLowerCase();
  return _unstableHosts.any(normalized.contains);
}

String _buildPrompt(TravelPackage pkg) {
  final buffer = <String?>[pkg.destination, pkg.title, pkg.category]
      .whereType<String>()
      .map((value) => value.trim())
      .where((value) => value.isNotEmpty)
      .toList();
  if (buffer.isEmpty) {
    return 'Egypt Nile cruise desert adventure';
  }
  return buffer.join(' ');
}

String _buildAiUrl(TravelPackage pkg, {int seedOffset = 0}) {
  final prompt = _buildPrompt(pkg);
  final encoded = Uri.encodeComponent(
    '$prompt, luxury travel photography, cinematic lighting, Altayar Tourism',
  );
  final seed = max(pkg.id + seedOffset, 1).toString();
  return 'https://image.pollinations.ai/prompt/$encoded'
      '?width=1200&height=800&seed=$seed&nologo=true';
}
