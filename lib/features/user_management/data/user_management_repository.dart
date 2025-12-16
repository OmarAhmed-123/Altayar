import 'package:altayar/features/user_management/data/models/manual_gift_payload.dart';
import 'package:altayar/features/user_management/data/models/user_account.dart';
import 'package:altayar/features/user_management/data/user_management_api.dart';

class UserManagementRepository {
  UserManagementRepository(this._api);

  final UserManagementApi _api;

  Future<List<UserAccount>> getUsers() => _api.fetchUsers();

  Future<UserAccount> updateRole({
    required int userId,
    required String role,
    bool? isSuperAdmin,
  }) {
    final payload = {
      'role': role,
      if (isSuperAdmin != null) 'is_super_admin': isSuperAdmin,
    };
    return _api.updateUser(id: userId, payload: payload);
  }

  Future<UserAccount?> sendManualGift({
    required int userId,
    required ManualGiftPayload payload,
  }) {
    return _api.sendManualGift(userId, payload);
  }

  Future<UserAccount> createUser({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phone,
    required String role,
  }) {
    return _api.createUser(
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      phone: phone,
      role: role,
    );
  }

  Future<void> deleteUser(int userId) {
    return _api.deleteUser(userId);
  }

  Future<UserAccount> banUser({
    required int userId,
    required bool banned,
    String? banReason,
  }) {
    return _api.banUser(
      userId: userId,
      banned: banned,
      banReason: banReason,
    );
  }
}
