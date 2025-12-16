double parseDouble(dynamic source, {double fallback = 0}) {
  if (source == null) return fallback;
  if (source is num) return source.toDouble();
  if (source is bool) return source ? 1 : 0;
  if (source is String) {
    final normalized = source.trim();
    if (normalized.isEmpty) return fallback;
    final sanitized = normalized.replaceAll(',', '');
    return double.tryParse(sanitized) ??
        int.tryParse(sanitized)?.toDouble() ??
        fallback;
  }
  return fallback;
}

int parseInt(dynamic source, {int fallback = 0}) {
  if (source == null) return fallback;
  if (source is int) return source;
  if (source is double) return source.round();
  if (source is num) return source.toInt();
  if (source is bool) return source ? 1 : 0;
  if (source is String) {
    final normalized = source.trim();
    if (normalized.isEmpty) return fallback;
    final sanitized = normalized.replaceAll(',', '');
    return int.tryParse(sanitized) ??
        double.tryParse(sanitized)?.round() ??
        fallback;
  }
  return fallback;
}
