import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/core/networking/api_result.dart';
import 'package:altayar/features/user_management/data/models/manual_gift_payload.dart';
import 'package:altayar/features/user_management/data/models/user_account.dart';

class UserManagementApi {
  UserManagementApi(this._client);

  final ApiClient _client;

  Future<List<UserAccount>> fetchUsers() async {
    final ApiResult<dynamic> result = await _client.get('users');
    final list = result.data as List<dynamic>? ?? [];
    return list
        .map((e) => UserAccount.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<UserAccount> updateUser({
    required int id,
    required Map<String, dynamic> payload,
  }) async {
    final ApiResult<dynamic> result = await _client.put(
      'users/$id',
      body: payload,
    );
    return UserAccount.fromJson(result.data as Map<String, dynamic>);
  }

  Future<UserAccount?> sendManualGift(
      int userId, ManualGiftPayload payload) async {
    final result = await _client.post(
      'users/gift/$userId',
      body: payload.toJson(),
    );
    final data = result.data as Map<String, dynamic>? ?? {};
    if (data['user'] is Map<String, dynamic>) {
      return UserAccount.fromJson(data['user'] as Map<String, dynamic>);
    }
    return null;
  }

  Future<UserAccount> createUser({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phone,
    required String role,
  }) async {
    final result = await _client.post(
      'auth/register',
      body: {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
        if (phone != null) 'phone': phone,
        'role': role,
      },
    );
    final data = result.data as Map<String, dynamic>;
    // Extract user data from response
    final userData = {
      'id': data['id'],
      'name': data['name'],
      'email': data['email'],
      'role': data['role'],
      'points': data['points'] ?? 0,
      'cashback': data['cashback'] ?? 0,
      'created_at': DateTime.now().toIso8601String(),
      'is_super_admin': data['is_super_admin'] ?? false,
      'banned': false,
    };
    return UserAccount.fromJson(userData);
  }

  Future<void> deleteUser(int userId) async {
    await _client.delete('users/$userId');
  }

  Future<UserAccount> banUser({
    required int userId,
    required bool banned,
    String? banReason,
  }) async {
    final result = await _client.put(
      'users/$userId/ban',
      body: {
        'banned': banned,
        if (banReason != null) 'banReason': banReason,
      },
    );
    final data = result.data as Map<String, dynamic>;
    if (data['user'] is Map<String, dynamic>) {
      return UserAccount.fromJson(data['user'] as Map<String, dynamic>);
    }
    return UserAccount.fromJson(data);
  }
}
