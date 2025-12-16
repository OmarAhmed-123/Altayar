import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PackageFavoritesProvider extends ChangeNotifier {
  static const _prefsKey = 'package_favorites';
  final Set<int> _favorites = {};
  bool _initialized = false;

  Set<int> get favorites => _favorites;

  Future<void> initialize() async {
    if (_initialized) return;
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getStringList(_prefsKey) ?? [];
    _favorites
      ..clear()
      ..addAll(stored.map(int.parse));
    _initialized = true;
    notifyListeners();
  }

  bool isFavorite(int id) => _favorites.contains(id);

  Future<void> toggle(int id) async {
    if (_favorites.contains(id)) {
      _favorites.remove(id);
    } else {
      _favorites.add(id);
    }
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(
      _prefsKey,
      _favorites.map((e) => e.toString()).toList(),
    );
  }
}

