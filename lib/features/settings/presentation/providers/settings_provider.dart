import 'package:flutter/material.dart';

import 'package:altayar/core/networking/api_exceptions.dart';
import 'package:altayar/features/settings/data/models/frontend_page.dart';
import 'package:altayar/features/settings/data/models/site_settings.dart';
import 'package:altayar/features/settings/data/settings_repository.dart';

class SettingsProvider extends ChangeNotifier {
  SettingsProvider(this._repository);

  final SettingsRepository _repository;

  SiteSettings? generalSettings;
  String? generalError;
  bool isLoadingGeneral = false;
  bool isSavingGeneral = false;

  List<FrontendPage> pages = const [];
  String? pagesError;
  bool isLoadingPages = false;
  bool isMutatingPage = false;
  final Set<int> _deletingPages = {};

  bool get hasGeneralData => generalSettings != null;

  bool isDeleting(int id) => _deletingPages.contains(id);

  Future<void> loadAll({bool refresh = false}) async {
    await Future.wait([
      fetchGeneralSettings(forceRefresh: refresh),
      fetchPages(forceRefresh: refresh),
    ]);
  }

  Future<void> fetchGeneralSettings({bool forceRefresh = false}) async {
    isLoadingGeneral = true;
    notifyListeners();
    try {
      generalSettings =
          await _repository.getGeneralSettings(forceRefresh: forceRefresh);
      generalError = null;
    } on ApiException catch (error) {
      generalError = error.message;
    } catch (error) {
      generalError = error.toString();
    } finally {
      isLoadingGeneral = false;
      notifyListeners();
    }
  }

  Future<bool> saveGeneral(SiteSettings updated) async {
    isSavingGeneral = true;
    notifyListeners();
    try {
      generalSettings = await _repository.saveGeneralSettings(updated);
      generalError = null;
      return true;
    } on ApiException catch (error) {
      generalError = error.message;
      return false;
    } catch (error) {
      generalError = error.toString();
      return false;
    } finally {
      isSavingGeneral = false;
      notifyListeners();
    }
  }

  Future<void> fetchPages({bool forceRefresh = false}) async {
    isLoadingPages = true;
    notifyListeners();
    try {
      pages = await _repository.getPages(forceRefresh: forceRefresh);
      pagesError = null;
    } on ApiException catch (error) {
      pagesError = error.message;
    } catch (error) {
      pagesError = error.toString();
    } finally {
      isLoadingPages = false;
      notifyListeners();
    }
  }

  Future<bool> savePage(FrontendPageDraft draft) async {
    isMutatingPage = true;
    notifyListeners();
    try {
      FrontendPage page;
      if (draft.id == null) {
        page = await _repository.createPage(draft);
        pages = [page, ...pages];
      } else {
        page = await _repository.updatePage(draft);
        pages = pages
            .map((existing) => existing.id == page.id ? page : existing)
            .toList();
      }
      pagesError = null;
      return true;
    } on ApiException catch (error) {
      pagesError = error.message;
      return false;
    } catch (error) {
      pagesError = error.toString();
      return false;
    } finally {
      isMutatingPage = false;
      notifyListeners();
    }
  }

  Future<bool> deletePage(int id) async {
    _deletingPages.add(id);
    notifyListeners();
    try {
      await _repository.deletePage(id);
      pages = pages.where((page) => page.id != id).toList();
      return true;
    } on ApiException catch (error) {
      pagesError = error.message;
      return false;
    } catch (error) {
      pagesError = error.toString();
      return false;
    } finally {
      _deletingPages.remove(id);
      notifyListeners();
    }
  }
}
