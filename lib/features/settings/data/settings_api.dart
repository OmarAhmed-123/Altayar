import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/settings/data/models/frontend_page.dart';
import 'package:altayar/features/settings/data/models/site_settings.dart';

class SettingsApi {
  SettingsApi(this._client);

  final ApiClient _client;

  Future<SiteSettings> fetchGeneralSettings() async {
    final response = await _client.get('settings/general');
    final data = response.data as Map<String, dynamic>? ?? {};
    return SiteSettings.fromJson(data);
  }

  Future<SiteSettings> updateGeneralSettings(SiteSettings settings) async {
    final response = await _client.put(
      'settings/general',
      body: settings.toJson(),
    );
    final data = response.data as Map<String, dynamic>? ?? {};
    return SiteSettings.fromJson(data);
  }

  Future<List<FrontendPage>> fetchPages() async {
    final response = await _client.get('settings/pages');
    final data = response.data as List<dynamic>? ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(FrontendPage.fromJson)
        .toList();
  }

  Future<FrontendPage> createPage(FrontendPageDraft draft) async {
    final response = await _client.post(
      'settings/pages',
      body: draft.toRequestBody(),
    );
    final data = response.data as Map<String, dynamic>? ?? {};
    return FrontendPage.fromJson(data);
  }

  Future<FrontendPage> updatePage(FrontendPageDraft draft) async {
    final id = draft.id;
    if (id == null) {
      throw ArgumentError('Page id is required for update');
    }
    final response = await _client.put(
      'settings/pages/$id',
      body: draft.toRequestBody(),
    );
    final data = response.data as Map<String, dynamic>? ?? {};
    return FrontendPage.fromJson(data);
  }

  Future<void> deletePage(int id) async {
    await _client.delete('settings/pages/$id');
  }
}
