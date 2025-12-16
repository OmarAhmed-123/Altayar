import 'package:altayar/features/booking/data/booking_api.dart';
import 'package:altayar/features/booking/data/models/booking.dart';

class BookingRepository {
  BookingRepository(this._api);

  final BookingApi _api;

  List<BookingModel>? _adminCache;
  List<BookingModel>? _myCache;

  Future<List<BookingModel>> getAdminBookings({bool force = false}) async {
    if (!force && _adminCache != null) return _adminCache!;
    final data = await _api.fetchAdminBookings();
    _adminCache = data;
    return data;
  }

  Future<List<BookingModel>> getMyBookings({bool force = false}) async {
    if (!force && _myCache != null) return _myCache!;
    final data = await _api.fetchMyBookings();
    _myCache = data;
    return data;
  }

  Future<BookingModel> createBooking(Map<String, dynamic> payload) async {
    final created = await _api.createBooking(payload);
    _adminCache = _adminCache == null ? null : [created, ..._adminCache!];
    _myCache = _myCache == null ? null : [created, ..._myCache!];
    return created;
  }

  Future<BookingModel> updateStatus(int id, BookingStatus status) async {
    final updated = await _api.updateStatus(id, status);
    _adminCache = _adminCache
        ?.map((booking) => booking.id == id ? updated : booking)
        .toList();
    _myCache = _myCache
        ?.map((booking) => booking.id == id ? updated : booking)
        .toList();
    return updated;
  }

  Future<String> createPaymentLink(int bookingId) {
    return _api.createPaymentLink(bookingId);
  }

  Future<BookingModel> createBookingByAdmin(
      Map<String, dynamic> payload) async {
    final created = await _api.createBookingByAdmin(payload);
    _adminCache = _adminCache == null ? [created] : [created, ..._adminCache!];
    _myCache = _myCache == null ? [created] : [created, ..._myCache!];
    return created;
  }

  Future<void> deleteBooking(int id) async {
    await _api.deleteBooking(id);
    _adminCache = _adminCache?.where((b) => b.id != id).toList();
    _myCache = _myCache?.where((b) => b.id != id).toList();
  }
}
