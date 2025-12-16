import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/auth/data/auth_repository.dart';
import 'package:altayar/features/auth/data/models/auth_user.dart';

enum AuthStatus { unknown, unauthenticated, loading, authenticated }

class AuthProvider extends ChangeNotifier {
  AuthProvider(this._repository, this._client);

  final AuthRepository _repository;
  final ApiClient _client;
  static const _storageKey = 'altayar.auth.session';

  AuthStatus status = AuthStatus.unauthenticated;
  AuthUser? currentUser;
  String? errorMessage;
  Map<String, dynamic> oauthConfig = const {};
  String? _currentBaseUrl;
  bool _oauthInitialized = false;

  bool get isAuthenticated =>
      status == AuthStatus.authenticated && currentUser != null;

  bool get _runningTests => Platform.environment['FLUTTER_TEST'] == 'true';

  bool get canUseGoogleSignIn =>
      _supportsGooglePlatform && _isProviderEnabled('google');

  bool get canUseAppleSignIn =>
      _supportsApplePlatform && _isProviderEnabled('apple');

  Future<void> initialize() async {
    status = AuthStatus.unknown;
    errorMessage = null;
    notifyListeners();
    await _restoreSession();
    await _loadOAuthConfiguration(initial: true);
    _currentBaseUrl = _client.baseUrl;
    _oauthInitialized = true;
  }

  Future<bool> login(String email, String password) async {
    status = AuthStatus.loading;
    errorMessage = null;
    notifyListeners();
    try {
      final user = await _repository.login(email, password);
      await _applyUser(user);
      return true;
    } catch (error) {
      errorMessage = error.toString();
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phone,
    String? role,
  }) async {
    status = AuthStatus.loading;
    notifyListeners();
    try {
      final user = await _repository.register(
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        phone: phone,
        role: role,
      );
      await _applyUser(user);
      return true;
    } catch (error) {
      errorMessage = error.toString();
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signInWithGoogle() async {
    if (!canUseGoogleSignIn) {
      errorMessage = _supportsGooglePlatform
          ? 'تم تعطيل تسجيل Google في الإعدادات الخلفية.'
          : 'تسجيل Google متاح من تطبيق الهاتف فقط.';
      notifyListeners();
      return false;
    }

    status = AuthStatus.loading;
    notifyListeners();
    try {
      final googleSignIn = GoogleSignIn(scopes: ['email']);
      final account = await googleSignIn.signIn();
      if (account == null) {
        status = AuthStatus.unauthenticated;
        notifyListeners();
        return false;
      }
      final auth = await account.authentication;
      final accessToken = auth.accessToken;
      final idToken = auth.idToken;
      if ((accessToken == null || accessToken.isEmpty) &&
          (idToken == null || idToken.isEmpty)) {
        throw const FormatException(
          'Google لم تُعد صلاحية صالحة. الرجاء المحاولة مرة أخرى.',
        );
      }
      final user = await _repository.signInWithOAuth(
        provider: 'google',
        token: accessToken,
        idToken: idToken,
      );
      await _applyUser(user);
      return true;
    } catch (error) {
      errorMessage = 'فشل تسجيل Google: ${_describeOAuthError(error)}';
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signInWithApple() async {
    if (!canUseAppleSignIn) {
      errorMessage = _isApplePlatform
          ? 'تم تعطيل تسجيل Apple في الإعدادات الخلفية.'
          : 'تسجيل Apple متاح فقط على أجهزة Apple.';
      notifyListeners();
      return false;
    }

    status = AuthStatus.loading;
    notifyListeners();
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      final user = await _repository.signInWithOAuth(
        provider: 'apple',
        idToken: credential.identityToken,
        token: credential.authorizationCode,
      );
      await _applyUser(user);
      return true;
    } catch (error) {
      errorMessage = 'فشل تسجيل Apple: ${_describeOAuthError(error)}';
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  void syncServerBase(String baseUrl) {
    if (_currentBaseUrl == baseUrl) return;
    _currentBaseUrl = baseUrl;
    if (_oauthInitialized && !_runningTests) {
      unawaited(_loadOAuthConfiguration(initial: false));
    }
  }

  Future<void> logout() async {
    currentUser = null;
    status = AuthStatus.unauthenticated;
    _client.setAuthToken(null);
    await _clearPersistedUser();
    notifyListeners();
  }

  void clearError() {
    if (errorMessage != null) {
      errorMessage = null;
      notifyListeners();
    }
  }

  /// Update current user data (e.g., after profile update)
  Future<void> updateCurrentUser(AuthUser updatedUser) async {
    if (currentUser == null) return;
    await _applyUser(updatedUser, persist: true);
  }

  Future<void> _applyUser(AuthUser user, {bool persist = true}) async {
    currentUser = user;
    status = AuthStatus.authenticated;
    errorMessage = null;
    _client.setAuthToken(user.token);
    if (persist) {
      await _persistUser(user);
    }
    notifyListeners();
  }

  bool get _supportsGooglePlatform =>
      kIsWeb || Platform.isAndroid || Platform.isIOS;

  bool get _supportsApplePlatform =>
      !kIsWeb && (Platform.isIOS || Platform.isMacOS);

  bool get _isApplePlatform => !kIsWeb && (Platform.isIOS || Platform.isMacOS);

  bool _isProviderEnabled(String key) {
    final value = oauthConfig[key];
    if (value is Map<String, dynamic>) {
      return (value['enabled'] ?? false) as bool;
    }
    if (value is bool) return value;
    return false;
  }

  Future<void> _loadOAuthConfiguration({required bool initial}) async {
    if (_runningTests) {
      oauthConfig = const {};
      if (initial) {
        status = currentUser == null
            ? AuthStatus.unauthenticated
            : AuthStatus.authenticated;
        notifyListeners();
      }
      return;
    }
    try {
      oauthConfig = await _repository.oauthConfig();
      if (!initial) {
        errorMessage = null;
      }
    } catch (error) {
      oauthConfig = const {};
      errorMessage = 'تعذر تحميل إعدادات الدخول: ${_describeOAuthError(error)}';
    } finally {
      if (initial && status == AuthStatus.unknown) {
        status = currentUser == null
            ? AuthStatus.unauthenticated
            : AuthStatus.authenticated;
      }
      notifyListeners();
    }
  }

  Future<void> _persistUser(AuthUser user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, jsonEncode(user.toJson()));
  }

  Future<void> _clearPersistedUser() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
  }

  Future<void> _restoreSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw == null) return;
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final user = AuthUser.fromJson(map);
      await _applyUser(user, persist: false);
    } catch (_) {
      await _clearPersistedUser();
    }
  }

  String _describeOAuthError(Object error) {
    if (error is SocketException) {
      return 'تعذّر الاتصال بالخادم (${error.message}). الرجاء التحقق من إعدادات الشبكة أو عنوان الخادم.';
    }
    final message = error.toString();
    if (message.toLowerCase().contains('connection refused')) {
      return 'تعذّر الاتصال بالخادم (Connection Refused). يرجى مراجعة إعدادات الاتصال.';
    }
    return message;
  }
}
