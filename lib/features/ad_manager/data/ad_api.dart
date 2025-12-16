import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as p;

import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/ad_manager/data/models/ad_campaign.dart';

class AdApi {
  AdApi(this._client);

  final ApiClient _client;

  Future<List<AdCampaign>> fetchAds() async {
    final response = await _client.get('ads');
    final data = response.data as List<dynamic>? ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(AdCampaign.fromJson)
        .toList();
  }

  Future<AdCampaign> createAd({
    required String title,
    required String description,
    bool isActive = true,
    String? linkUrl,
    DateTime? startDate,
    DateTime? endDate,
    File? image,
  }) async {
    if (image != null) {
      final extension =
          p.extension(image.path).replaceFirst('.', '').toLowerCase();
      final contentType =
          MediaType('image', extension.isEmpty ? 'jpeg' : extension);
      final file = await http.MultipartFile.fromPath(
        'image',
        image.path,
        filename: p.basename(image.path),
        contentType: contentType,
      );
      final multipartFields = _buildPayload(
        title: title,
        description: description,
        isActive: isActive,
        linkUrl: linkUrl,
        startDate: startDate,
        endDate: endDate,
      ).map(
        (key, value) => MapEntry(key, value?.toString() ?? ''),
      );
      final result = await _client.postMultipart(
        'ads',
        fields: multipartFields,
        files: [file],
      );
      return AdCampaign.fromJson(
        result.data as Map<String, dynamic>? ?? {},
      );
    }
    final response = await _client.post(
      'ads',
      body: _buildPayload(
        title: title,
        description: description,
        isActive: isActive,
        linkUrl: linkUrl,
        startDate: startDate,
        endDate: endDate,
      ),
    );
    return AdCampaign.fromJson(
      response.data as Map<String, dynamic>? ?? {},
    );
  }

  Future<AdCampaign> updateAd(int id, Map<String, dynamic> payload) async {
    final normalized = Map<String, dynamic>.from(payload);
    if (normalized.containsKey('description') &&
        !normalized.containsKey('content')) {
      normalized['content'] = normalized.remove('description');
    }
    if (normalized.containsKey('linkUrl') &&
        !normalized.containsKey('link_url')) {
      normalized['link_url'] = normalized['linkUrl'];
    }
    if (normalized.containsKey('startDate') &&
        !normalized.containsKey('start_date')) {
      normalized['start_date'] = normalized['startDate'];
    }
    if (normalized.containsKey('endDate') &&
        !normalized.containsKey('end_date')) {
      normalized['end_date'] = normalized['endDate'];
    }
    if (normalized.containsKey('isActive')) {
      normalized['is_active'] =
          normalized.remove('isActive') ?? normalized['is_active'];
    }
    final response = await _client.put('ads/$id', body: normalized);
    return AdCampaign.fromJson(
      response.data as Map<String, dynamic>? ?? {},
    );
  }

  Future<void> deleteAd(int id) async {
    await _client.delete('ads/$id');
  }

  Future<Map<String, dynamic>> sendAd(
    int id, {
    bool sendToAll = true,
    List<int>? userIds,
  }) async {
    final body = <String, dynamic>{
      'sendToAll': sendToAll,
    };
    if (!sendToAll && userIds != null && userIds.isNotEmpty) {
      body['userIds'] = userIds;
    }
    final response = await _client.post('ads/send/$id', body: body);
    return (response.data as Map<String, dynamic>?) ?? {};
  }

  Map<String, dynamic> _buildPayload({
    required String title,
    required String description,
    required bool isActive,
    String? linkUrl,
    DateTime? startDate,
    DateTime? endDate,
  }) {
    return {
      'title': title,
      'description': description,
      'content': description,
      'isActive': isActive,
      'is_active': isActive,
      if (linkUrl != null) 'linkUrl': linkUrl,
      if (linkUrl != null) 'link_url': linkUrl,
      if (startDate != null) 'startDate': startDate.toIso8601String(),
      if (startDate != null) 'start_date': startDate.toIso8601String(),
      if (endDate != null) 'endDate': endDate.toIso8601String(),
      if (endDate != null) 'end_date': endDate.toIso8601String(),
    };
  }
}
