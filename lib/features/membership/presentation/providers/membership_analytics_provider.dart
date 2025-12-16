import 'package:flutter/foundation.dart';
import 'package:altayar/core/networking/api_exceptions.dart';
import 'package:altayar/features/membership/data/membership_repository.dart';

class MembershipAnalyticsProvider extends ChangeNotifier {
  MembershipAnalyticsProvider(this._repository);

  final MembershipRepository _repository;

  Map<String, dynamic>? analytics;
  bool isLoading = false;
  String? errorMessage;

  Future<void> loadAnalytics() async {
    isLoading = true;
    notifyListeners();
    try {
      analytics = await _repository.getAnalytics();
      errorMessage = null;
    } on ApiException catch (error) {
      errorMessage = error.message;
      analytics = null;
    } catch (_) {
      errorMessage = 'تعذّر تحميل بيانات التحليلات';
      analytics = null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  List<Map<String, dynamic>> get chartData {
    if (analytics == null) return [];
    final data = analytics!['chartData'] as List<dynamic>?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Map<String, dynamic>? get statistics {
    return analytics?['statistics'] as Map<String, dynamic>?;
  }
}
