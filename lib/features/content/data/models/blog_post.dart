import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/url_builder.dart';

class BlogPost extends Equatable {
  const BlogPost({
    required this.id,
    required this.title,
    required this.content,
    required this.createdAt,
    required this.likesCount,
    required this.commentsCount,
    required this.shareCount,
    required this.authorName,
    this.mediaUrl,
    this.mediaType,
    this.category,
    this.tags = const [],
    this.destination,
    this.isLiked = false,
  });

  final int id;
  final String title;
  final String content;
  final DateTime createdAt;
  final int likesCount;
  final int commentsCount;
  final int shareCount;
  final String authorName;
  final String? mediaUrl;
  final String? mediaType;
  final String? category;
  final List<String> tags;
  final String? destination;
  final bool isLiked;

  factory BlogPost.fromJson(Map<String, dynamic> json) {
    return BlogPost(
      id: json['id'] as int? ?? json['blog_id'] as int? ?? 0,
      title: json['title']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
      likesCount: json['likes_count'] as int? ?? json['likes'] as int? ?? 0,
      commentsCount:
          json['comments_count'] as int? ?? json['comments'] as int? ?? 0,
      shareCount: json['share_count'] as int? ?? json['shares'] as int? ?? 0,
      authorName: json['author']?['name']?.toString() ??
          json['author_name']?.toString() ??
          'ALTAYAR',
      mediaUrl: UrlBuilder.resolveMedia(
        json['media_url']?.toString() ?? json['cover']?.toString(),
      ),
      mediaType: json['media_type']?.toString(),
      category: json['category']?.toString(),
      tags: (json['tags'] as List<dynamic>?)
              ?.map((tag) => tag.toString())
              .toList() ??
          const [],
      destination: json['destination']?.toString(),
      isLiked: json['is_liked'] as bool? ?? false,
    );
  }

  BlogPost copyWith({
    int? likesCount,
    bool? isLiked,
    int? commentsCount,
    int? shareCount,
  }) {
    return BlogPost(
      id: id,
      title: title,
      content: content,
      createdAt: createdAt,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      shareCount: shareCount ?? this.shareCount,
      authorName: authorName,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      category: category,
      tags: tags,
      destination: destination,
      isLiked: isLiked ?? this.isLiked,
    );
  }

  @override
  List<Object?> get props => [
        id,
        title,
        content,
        likesCount,
        commentsCount,
        shareCount,
        isLiked,
      ];
}
