import 'dart:io';

import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/core/networking/api_result.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as p;

class ProfileApi {
  ProfileApi(this._client);

  final ApiClient _client;

  /// Get user profile
  Future<Map<String, dynamic>> getProfile() async {
    final ApiResult<dynamic> result = await _client.get('users/profile');
    return result.data as Map<String, dynamic>? ?? {};
  }

  /// Update user profile with optional image upload
  Future<Map<String, dynamic>> updateProfile({
    String? name,
    String? email,
    String? phone,
    File? profilePicture,
  }) async {
    if (profilePicture != null) {
      // Upload with image
      final extension =
          p.extension(profilePicture.path).replaceFirst('.', '').toLowerCase();
      final contentType =
          MediaType('image', extension.isEmpty ? 'jpeg' : extension);

      final file = await http.MultipartFile.fromPath(
        'profilePicture',
        profilePicture.path,
        filename: p.basename(profilePicture.path),
        contentType: contentType,
      );

      final fields = <String, String>{};
      if (name != null) fields['name'] = name;
      if (email != null) fields['email'] = email;
      if (phone != null) fields['phone'] = phone;

      final result = await _client.putMultipart(
        'users/profile',
        fields: fields,
        files: [file],
      );

      return result.data as Map<String, dynamic>? ?? {};
    } else {
      // Update without image
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (email != null) body['email'] = email;
      if (phone != null) body['phone'] = phone;

      final ApiResult<dynamic> result = await _client.put(
        'users/profile',
        body: body,
      );

      return result.data as Map<String, dynamic>? ?? {};
    }
  }
}
