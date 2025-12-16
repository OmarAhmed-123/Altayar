import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/booking/data/models/booking.dart';
import 'package:altayar/features/sales/data/models/quotation_summary.dart';
import 'package:altayar/features/user_management/data/models/user_account.dart';

class SalesApi {
  SalesApi(this._client);

  final ApiClient _client;

  Future<List<UserAccount>> fetchCustomers({String? search}) async {
    final response = await _client.get(
      'users',
      queryParams: {
        'role': 'customer',
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    final data = response.data as List<dynamic>? ?? [];
    return data
        .map((item) => UserAccount.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<UserAccount> fetchClient(int id) async {
    final response = await _client.get('users/$id');
    return UserAccount.fromJson(
      response.data as Map<String, dynamic>? ?? {},
    );
  }

  Future<List<BookingModel>> fetchClientBookings(int userId) async {
    final response = await _client.get(
      'bookings/admin',
      queryParams: {'userId': userId.toString()},
    );
    final data = response.data as List<dynamic>? ?? [];
    return data
        .map((item) => BookingModel.fromJson(item as Map<String, dynamic>))
        .where((booking) => booking.userId == userId)
        .toList();
  }

  Future<List<QuotationSummary>> fetchQuotations({int? customerId}) async {
    final response = await _client.get(
      'quotations',
      queryParams: {
        if (customerId != null) 'customerId': customerId.toString(),
      },
    );
    final data = response.data as List<dynamic>? ?? [];
    return data
        .map((item) => QuotationSummary.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<QuotationSummary> createQuotation({
    required int customerId,
    List<Map<String, dynamic>>? items,
    double? discount,
    String? notes,
    DateTime? validUntil,
  }) async {
    final response = await _client.post(
      'quotations',
      body: {
        'customerId': customerId,
        if (items != null && items.isNotEmpty) 'items': items,
        if (discount != null) 'discount': discount,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        if (validUntil != null) 'validUntil': validUntil.toIso8601String(),
      },
    );
    final data = response.data as Map<String, dynamic>? ?? {};
    return QuotationSummary.fromJson(data);
  }

  Future<void> sendQuotation(int quotationId) {
    return _client.post(
      'quotations/$quotationId/send',
      body: {
        'sendEmail': true,
        'sendNotification': true,
      },
    );
  }

  Future<void> sendOffer({
    required int userId,
    required String title,
    required String message,
  }) {
    return _client.post(
      'notifications',
      body: {
        'userId': userId,
        'title': title,
        'message': message,
        'type': 'sales_offer',
      },
    );
  }
}
