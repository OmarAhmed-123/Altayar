import 'package:flutter/foundation.dart';

import 'package:altayar/features/packages/data/models/travel_package.dart';
import 'package:altayar/features/packages/data/package_repository.dart';

class PackageProvider extends ChangeNotifier {
  PackageProvider(this._repository);

  final PackageRepository _repository;

  List<TravelPackage> packages = [];
  String query = '';
  String? destination;
  double? maxPrice;
  int? maxDurationDays;
  bool exclusiveOnly = false;
  bool isLoading = false;
  String? errorMessage;

  Future<void> loadPackages({bool refresh = false}) async {
    isLoading = true;
    notifyListeners();
    try {
      packages = await _repository.getPackages(forceRefresh: refresh);
      errorMessage = null;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  List<TravelPackage> get filteredPackages {
    return packages.where((item) {
      if (exclusiveOnly && !item.isExclusive) return false;
      if (destination != null &&
          destination!.isNotEmpty &&
          (item.destination?.toLowerCase() ?? '') !=
              destination!.toLowerCase()) {
        return false;
      }
      if (maxPrice != null && item.price > maxPrice!) return false;
      if (maxDurationDays != null && item.durationDays > maxDurationDays!) {
        return false;
      }
      if (query.isNotEmpty) {
        final text = '${item.title} ${item.description} ${item.destination}'
            .toLowerCase();
        if (!text.contains(query.toLowerCase())) return false;
      }
      return true;
    }).toList();
  }

  void setQuery(String value) {
    query = value;
    notifyListeners();
  }

  void setDestination(String? value) {
    destination = value;
    notifyListeners();
  }

  void setMaxPrice(double? value) {
    maxPrice = value;
    notifyListeners();
  }

  void setMaxDuration(int? value) {
    maxDurationDays = value;
    notifyListeners();
  }

  void toggleExclusive(bool value) {
    exclusiveOnly = value;
    notifyListeners();
  }

  Future<TravelPackage> fetchPackageDetail(int id) async {
    try {
      final detail = await _repository.getPackageDetail(id);
      final exists = packages.any((pkg) => pkg.id == id);
      packages = exists
          ? packages.map((pkg) => pkg.id == id ? detail : pkg).toList()
          : [...packages, detail];
      errorMessage = null;
      notifyListeners();
      return detail;
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<TravelPackage?> createPackage(Map<String, dynamic> data) async {
    isLoading = true;
    notifyListeners();
    try {
      final newPackage = await _repository.createPackage(data);
      packages = [...packages, newPackage];
      errorMessage = null;
      return newPackage;
    } catch (error) {
      errorMessage = error.toString();
      return null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<TravelPackage?> updatePackage(int id, Map<String, dynamic> data) async {
    isLoading = true;
    notifyListeners();
    try {
      final updated = await _repository.updatePackage(id, data);
      packages = packages.map((pkg) => pkg.id == id ? updated : pkg).toList();
      errorMessage = null;
      return updated;
    } catch (error) {
      errorMessage = error.toString();
      return null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deletePackage(int id) async {
    isLoading = true;
    notifyListeners();
    try {
      await _repository.deletePackage(id);
      packages = packages.where((pkg) => pkg.id != id).toList();
      errorMessage = null;
      return true;
    } catch (error) {
      errorMessage = error.toString();
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> getPackageBookings(int id) async {
    try {
      return await _repository.getPackageBookings(id);
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
      return null;
    }
  }
}
