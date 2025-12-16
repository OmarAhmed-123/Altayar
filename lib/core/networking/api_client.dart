import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import 'api_exceptions.dart';
import 'api_result.dart';

class ApiClient {
  ApiClient({http.Client? httpClient, String? baseUrl})
      : _http = httpClient ?? http.Client(),
        _baseUrl = _sanitizeBaseUrl(baseUrl ?? AppConfig.resolvedBaseUrl());

  final http.Client _http;
  String? _authToken;
  String _baseUrl;

  String? get authToken => _authToken;
  String get baseUrl => _baseUrl;

  void setAuthToken(String? token) {
    _authToken = token?.isNotEmpty == true ? token : null;
  }

  void overrideBaseUrl(String? value) {
    final candidate = _sanitizeBaseUrl(value ?? AppConfig.resolvedBaseUrl());
    if (candidate == _baseUrl) return;
    _baseUrl = candidate;
  }

  static String normalizeBaseUrl(String value) => _sanitizeBaseUrl(value);

  Future<ApiResult<dynamic>> get(
    String path, {
    Map<String, String>? headers,
    Map<String, dynamic>? queryParams,
  }) async {
    final uri = _composeUri(path, queryParams);
    final response = await _send(
      () => _http.get(uri, headers: _withDefaults(headers)),
    );
    return ApiResult<dynamic>(
      data: response,
      statusCode:
          response is Map<String, dynamic> ? response['statusCode'] : null,
    );
  }

  Future<ApiResult<dynamic>> post(
    String path, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    final uri = _composeUri(path, null);
    final encodedBody = body is String ? body : jsonEncode(body ?? {});

    final response = await _send(
      () => _http.post(uri, headers: _withDefaults(headers), body: encodedBody),
    );
    return ApiResult<dynamic>(data: response);
  }

  Future<ApiResult<dynamic>> put(
    String path, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    final uri = _composeUri(path, null);
    final encodedBody = body is String ? body : jsonEncode(body ?? {});

    final response = await _send(
      () => _http.put(uri, headers: _withDefaults(headers), body: encodedBody),
    );
    return ApiResult<dynamic>(data: response);
  }

  Future<ApiResult<dynamic>> delete(
    String path, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    final uri = _composeUri(path, null);
    final encodedBody = body is String
        ? body
        : body == null
            ? null
            : jsonEncode(body);

    final response = await _send(
      () =>
          _http.delete(uri, headers: _withDefaults(headers), body: encodedBody),
    );
    return ApiResult<dynamic>(data: response);
  }

  Uri _composeUri(String path, Map<String, dynamic>? queryParams) {
    final normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    final base = _baseUrl.endsWith('/')
        ? _baseUrl.substring(0, _baseUrl.length - 1)
        : _baseUrl;
    return Uri.parse('$base/$normalizedPath').replace(
      queryParameters: {
        if (queryParams != null)
          ...queryParams.map(
            (key, value) => MapEntry(key, value?.toString() ?? ''),
          ),
      },
    );
  }

  Map<String, String> _withDefaults(
    Map<String, String>? headers, {
    bool includeJsonContentType = true,
  }) {
    final merged = <String, String>{
      if (includeJsonContentType) 'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (_authToken != null) 'Authorization': 'Bearer $_authToken',
      if (headers != null) ...headers,
    };
    return merged;
  }

  Future<ApiResult<dynamic>> postMultipart(
    String path, {
    Map<String, String>? fields,
    List<http.MultipartFile>? files,
  }) async {
    final uri = _composeUri(path, null);
    final request = http.MultipartRequest('POST', uri);
    request.headers.addAll(_withDefaults(null, includeJsonContentType: false));
    if (fields != null) {
      request.fields.addAll(fields);
    }
    if (files != null) {
      request.files.addAll(files);
    }
    try {
      final streamed = await request.send().timeout(AppConfig.networkTimeout);
      final body = await streamed.stream.bytesToString();
      final decoded = _decode(body);
      if (streamed.statusCode >= 200 && streamed.statusCode < 300) {
        return ApiResult<dynamic>(
          data: decoded['data'] ?? decoded,
          statusCode: streamed.statusCode,
          message: decoded['message']?.toString(),
        );
      }
      throw ApiException(
        decoded['message']?.toString() ??
            'Unexpected error (${streamed.statusCode})',
        statusCode: streamed.statusCode,
        body: decoded,
      );
    } on ApiException {
      rethrow;
    } on http.ClientException catch (error) {
      throw NetworkException(error.message);
    } on Object {
      throw NetworkException('Unable to reach the server');
    }
  }

  Future<ApiResult<dynamic>> putMultipart(
    String path, {
    Map<String, String>? fields,
    List<http.MultipartFile>? files,
  }) async {
    final uri = _composeUri(path, null);
    final request = http.MultipartRequest('PUT', uri);
    request.headers.addAll(_withDefaults(null, includeJsonContentType: false));
    if (fields != null) {
      request.fields.addAll(fields);
    }
    if (files != null) {
      request.files.addAll(files);
    }
    try {
      final streamed = await request.send().timeout(AppConfig.networkTimeout);
      final body = await streamed.stream.bytesToString();
      final decoded = _decode(body);
      if (streamed.statusCode >= 200 && streamed.statusCode < 300) {
        return ApiResult<dynamic>(
          data: decoded['data'] ?? decoded,
          statusCode: streamed.statusCode,
          message: decoded['message']?.toString(),
        );
      }
      throw ApiException(
        decoded['message']?.toString() ??
            'Unexpected error (${streamed.statusCode})',
        statusCode: streamed.statusCode,
        body: decoded,
      );
    } on ApiException {
      rethrow;
    } on http.ClientException catch (error) {
      throw NetworkException(error.message);
    } on Object {
      throw NetworkException('Unable to reach the server');
    }
  }

  Future<dynamic> _send(Future<http.Response> Function() request) async {
    try {
      final response = await request().timeout(AppConfig.networkTimeout);
      final payload = _decode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        // For blogs endpoint, the backend might return data directly in the response
        // without wrapping it in a 'data' field. Check if payload has 'data' field,
        // otherwise return the entire payload (which might be the data itself or contain it)
        if (payload is Map<String, dynamic>) {
          if (payload.containsKey('data')) {
            return payload['data'];
          }
        }
        // Return the entire payload - it might be the data itself or contain pagination metadata
        return payload;
      }

      throw ApiException(
        payload['message']?.toString() ??
            'Unexpected error (${response.statusCode})',
        statusCode: response.statusCode,
        body: payload,
      );
    } on ApiException {
      rethrow;
    } on http.ClientException catch (error) {
      throw NetworkException(error.message);
    } on Object {
      throw NetworkException('Unable to reach the server');
    }
  }

  dynamic _decode(String body) {
    if (body.isEmpty) return {};
    try {
      final decoded = jsonDecode(body);
      // If decoded is already a list or map, return it as-is
      if (decoded is List) return decoded;
      if (decoded is Map<String, dynamic>) return decoded;
      // For other types, wrap in a data field
      return {'data': decoded};
    } catch (e) {
      // If JSON decode fails, return empty map
      return {};
    }
  }

  void dispose() {
    _http.close();
  }

  static String _sanitizeBaseUrl(String value) {
    var result = value.trim();
    if (result.isEmpty) {
      result = AppConfig.resolvedBaseUrl();
    }
    if (!result.contains('://')) {
      result = 'http://$result';
    }
    result = result.replaceAll(RegExp(r'\s'), '');
    result = result.replaceAll(RegExp(r'/+$'), '');
    if (!result.toLowerCase().endsWith('/api')) {
      result = '$result/api';
    }
    return result;
  }
}
