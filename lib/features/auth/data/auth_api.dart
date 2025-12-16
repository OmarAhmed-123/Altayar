import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/core/networking/api_result.dart';
import 'package:altayar/features/auth/data/models/auth_user.dart';

class AuthApi {
  AuthApi(this._client);

  final ApiClient _client;

  Future<AuthUser> login({
    required String email,
    required String password,
  }) async {
    final ApiResult<dynamic> result = await _client.post(
      'auth/login',
      body: {
        'email': email.trim(),
        'password': password,
      },
    );

    return AuthUser.fromJson(result.data as Map<String, dynamic>);
  }

  Future<AuthUser> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phone,
    String? role,
  }) async {
    final ApiResult<dynamic> result = await _client.post(
      'auth/register',
      body: {
        'firstName': firstName,
        'lastName': lastName,
        'email': email.trim(),
        'password': password,
        if (phone != null) 'phone': phone,
        if (role != null) 'role': role,
      },
    );
    return AuthUser.fromJson(result.data as Map<String, dynamic>);
  }

  Future<AuthUser> exchangeOAuthToken({
    required String provider,
    String? token,
    String? idToken,
  }) async {
    final ApiResult<dynamic> result = await _client.post(
      'oauth/token-exchange',
      body: {
        'provider': provider,
        if (token != null) 'token': token,
        if (idToken != null) 'idToken': idToken,
      },
    );

    final data = result.data as Map<String, dynamic>;
    final user = data['user'] as Map<String, dynamic>;
    user['token'] = data['token'];
    return AuthUser.fromJson(user);
  }

  Future<Map<String, dynamic>> fetchOAuthConfig() async {
    final result = await _client.get('oauth/config');
    return result.data as Map<String, dynamic>? ?? {};
  }
}
