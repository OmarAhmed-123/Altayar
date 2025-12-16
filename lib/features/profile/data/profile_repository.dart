import 'dart:io';

import 'package:altayar/features/profile/data/profile_api.dart';

class ProfileRepository {
  ProfileRepository(this._api);

  final ProfileApi _api;

  Future<Map<String, dynamic>> getProfile() => _api.getProfile();

  Future<Map<String, dynamic>> updateProfile({
    String? name,
    String? email,
    String? phone,
    File? profilePicture,
  }) =>
      _api.updateProfile(
        name: name,
        email: email,
        phone: phone,
        profilePicture: profilePicture,
      );
}
