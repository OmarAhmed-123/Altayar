import 'package:altayar/features/auth/data/auth_api.dart';
import 'package:altayar/features/auth/data/models/auth_user.dart';

class AuthRepository {
  AuthRepository(this._api);

  final AuthApi _api;

  Future<AuthUser> login(String email, String password) {
    return _api.login(email: email, password: password);
  }

  Future<AuthUser> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phone,
    String? role,
  }) {
    return _api.register(
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      phone: phone,
      role: role,
    );
  }

  Future<AuthUser> signInWithOAuth({
    required String provider,
    String? token,
    String? idToken,
  }) {
    return _api.exchangeOAuthToken(
      provider: provider,
      token: token,
      idToken: idToken,
    );
  }

  Future<Map<String, dynamic>> oauthConfig() => _api.fetchOAuthConfig();
}
