import 'package:altayar/features/reports/data/models/invoice_data.dart';
import 'package:altayar/features/reports/data/models/payment_record.dart';
import 'package:altayar/features/reports/data/models/user_report.dart';
import 'package:altayar/features/reports/data/reports_api.dart';

class ReportsRepository {
  ReportsRepository(this._api);

  final ReportsApi _api;

  List<PaymentRecord>? _historyCache;
  UserReportData? _userReportCache;

  Future<List<PaymentRecord>> getHistory({
    bool force = false,
    String? search,
    String? type,
  }) async {
    if (!force && _historyCache != null && search == null && type == null) {
      return _historyCache!;
    }
    final data = await _api.fetchPaymentHistory(search: search, type: type);
    if (search == null && type == null) {
      _historyCache = data;
    }
    return data;
  }

  Future<UserReportData> getUserReport({bool force = false}) async {
    if (!force && _userReportCache != null) return _userReportCache!;
    final report = await _api.fetchUserReport();
    _userReportCache = report;
    return report;
  }

  Future<InvoiceData> generateInvoice(int bookingId) {
    return _api.generateInvoice(bookingId);
  }

  Future<String?> downloadCompanyReport() async {
    final response = await _api.downloadCompanyPdf();
    return response['url']?.toString();
  }

  Future<String?> createUserReportDownloadUrl() {
    return _api.createUserReportDownloadUrl();
  }
}
