import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/reports/data/models/invoice_data.dart';
import 'package:altayar/features/reports/data/models/payment_record.dart';
import 'package:altayar/features/reports/data/models/user_report.dart';

class ReportsApi {
  ReportsApi(this._client);

  final ApiClient _client;

  Future<List<PaymentRecord>> fetchPaymentHistory({
    String? search,
    String? type,
  }) async {
    final queryParams = <String, dynamic>{};
    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }
    if (type != null && type.isNotEmpty) {
      queryParams['type'] = type;
    }
    final response = await _client.get(
      'reports/payment-history',
      queryParams: queryParams,
    );
    final payload = response.data;
    List<dynamic> data;
    if (payload is Map<String, dynamic>) {
      data = payload['data'] as List<dynamic>? ?? [];
    } else if (payload is List<dynamic>) {
      data = payload;
    } else {
      data = [];
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(PaymentRecord.fromJson)
        .toList();
  }

  Future<InvoiceData> generateInvoice(int bookingId) async {
    final response = await _client.get('reports/invoice/$bookingId');
    final payload = response.data as Map<String, dynamic>? ?? {};
    return InvoiceData.fromJson(payload);
  }

  Future<Map<String, dynamic>> downloadCompanyPdf() async {
    final response = await _client.get('reports/user-pdf');
    return response.data as Map<String, dynamic>? ?? {};
  }

  Future<UserReportData> fetchUserReport() async {
    final response = await _client.get('reports/user-data');
    final payload = response.data as Map<String, dynamic>? ?? {};
    return UserReportData.fromJson(payload);
  }

  Future<String?> createUserReportDownloadUrl() async {
    final response = await _client.get('reports/download-url');
    final map = response.data as Map<String, dynamic>? ?? {};
    final data = map['data'] as Map<String, dynamic>? ?? map;
    return data['downloadUrl']?.toString();
  }
}
