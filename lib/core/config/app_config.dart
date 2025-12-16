import 'dart:io';

/// Central place to keep environment-specific values and toggles.
class AppConfig {
  AppConfig._();

  /// Base URL for the backend. Can be overridden via --dart-define.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:5000/api',
  );

  /// Optional LAN IP fallback used when running on a real device.
  static const String _lanHostFallback = String.fromEnvironment(
    'HOST_MACHINE_IP',
    defaultValue: '192.168.1.4',
  );

  /// Optional demo admin credentials (can be overridden via --dart-define).
  static const String demoAdminEmail = String.fromEnvironment(
    'DEMO_ADMIN_EMAIL',
    defaultValue: 'ahmedsaifdin237@gmail.com',
  );

  static const String demoAdminPassword = String.fromEnvironment(
    'DEMO_ADMIN_PASSWORD',
    defaultValue: 'AAIOH2040%%fF%',
  );

  /// Timeout for HTTP requests.
  static const Duration networkTimeout = Duration(seconds: 25);

  /// True when running on a physical device / release build.
  static const bool isProduction = bool.fromEnvironment('dart.vm.product');

  /// Simple helper to detect if we are on Android emulator (for localhost mapping).
  static bool get _runningOnAndroid => Platform.isAndroid;

  /// Returns the correct base URL taking emulators into account.
  static String resolvedBaseUrl() {
    var url = baseUrl;
    if (_looksLikeLoopback(url)) {
      final replacement = _loopbackReplacement();
      url = url
          .replaceAll('localhost', replacement)
          .replaceAll('127.0.0.1', replacement);
    }
    return url;
  }

  static bool get hasDemoAdmin =>
      demoAdminEmail.isNotEmpty && demoAdminPassword.isNotEmpty;

  static bool _looksLikeLoopback(String url) {
    return url.contains('localhost') || url.contains('127.0.0.1');
  }

  static String _loopbackReplacement() {
    if (_runningOnAndroid) {
      // Android emulator special host to access host machine.
      return '10.0.2.2';
    }
    if (Platform.isIOS) {
      // iOS simulator maps localhost automatically.
      return '127.0.0.1';
    }
    return _lanHostFallback;
  }
}
