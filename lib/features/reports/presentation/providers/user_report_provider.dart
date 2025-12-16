import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher_string.dart';

import 'package:altayar/features/reports/data/models/user_report.dart';
import 'package:altayar/features/reports/data/reports_repository.dart';

class UserReportProvider extends ChangeNotifier {
  UserReportProvider(this._repository);

  final ReportsRepository _repository;

  UserReportData? report;
  bool isLoading = false;
  bool isDownloading = false;
  String? errorMessage;

  Future<void> loadReport({bool refresh = false}) async {
    isLoading = true;
    notifyListeners();
    try {
      report = await _repository.getUserReport(force: refresh);
      errorMessage = null;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refresh() => loadReport(refresh: true);

  Future<void> downloadPdf() async {
    try {
      isDownloading = true;
      notifyListeners();
      final url = await _repository.createUserReportDownloadUrl();
      if (url != null) {
        await launchUrlString(url, mode: LaunchMode.externalApplication);
        errorMessage = null;
      } else {
        errorMessage = 'تعذّر إنشاء رابط التحميل، حاول مجدداً.';
      }
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isDownloading = false;
      notifyListeners();
    }
  }
}
