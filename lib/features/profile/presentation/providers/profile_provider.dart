import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:altayar/features/profile/data/profile_repository.dart';

class ProfileProvider extends ChangeNotifier {
  ProfileProvider(this._repository);

  final ProfileRepository _repository;

  bool isLoading = false;
  bool isUpdating = false;
  String? errorMessage;
  Map<String, dynamic>? profileData;

  /// Load user profile
  Future<void> loadProfile() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      profileData = await _repository.getProfile();
    } catch (error) {
      errorMessage = error.toString().replaceAll('Exception: ', '');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// Update user profile
  Future<bool> updateProfile({
    String? name,
    String? email,
    String? phone,
    File? profilePicture,
  }) async {
    isUpdating = true;
    errorMessage = null;
    notifyListeners();

    try {
      final result = await _repository.updateProfile(
        name: name,
        email: email,
        phone: phone,
        profilePicture: profilePicture,
      );

      // Update local profile data
      profileData = result;
      return true;
    } catch (error) {
      errorMessage = error.toString().replaceAll('Exception: ', '');
      return false;
    } finally {
      isUpdating = false;
      notifyListeners();
    }
  }

  void clearError() {
    if (errorMessage != null) {
      errorMessage = null;
      notifyListeners();
    }
  }
}
