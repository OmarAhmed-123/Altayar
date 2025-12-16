import 'package:flutter/foundation.dart';

import 'package:altayar/features/user_management/data/models/manual_gift_payload.dart';
import 'package:altayar/features/user_management/data/models/user_account.dart';
import 'package:altayar/features/user_management/data/user_management_repository.dart';

class UserManagementProvider extends ChangeNotifier {
  UserManagementProvider(this._repository);

  final UserManagementRepository _repository;

  List<UserAccount> _users = [];
  bool isLoading = false;
  bool isSendingGift = false;
  bool isCreatingUser = false;
  bool isDeletingUser = false;
  bool isBanningUser = false;
  String? errorMessage;
  String? roleFilter;
  String searchQuery = '';

  List<UserAccount> get users {
    var list = _users;
    if (roleFilter != null && roleFilter!.isNotEmpty) {
      list = list.where((u) => u.role == roleFilter).toList();
    }
    if (searchQuery.isNotEmpty) {
      list = list
          .where((u) =>
              u.name.toLowerCase().contains(searchQuery.toLowerCase()) ||
              u.email.toLowerCase().contains(searchQuery.toLowerCase()))
          .toList();
    }
    return list;
  }

  Future<void> loadUsers() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      _users = await _repository.getUsers();
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateUserRole(UserAccount user, String role) async {
    try {
      final updated = await _repository.updateRole(
        userId: user.id,
        role: role,
      );
      _users =
          _users.map((item) => item.id == user.id ? updated : item).toList();
      notifyListeners();
      return true;
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> sendManualGift({
    required int userId,
    required ManualGiftPayload payload,
  }) async {
    isSendingGift = true;
    notifyListeners();
    try {
      final updatedUser = await _repository.sendManualGift(
        userId: userId,
        payload: payload,
      );
      if (updatedUser != null) {
        _users = _users
            .map((user) => user.id == userId ? updatedUser : user)
            .toList();
      }
      isSendingGift = false;
      notifyListeners();
      return true;
    } catch (error) {
      errorMessage = error.toString();
      isSendingGift = false;
      notifyListeners();
      return false;
    }
  }

  void setRoleFilter(String? role) {
    roleFilter = role;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    searchQuery = query;
    notifyListeners();
  }

  Future<bool> createUser({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phone,
    required String role,
  }) async {
    isCreatingUser = true;
    errorMessage = null;
    notifyListeners();
    try {
      final newUser = await _repository.createUser(
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        phone: phone,
        role: role,
      );
      _users.insert(0, newUser);
      isCreatingUser = false;
      notifyListeners();
      return true;
    } catch (error) {
      errorMessage = error.toString();
      isCreatingUser = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteUser(UserAccount user) async {
    isDeletingUser = true;
    errorMessage = null;
    notifyListeners();
    try {
      await _repository.deleteUser(user.id);
      _users.removeWhere((u) => u.id == user.id);
      isDeletingUser = false;
      notifyListeners();
      return true;
    } catch (error) {
      errorMessage = error.toString();
      isDeletingUser = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> banUser({
    required UserAccount user,
    required bool banned,
    String? banReason,
  }) async {
    isBanningUser = true;
    errorMessage = null;
    notifyListeners();
    try {
      final updatedUser = await _repository.banUser(
        userId: user.id,
        banned: banned,
        banReason: banReason,
      );
      _users = _users.map((u) => u.id == user.id ? updatedUser : u).toList();
      isBanningUser = false;
      notifyListeners();
      return true;
    } catch (error) {
      errorMessage = error.toString();
      isBanningUser = false;
      notifyListeners();
      return false;
    }
  }
}
