import 'package:altayar/features/packages/data/models/travel_package.dart';
import 'package:altayar/features/packages/data/package_api.dart';

class PackageRepository {
  PackageRepository(this._api);

  final PackageApi _api;
  List<TravelPackage>? _cache;

  Future<List<TravelPackage>> getPackages({bool forceRefresh = false}) async {
    if (!forceRefresh && _cache != null) return _cache!;
    final data = await _api.fetchPackages();
    _cache = data;
    return data;
  }

  Future<TravelPackage> getPackageDetail(int id) async {
    final detail = await _api.fetchPackageDetail(id);
    if (_cache == null) {
      _cache = [detail];
    } else {
      final index = _cache!.indexWhere((pkg) => pkg.id == id);
      if (index >= 0) {
        _cache![index] = detail;
      } else {
        _cache = [..._cache!, detail];
      }
    }
    return detail;
  }

  Future<TravelPackage> createPackage(Map<String, dynamic> data) async {
    final newPackage = await _api.createPackage(data);
    _cache = _cache != null ? [..._cache!, newPackage] : [newPackage];
    return newPackage;
  }

  Future<TravelPackage> updatePackage(int id, Map<String, dynamic> data) async {
    final updated = await _api.updatePackage(id, data);
    _cache = _cache?.map((pkg) => pkg.id == id ? updated : pkg).toList();
    return updated;
  }

  Future<void> deletePackage(int id) async {
    await _api.deletePackage(id);
    _cache = _cache?.where((pkg) => pkg.id != id).toList();
  }

  Future<Map<String, dynamic>> getPackageBookings(int id) =>
      _api.getPackageBookings(id);
}
