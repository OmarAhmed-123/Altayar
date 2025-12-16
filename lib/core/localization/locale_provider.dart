import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleProvider extends ChangeNotifier {
  LocaleProvider() {
    _loadLocale();
  }

  static const _key = 'app_locale';
  Locale _locale = const Locale('ar');
  bool _initialized = false;

  Locale get locale => _locale;
  bool get isArabic => _locale.languageCode == 'ar';

  Future<void> _loadLocale() async {
    if (_initialized) return;
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString(_key);
    if (code != null && code.isNotEmpty) {
      _locale = Locale(code);
    }
    _initialized = true;
    notifyListeners();
  }

  Future<void> toggleLocale() async {
    final target = isArabic ? const Locale('en') : const Locale('ar');
    await setLocale(target);
  }

  Future<void> setLocale(Locale locale) async {
    _locale = locale;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, locale.languageCode);
    notifyListeners();
  }
}

