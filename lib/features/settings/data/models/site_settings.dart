class SiteSettings {
  const SiteSettings({
    this.id,
    required this.siteName,
    required this.currency,
    required this.contactEmail,
    this.maintenanceMode = false,
    this.updatedAt,
  });

  final int? id;
  final String siteName;
  final String currency;
  final String contactEmail;
  final bool maintenanceMode;
  final DateTime? updatedAt;

  factory SiteSettings.fromJson(Map<String, dynamic> json) {
    final updatedAtRaw = json['updated_at'] ?? json['updatedAt'];
    return SiteSettings(
      id: _asInt(json['id']),
      siteName: json['site_name']?.toString() ??
          json['siteName']?.toString() ??
          'ALTAYAR',
      currency: json['currency']?.toString() ?? 'USD',
      contactEmail: json['contact_email']?.toString() ??
          json['contactEmail']?.toString() ??
          '',
      maintenanceMode:
          _asBool(json['maintenance_mode'] ?? json['maintenanceMode']),
      updatedAt: updatedAtRaw != null
          ? DateTime.tryParse(updatedAtRaw.toString())
          : null,
    );
  }

  SiteSettings copyWith({
    int? id,
    String? siteName,
    String? currency,
    String? contactEmail,
    bool? maintenanceMode,
    DateTime? updatedAt,
  }) {
    return SiteSettings(
      id: id ?? this.id,
      siteName: siteName ?? this.siteName,
      currency: currency ?? this.currency,
      contactEmail: contactEmail ?? this.contactEmail,
      maintenanceMode: maintenanceMode ?? this.maintenanceMode,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'site_name': siteName,
      'siteName': siteName,
      'currency': currency,
      'contact_email': contactEmail,
      'contactEmail': contactEmail,
      'maintenance_mode': maintenanceMode,
      'maintenanceMode': maintenanceMode,
    };
  }

  static SiteSettings defaults() => const SiteSettings(
        siteName: 'ALTAYAR',
        currency: 'USD',
        contactEmail: 'support@altayar.com',
      );

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
}
