import 'package:altayar/core/config/app_config.dart';

class UrlBuilder {
  UrlBuilder._();

  static String? _baseOverride;

  static void overrideBase(String? baseUrl) {
    if (baseUrl == null || baseUrl.isEmpty) return;
    _baseOverride = baseUrl;
  }

  static String resolveMedia(String? url) {
    if (url == null || url.isEmpty) return '';
    final origin = _currentOrigin();
    if (_isAbsolute(url)) {
      final parsed = Uri.tryParse(url);
      if (parsed == null) return '';
      final targetHost = parsed.host.toLowerCase();
      final currentHost = Uri.tryParse(origin)?.host.toLowerCase() ?? '';
      if (_shouldRewriteHost(targetHost, currentHost)) {
        final normalizedPath = parsed.path.startsWith('/')
            ? parsed.path
            : '/${parsed.path}';
        final query = parsed.hasQuery ? '?${parsed.query}' : '';
        return '$origin$normalizedPath$query';
      }
      return url;
    }

    final normalized = url.startsWith('/') ? url : '/$url';
    return '$origin$normalized';
  }

  static bool _isAbsolute(String url) {
    return url.startsWith('http://') || url.startsWith('https://');
  }

  static String _currentOrigin() {
    final chosenBase = _baseOverride ?? AppConfig.resolvedBaseUrl();
    return _extractOrigin(chosenBase);
  }

  static String _extractOrigin(String baseUrl) {
    var sanitized = baseUrl.trim();
    if (sanitized.endsWith('/')) {
      sanitized = sanitized.substring(0, sanitized.length - 1);
    }
    if (sanitized.endsWith('/api')) {
      sanitized = sanitized.substring(0, sanitized.length - 4);
    }

    final parsed = Uri.tryParse(sanitized);
    if (parsed == null || parsed.host.isEmpty) return sanitized;

    final scheme = parsed.scheme.isEmpty ? 'http' : parsed.scheme;
    final needsPort = parsed.hasPort && parsed.port != 80 && parsed.port != 443;
    final portPart = needsPort ? ':${parsed.port}' : '';
    return '$scheme://${parsed.host}$portPart';
  }

  static bool _shouldRewriteHost(String host, String currentHost) {
    final normalizedHost = host.toLowerCase();
    final normalizedCurrent = currentHost.toLowerCase();
    if (normalizedHost.isEmpty) return true;
    if (normalizedHost == normalizedCurrent) return false;
    if (_isLoopbackHost(normalizedHost)) return true;

    final defaultHost =
        Uri.tryParse(AppConfig.resolvedBaseUrl())?.host.toLowerCase() ?? '';
    if (normalizedHost == defaultHost) return true;

    if (_isPrivateHost(normalizedHost) && normalizedCurrent.isNotEmpty) {
      return true;
    }
    return false;
  }

  static bool _isLoopbackHost(String host) {
    const loopbacks = {'localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'};
    return loopbacks.contains(host);
  }

  static bool _isPrivateHost(String host) {
    return host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        RegExp(r'^172\.(1[6-9]|2[0-9]|3[0-1])\.').hasMatch(host);
  }
}
