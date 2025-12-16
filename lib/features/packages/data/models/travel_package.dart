import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/url_builder.dart';

class TravelPackage extends Equatable {
  const TravelPackage({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.durationDays,
    required this.durationNights,
    required this.remainingSeats,
    this.category,
    this.destination,
    this.images = const [],
    this.videoUrl,
    this.isExclusive = false,
  });

  final int id;
  final String title;
  final String description;
  final double price;
  final int durationDays;
  final int durationNights;
  final int remainingSeats;
  final String? category;
  final String? destination;
  final List<String> images;
  final String? videoUrl;
  final bool isExclusive;

  factory TravelPackage.fromJson(Map<String, dynamic> json) {
    final media = _parseMedia(json);
    final rawVideo =
        json['videoUrl'] ?? json['video_url'] ?? json['media_url'] ?? '';

    return TravelPackage(
      id: _asInt(json['id']),
      title: json['title']?.toString() ?? json['name']?.toString() ?? 'عرض',
      description: json['description']?.toString() ??
          json['short_description']?.toString() ??
          '',
      price: _asDouble(json['price'] ?? json['price_total']),
      durationDays: _asInt(
        json['durationDays'] ?? json['duration'] ?? json['days'],
      ),
      durationNights: _asInt(
        json['durationNights'] ??
            json['nights'] ??
            (json['duration'] is int ? (json['duration'] as int) - 1 : null),
      ),
      remainingSeats: _asInt(
        json['remainingSeats'] ?? json['available_seats'] ?? json['seats'],
      ),
      category: json['category']?.toString(),
      destination: json['destination']?.toString(),
      images: media,
      videoUrl: UrlBuilder.resolveMedia(rawVideo.toString()),
      isExclusive: _asBool(
        json['isExclusive'] ?? json['exclusive'] ?? json['exclusive_flag'],
      ),
    );
  }

  @override
  List<Object?> get props => [id, title, price, remainingSeats, isExclusive];

  static List<String> _parseMedia(Map<String, dynamic> json) {
    final media = <String>[];
    final mediaJson = json['images'] ?? json['media'] ?? [];
    if (mediaJson is List) {
      for (final item in mediaJson) {
        final url = _extractMediaUrl(item);
        if (url != null && url.isNotEmpty) {
          media.add(UrlBuilder.resolveMedia(url));
        }
      }
    } else if (mediaJson is String && mediaJson.isNotEmpty) {
      media.add(UrlBuilder.resolveMedia(mediaJson));
    }
    final cover = json['coverImage'] ?? json['cover_image'];
    final resolvedCover = _extractMediaUrl(cover);
    if (resolvedCover != null && resolvedCover.isNotEmpty) {
      media.insert(0, UrlBuilder.resolveMedia(resolvedCover));
    }
    return media;
  }

  static String? _extractMediaUrl(dynamic source) {
    if (source == null) return null;
    if (source is String) return source;
    if (source is Map) {
      return source['url']?.toString() ??
          source['image_url']?.toString() ??
          source['path']?.toString();
    }
    return source.toString();
  }

  static int _asInt(dynamic value) {
    if (value is int) return value;
    if (value is double) return value.round();
    if (value is num) return value.toInt();
    if (value is String) {
      return int.tryParse(value) ?? double.tryParse(value)?.round() ?? 0;
    }
    if (value == null) return 0;
    return 0;
  }

  static double _asDouble(dynamic value) {
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is num) return value.toDouble();
    if (value is String) {
      return double.tryParse(value) ?? int.tryParse(value)?.toDouble() ?? 0;
    }
    return 0;
  }

  static bool _asBool(dynamic value) {
    if (value is bool) return value;
    if (value is num) return value != 0;
    if (value is String) {
      final normalized = value.toLowerCase().trim();
      return ['true', '1', 'yes', 'y'].contains(normalized);
    }
    return false;
  }
}
