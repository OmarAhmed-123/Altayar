import 'package:flutter/foundation.dart';

import 'package:altayar/core/networking/api_client.dart';

class BackendHealthProvider extends ChangeNotifier {
  BackendHealthProvider(this._client);

  final ApiClient _client;

  bool? _isHealthy;
  String? _message;
  bool _isChecking = false;
  String? _lastBaseUrl;

  bool? get isHealthy => _isHealthy;
  String? get message => _message;
  bool get isChecking => _isChecking;

  void syncWithBase(String baseUrl) {
    if (_lastBaseUrl == baseUrl) return;
    _lastBaseUrl = baseUrl;
    check();
  }

  Future<void> check() async {
    _isChecking = true;
    notifyListeners();
    try {
      final result = await _client.get('health');
      final data = result.data as Map<String, dynamic>? ?? {};
      final status = (data['status'] ?? data['message'] ?? 'healthy')
          .toString();
      _isHealthy = true;
      _message = status;
    } catch (error) {
      _isHealthy = false;
      _message = error.toString();
    } finally {
      _isChecking = false;
      notifyListeners();
    }
  }
}
