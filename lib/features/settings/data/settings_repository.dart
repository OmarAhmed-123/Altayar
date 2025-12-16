import 'package:altayar/features/settings/data/models/frontend_page.dart';
import 'package:altayar/features/settings/data/models/site_settings.dart';
import 'package:altayar/features/settings/data/settings_api.dart';

class SettingsRepository {
  SettingsRepository(this._api);

  final SettingsApi _api;

  SiteSettings? _generalCache;
  List<FrontendPage>? _pagesCache;

  Future<SiteSettings> getGeneralSettings({bool forceRefresh = false}) async {
    if (!forceRefresh && _generalCache != null) {
      return _generalCache!;
    }
    final settings = await _api.fetchGeneralSettings();
    _generalCache = settings;
    return settings;
  }

  Future<SiteSettings> saveGeneralSettings(SiteSettings settings) async {
    final updated = await _api.updateGeneralSettings(settings);
    _generalCache = updated;
    return updated;
  }

  Future<List<FrontendPage>> getPages({bool forceRefresh = false}) async {
    if (!forceRefresh && _pagesCache != null) {
      return _pagesCache!;
    }
    final pages = await _api.fetchPages();
    _pagesCache = pages;
    return pages;
  }

  Future<FrontendPage> createPage(FrontendPageDraft draft) async {
    final page = await _api.createPage(draft);
    _pagesCache = pageListWithUpdated(page);
    return page;
  }

  Future<FrontendPage> updatePage(FrontendPageDraft draft) async {
    final page = await _api.updatePage(draft);
    _pagesCache = pageListWithUpdated(page);
    return page;
  }

  Future<void> deletePage(int id) async {
    await _api.deletePage(id);
    final current = _pagesCache ?? const <FrontendPage>[];
    _pagesCache =
        current.where((page) => page.id != id).toList(growable: false);
  }

  List<FrontendPage> pageListWithUpdated(FrontendPage page) {
    final current = _pagesCache ?? const <FrontendPage>[];
    final pages = List<FrontendPage>.from(current, growable: true);
    final index = pages.indexWhere((element) => element.id == page.id);
    if (index >= 0) {
      pages[index] = page;
    } else {
      pages.insert(0, page);
    }
    return pages;
  }
}
