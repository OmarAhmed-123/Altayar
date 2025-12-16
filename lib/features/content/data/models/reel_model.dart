import 'dart:convert';

import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/url_builder.dart';

class ReelModel extends Equatable {
  const ReelModel({
    required this.id,
    required this.title,
    required this.videoUrl,
    required this.thumbnailUrl,
    required this.likesCount,
    required this.commentsCount,
    required this.shareCount,
    required this.createdAt,
    this.isLiked = false,
    this.isFavorite = false,
    this.authorName = 'ALTAYAR',
    this.authorAvatar,
    this.content,
  });

  final int id;
  final String title;
  final String videoUrl;
  final String thumbnailUrl;
  final int likesCount;
  final int commentsCount;
  final int shareCount;
  final DateTime createdAt;
  final bool isLiked;
  final bool isFavorite;
  final String authorName;
  final String? authorAvatar;
  final String? content;

  factory ReelModel.fromJson(Map<String, dynamic> json) {
    final mediaList = (json['media'] as List<dynamic>? ?? []);
    final video = mediaList.firstWhere(
      (item) => (item['type']?.toString() ?? '').contains('video'),
      orElse: () => null,
    );
    final image = mediaList.firstWhere(
      (item) => (item['type']?.toString() ?? '').contains('image'),
      orElse: () => null,
    );
    return ReelModel(
      id: json['id'] as int? ?? json['blog_id'] as int? ?? 0,
      title: json['title']?.toString() ?? '',
      videoUrl: _resolveVideoUrl(video, json),
      thumbnailUrl: _resolveThumbnail(image, json),
      likesCount: json['likes_count'] as int? ?? json['likes'] as int? ?? 0,
      commentsCount:
          json['comments_count'] as int? ?? json['comments'] as int? ?? 0,
      shareCount: json['share_count'] as int? ?? json['shares'] as int? ?? 0,
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
      isLiked: json['is_liked'] as bool? ?? false,
      isFavorite:
          json['is_favorite'] as bool? ?? json['isFavorite'] as bool? ?? false,
      authorName: json['author']?['name']?.toString() ??
          json['author_name']?.toString() ??
          'ALTAYAR',
      authorAvatar: json['author']?['avatar']?.toString() ??
          json['author_avatar']?.toString(),
      content: json['content']?.toString() ?? json['description']?.toString(),
    );
  }

  ReelModel copyWith({
    int? likesCount,
    bool? isLiked,
    bool? isFavorite,
    int? commentsCount,
    int? shareCount,
  }) {
    return ReelModel(
      id: id,
      title: title,
      videoUrl: videoUrl,
      thumbnailUrl: thumbnailUrl,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      shareCount: shareCount ?? this.shareCount,
      createdAt: createdAt,
      isLiked: isLiked ?? this.isLiked,
      isFavorite: isFavorite ?? this.isFavorite,
      authorName: authorName,
      authorAvatar: authorAvatar,
      content: content,
    );
  }

  @override
  List<Object?> get props =>
      [id, videoUrl, likesCount, commentsCount, isLiked, isFavorite];
}

String _resolveVideoUrl(dynamic video, Map<String, dynamic> json) {
  final candidates = [
    ..._coerceStringList(json['mediaUrls']),
    ..._coerceStringList(json['media_urls']),
    video?['url'],
    video?['video_url'],
    json['video_url'],
    json['videoUrl'],
    json['media_url'],
    json['mediaUrl'],
  ];
  for (final candidate in candidates) {
    final raw = candidate?.toString().trim();
    if (raw != null && raw.isNotEmpty && raw.toLowerCase() != 'null') {
      return UrlBuilder.resolveMedia(raw);
    }
  }
  return '';
}

String _resolveThumbnail(dynamic image, Map<String, dynamic> json) {
  final candidates = [
    ..._coerceStringList(json['thumbnailUrls']),
    ..._coerceStringList(json['thumbnail_urls']),
    ..._coerceStringList(json['mediaUrls']).skip(1),
    ..._coerceStringList(json['media_urls']).skip(1),
    image?['url'],
    image?['thumbnail'],
    json['thumbnail_url'],
    json['thumbnailUrl'],
    json['cover'],
  ];
  for (final candidate in candidates) {
    final raw = candidate?.toString().trim();
    if (raw != null && raw.isNotEmpty && raw.toLowerCase() != 'null') {
      return UrlBuilder.resolveMedia(raw);
    }
  }
  return '';
}

List<String> _coerceStringList(dynamic source) {
  if (source == null) return const [];
  if (source is List) {
    return source
        .map((entry) => entry?.toString().trim())
        .where((value) => value != null && value.isNotEmpty)
        .cast<String>()
        .toList();
  }
  if (source is String) {
    final trimmed = source.trim();
    if (trimmed.isEmpty) return const [];
    if (trimmed.startsWith('[')) {
      try {
        final decoded = List<dynamic>.from(
          (jsonDecode(trimmed) as List<dynamic>),
        );
        return decoded
            .map((entry) => entry?.toString().trim())
            .where((value) => value != null && value.isNotEmpty)
            .cast<String>()
            .toList();
      } catch (_) {
        // Fallback to single entry if JSON parsing fails.
      }
    }
    if (trimmed.contains(',')) {
      return trimmed
          .split(',')
          .map((part) => part.trim())
          .where((value) => value.isNotEmpty)
          .toList();
    }
    return [trimmed];
  }
  return [source.toString()];
}
