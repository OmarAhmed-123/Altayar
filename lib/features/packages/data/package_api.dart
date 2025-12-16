import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/packages/data/models/travel_package.dart';

class PackageApi {
  PackageApi(this._client);

  final ApiClient _client;

  Future<List<TravelPackage>> fetchPackages() async {
    final result = await _client.get('packages');
    final list = result.data as List<dynamic>? ?? [];
    return list
        .map((item) => TravelPackage.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<TravelPackage> fetchPackageDetail(int id) async {
    final result = await _client.get('packages/$id');
    return TravelPackage.fromJson(
      result.data as Map<String, dynamic>? ?? {},
    );
  }

  Future<TravelPackage> createPackage(Map<String, dynamic> payload) async {
    final result = await _client.post('packages', body: payload);
    return TravelPackage.fromJson(
      result.data as Map<String, dynamic>? ?? {},
    );
  }

  Future<TravelPackage> updatePackage(int id, Map<String, dynamic> payload) async {
    final result = await _client.put('packages/$id', body: payload);
    return TravelPackage.fromJson(
      result.data as Map<String, dynamic>? ?? {},
    );
  }

  Future<void> deletePackage(int id) async {
    await _client.delete('packages/$id');
  }

  Future<Map<String, dynamic>> getPackageBookings(int id) async {
    final result = await _client.get('packages/$id/bookings');
    final data = result.data as Map<String, dynamic>? ?? {};
    return data['data'] is Map<String, dynamic>
        ? data['data'] as Map<String, dynamic>
        : data;
  }
}
