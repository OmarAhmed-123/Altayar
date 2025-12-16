import 'package:altayar/core/networking/api_client.dart';

class TripApi {
  TripApi(this._client);

  final ApiClient _client;

  Future<Map<String, dynamic>> createTrip(Map<String, dynamic> payload) async {
    final result = await _client.post('trips', body: payload);
    return (result.data as Map<String, dynamic>?) ?? {};
  }

  Future<Map<String, dynamic>> updateStatus(
    int tripId,
    String status,
  ) async {
    final result = await _client.put(
      'trips/status/$tripId',
      body: {'status': status},
    );
    return (result.data as Map<String, dynamic>?) ?? {};
  }
}
