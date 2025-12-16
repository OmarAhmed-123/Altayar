import 'package:altayar/features/trip_maker/data/models/trip_plan.dart';
import 'package:altayar/features/trip_maker/data/trip_api.dart';

class TripRepository {
  TripRepository(this._api);

  final TripApi _api;

  Future<int?> createTrip({
    required TripPlan plan,
    required String status,
  }) async {
    final response = await _api.createTrip(plan.toPayload());
    final tripId = response['id'] as int?;
    if (tripId != null) {
      await _api.updateStatus(tripId, status);
    }
    return tripId;
  }
}
