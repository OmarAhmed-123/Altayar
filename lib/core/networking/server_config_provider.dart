import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'package:altayar/core/config/app_config.dart';
import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/core/utils/url_builder.dart';

class ServerConfigProvider extends ChangeNotifier {
  ServerConfigProvider(this._client) : _baseUrl = AppConfig.resolvedBaseUrl() {
    UrlBuilder.overrideBase(_baseUrl);
  }

  static const _storageKey = 'custom_api_base';

  final ApiClient _client;

  String _baseUrl;
  bool _isTesting = false;
  bool _initialized = false;
  String? _error;

  String get baseUrl => _baseUrl;
  bool get isTesting => _isTesting;
  bool get isInitialized => _initialized;
  String? get errorMessage => _error;

  static const _autoCandidates = <String>{
    'http://10.0.2.2:5000/api',
    'http://192.168.1.4:5000/api',
    'http://192.168.1.2:5000/api',
    'http://192.168.0.100:5000/api',
    'http://169.254.45.249:5000/api',
    'http://169.254.93.13:5000/api',
  };

  List<String> get suggestions {
    final defaults = <String>{AppConfig.resolvedBaseUrl(), ..._autoCandidates};
    defaults.add(_baseUrl);
    return defaults.where((item) => item.isNotEmpty).toList();
  }

  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_storageKey);
    final normalized = saved == null || saved.isEmpty
        ? AppConfig.resolvedBaseUrl()
        : ApiClient.normalizeBaseUrl(saved);

    final resolvedBase =
        await _probeBaseUrl(normalized) ??
        await _findReachableHost({normalized, ..._autoCandidates});

    if (resolvedBase != null) {
      await _applyBaseUrl(resolvedBase, persist: resolvedBase != normalized);
      _error = null;
    } else {
      await _applyBaseUrl(normalized, persist: false);
      _error =
          'تعذّر الوصول للخادم الافتراضي. تأكد من إدخال العنوان الصحيح من إعدادات الاتصال.';
    }
    _initialized = true;
    notifyListeners();
  }

  Future<bool> updateBaseUrl(String candidate) async {
    final normalized = ApiClient.normalizeBaseUrl(candidate);
    _isTesting = true;
    _error = null;
    notifyListeners();
    final resolved = await _probeBaseUrl(normalized);
    _isTesting = false;
    if (resolved == null) {
      _error = 'تعذّر الاتصال بالخادم عند $normalized';
      notifyListeners();
      return false;
    }
    await _applyBaseUrl(resolved, persist: true);
    return true;
  }

  Future<void> resetToDefault() async {
    await updateBaseUrl(AppConfig.resolvedBaseUrl());
  }

  Future<bool> autoDetect() async {
    final candidates = {..._autoCandidates, ...suggestions};
    _isTesting = true;
    _error = null;
    notifyListeners();
    final detected = await _findReachableHost(candidates);
    _isTesting = false;
    if (detected == null) {
      _error =
          'لم يتم العثور على خادم متاح تلقائياً. تأكد أن الجهاز والخادم على نفس الشبكة أو استخدم عنواناً عاماً.';
      notifyListeners();
      return false;
    }
    await _applyBaseUrl(detected, persist: true);
    return true;
  }

  Future<void> _applyBaseUrl(String url, {required bool persist}) async {
    _baseUrl = url;
    _client.overrideBaseUrl(url);
    UrlBuilder.overrideBase(url);
    if (persist) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_storageKey, url);
    }
    _error = null;
    notifyListeners();
  }

  Future<String?> _probeBaseUrl(String baseUrl) async {
    final healthUrl = _buildHealthUrl(baseUrl);
    try {
      final uri = Uri.parse(healthUrl);
      final response = await http.get(uri).timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final recommended = _extractRecommendedBase(response.body);
        if (recommended != null && recommended.isNotEmpty) {
          return ApiClient.normalizeBaseUrl(recommended);
        }
        return ApiClient.normalizeBaseUrl(baseUrl);
      }
    } catch (_) {
      // ignore
    }
    return null;
  }

  String? _extractRecommendedBase(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) {
        final direct = decoded['recommendedBaseUrl'] ?? decoded['baseUrl'];
        if (direct is String && direct.isNotEmpty) {
          return direct;
        }
        final network = decoded['network'];
        if (network is Map<String, dynamic>) {
          final urls = network['accessibleUrls'];
          if (urls is List && urls.isNotEmpty && urls.first is String) {
            return urls.first as String;
          }
        }
      }
    } catch (_) {
      // ignore json parse errors
    }
    return null;
  }

  String _buildHealthUrl(String baseUrl) {
    final trimmed = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    return '$trimmed/health';
  }

  Future<String?> _findReachableHost(Iterable<String> candidates) async {
    for (final candidate in candidates) {
      final normalized = ApiClient.normalizeBaseUrl(candidate);
      final resolved = await _probeBaseUrl(normalized);
      if (resolved != null) {
        return resolved;
      }
    }
    return null;
  }
}
