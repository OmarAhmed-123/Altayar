class FrontendPage {
  const FrontendPage({
    required this.id,
    required this.name,
    required this.slug,
    required this.content,
    required this.pageType,
    required this.isPublished,
    this.authorName,
    this.updatedAt,
    this.createdAt,
  });

  final int id;
  final String name;
  final String slug;
  final String content;
  final String pageType;
  final bool isPublished;
  final String? authorName;
  final DateTime? updatedAt;
  final DateTime? createdAt;

  factory FrontendPage.fromJson(Map<String, dynamic> json) {
    final creator = json['creator'];
    return FrontendPage(
      id: _asInt(json['id']) ?? 0,
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      pageType: json['page_type']?.toString() ??
          json['pageType']?.toString() ??
          'custom',
      isPublished: _asBool(json['is_published'] ?? json['isPublished'] ?? true),
      authorName: creator is Map<String, dynamic>
          ? creator['name']?.toString()
          : json['author']?.toString(),
      createdAt: _asDate(json['created_at'] ?? json['createdAt']),
      updatedAt: _asDate(json['updated_at'] ?? json['updatedAt']),
    );
  }

  FrontendPage copyWith({
    int? id,
    String? name,
    String? slug,
    String? content,
    String? pageType,
    bool? isPublished,
    String? authorName,
    DateTime? updatedAt,
    DateTime? createdAt,
  }) {
    return FrontendPage(
      id: id ?? this.id,
      name: name ?? this.name,
      slug: slug ?? this.slug,
      content: content ?? this.content,
      pageType: pageType ?? this.pageType,
      isPublished: isPublished ?? this.isPublished,
      authorName: authorName ?? this.authorName,
      updatedAt: updatedAt ?? this.updatedAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  static int? _asInt(dynamic source) {
    if (source == null) return null;
    if (source is int) return source;
    if (source is double) return source.round();
    if (source is num) return source.toInt();
    if (source is String) {
      return int.tryParse(source) ?? double.tryParse(source)?.round();
    }
    return null;
  }

  static bool _asBool(dynamic source) {
    if (source is bool) return source;
    if (source is num) return source != 0;
    if (source is String) {
      final normalized = source.toLowerCase().trim();
      return normalized == 'true' ||
          normalized == '1' ||
          normalized == 'yes' ||
          normalized == 'y' ||
          normalized == 'on';
    }
    return false;
  }

  static DateTime? _asDate(dynamic source) {
    if (source == null) return null;
    if (source is DateTime) return source;
    return DateTime.tryParse(source.toString());
  }
}

class FrontendPageDraft {
  FrontendPageDraft({
    this.id,
    this.name = '',
    this.slug = '',
    this.content = '',
    this.pageType = 'front',
    this.isPublished = true,
  });

  factory FrontendPageDraft.fromPage(FrontendPage page) {
    return FrontendPageDraft(
      id: page.id,
      name: page.name,
      slug: page.slug,
      content: page.content,
      pageType: page.pageType,
      isPublished: page.isPublished,
    );
  }

  int? id;
  String name;
  String slug;
  String content;
  String pageType;
  bool isPublished;

  Map<String, dynamic> toRequestBody() {
    return {
      'name': name,
      'slug': slug,
      'content': content,
      'pageType': pageType,
      'page_type': pageType,
      'isPublished': isPublished,
      'is_published': isPublished,
    };
  }
}
