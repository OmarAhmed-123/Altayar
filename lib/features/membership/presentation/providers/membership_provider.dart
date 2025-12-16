import 'package:flutter/foundation.dart';

import 'package:altayar/core/networking/api_exceptions.dart';
import 'package:altayar/features/membership/data/membership_repository.dart';
import 'package:altayar/features/membership/data/models/membership_plan.dart';
import 'package:altayar/features/membership/data/models/sample_memberships.dart';

enum MembershipStatus { idle, loading, success, error }

class MembershipProvider extends ChangeNotifier {
  MembershipProvider(this._repository);

  final MembershipRepository _repository;

  MembershipStatus status = MembershipStatus.idle;
  List<MembershipPlan> plans = [];
  String? errorMessage;
  MembershipPlan? selectedPlan;
  bool isSubscribing = false;
  bool isUpdatingPlan = false;
  PaymentSession? _activeSession;

  PaymentSession? get activeSession => _activeSession;

  Future<void> fetchPlans({bool refresh = false}) async {
    print('🔄 [MembershipProvider] fetchPlans called (refresh: $refresh)');
    status = MembershipStatus.loading;
    errorMessage = null;
    notifyListeners();
    try {
      // CRITICAL: Force refresh to get all active memberships from database
      print(
          '📡 [MembershipProvider] Fetching plans from repository (forceRefresh: $refresh)...');
      final fetchedPlans = await _repository.getPlans(forceRefresh: refresh);

      // Log for debugging
      print(
          '📋 [MembershipProvider] Fetched ${fetchedPlans.length} plans from repository');
      if (fetchedPlans.isEmpty) {
        print(
            '⚠️ [MembershipProvider] WARNING: No plans fetched from repository!');
      } else {
        for (final plan in fetchedPlans) {
          print(
              '  ✅ Plan: "${plan.name}" (ID: ${plan.id}, Tier: ${plan.tier}, Active: ${plan.isActive}, Price: ${plan.price})');
        }
      }

      plans = fetchedPlans;

      if (selectedPlan == null && plans.isNotEmpty) {
        selectedPlan = plans.first;
        print(
            '🎯 [MembershipProvider] Selected first plan: ${selectedPlan!.name}');
      }

      status = MembershipStatus.success;
      errorMessage = null;

      print(
          '✅ [MembershipProvider] Successfully loaded ${plans.length} active plans');
      if (plans.isEmpty) {
        print(
            '⚠️ [MembershipProvider] WARNING: Plans list is empty after successful fetch!');
      }
    } on ApiException catch (error) {
      errorMessage = error.message;
      status = MembershipStatus.error;
      print('❌ [MembershipProvider] API Error: ${error.message}');
      print('❌ [MembershipProvider] Status code: ${error.statusCode}');
      print('❌ [MembershipProvider] Error body: ${error.body}');
      // Only use fallback if we have no plans at all
      if (plans.isEmpty) {
        print('⚠️ [MembershipProvider] Using fallback data due to error');
        _useFallbackData();
      } else {
        print('ℹ️ [MembershipProvider] Keeping existing plans despite error');
      }
    } catch (error, stackTrace) {
      errorMessage = 'حدث خطأ أثناء تحميل الباقات: ${error.toString()}';
      status = MembershipStatus.error;
      print('❌ [MembershipProvider] Error: $error');
      print('❌ [MembershipProvider] Stack trace: $stackTrace');
      // Only use fallback if we have no plans at all
      if (plans.isEmpty) {
        print('⚠️ [MembershipProvider] Using fallback data due to error');
        _useFallbackData();
      } else {
        print('ℹ️ [MembershipProvider] Keeping existing plans despite error');
      }
    } finally {
      print(
          '📢 [MembershipProvider] Notifying listeners (plans count: ${plans.length})');
      notifyListeners();
    }
  }

  void selectPlan(MembershipPlan plan) {
    selectedPlan = plan;
    notifyListeners();
  }

  Future<bool> subscribe([MembershipPlan? planOverride]) async {
    final plan = planOverride ?? selectedPlan;
    if (plan == null) return false;
    isSubscribing = true;
    notifyListeners();
    try {
      await _repository.subscribe(plan.id);
      _activeSession = null;
      return true;
    } catch (_) {
      errorMessage = 'تعذّر إتمام عملية الاشتراك، حاول مرة أخرى';
      return false;
    } finally {
      isSubscribing = false;
      notifyListeners();
    }
  }

  Future<MembershipPlan?> updatePlanValues(
    MembershipPlan plan, {
    double? price,
    int? points,
    double? pointMultiplier,
    double? cashbackRate,
    int? welcomePoints,
    double? welcomeCashback,
  }) async {
    isUpdatingPlan = true;
    notifyListeners();
    try {
      final updated = await _repository.updatePlan(
        plan,
        price: price,
        points: points,
        pointMultiplier: pointMultiplier,
        cashbackRate: cashbackRate,
        welcomePoints: welcomePoints,
        welcomeCashback: welcomeCashback,
      );
      plans =
          plans.map((item) => item.id == updated.id ? updated : item).toList();
      if (selectedPlan?.id == updated.id) {
        selectedPlan = updated;
      }
      return updated;
    } catch (error) {
      errorMessage = error.toString();
      return null;
    } finally {
      isUpdatingPlan = false;
      notifyListeners();
    }
  }

  Future<PaymentSession?> createPaymentSession(
    MembershipPlan plan,
  ) async {
    try {
      final response = await _repository.createInvoice(plan: plan);
      final data = response['data'] as Map<String, dynamic>? ?? response;
      // CRITICAL FIX: Prioritize invoiceUrl from backend response
      final paymentUrl = data['invoiceUrl'] ??
          data['invoice_url'] ??
          data['payment_url'] ??
          data['PaymentURL'] ??
          data['url'];
      final transactionId = data['transactionId'] ??
          data['transaction_id'] ??
          data['id'] ??
          data['invoice_id'] ??
          data['invoiceId'];
      if (paymentUrl == null || transactionId == null) {
        errorMessage =
            'تعذّر إنشاء رابط الدفع من Fawaterak. يرجى المحاولة مرة أخرى.';
        notifyListeners();
        return null;
      }
      _activeSession = PaymentSession(
        plan: plan,
        paymentUrl: paymentUrl.toString(),
        transactionId: int.tryParse(transactionId.toString()) ?? 0,
      );
      notifyListeners();
      return _activeSession;
    } catch (error) {
      errorMessage = error.toString().contains('timeout')
          ? 'انتهت مهلة الاتصال. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.'
          : error.toString();
      notifyListeners();
      return null;
    }
  }

  Future<bool> verifyPaymentAndActivate() async {
    final session = _activeSession;
    if (session == null) return false;
    try {
      final statusResponse =
          await _repository.checkInvoiceStatus(session.transactionId);
      final data =
          statusResponse['data'] as Map<String, dynamic>? ?? statusResponse;
      final status = (data['status'] ?? data['payment_status'] ?? '')
          .toString()
          .toLowerCase();
      if (status.contains('paid') ||
          status.contains('success') ||
          status == 'completed') {
        final success = await subscribe(session.plan);
        if (success) {
          // Payment is successful, balances will be updated by backend callback
          // We just need to refresh the UI
          _activeSession = null;
          notifyListeners();
        }
        return success;
      }
      errorMessage = 'الدفع لم يُستكمل بعد. تحقق من الرابط أو حاول مجدداً.';
      notifyListeners();
      return false;
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
      return false;
    }
  }

  void cancelPaymentSession() {
    _activeSession = null;
    notifyListeners();
  }

  void _useFallbackData() {
    if (plans.isEmpty) {
      plans = SampleMembershipData.plans;
      selectedPlan = plans.first;
    }
  }

  Future<bool> deleteMembership(int id) async {
    try {
      await _repository.deleteMembership(id);
      plans = plans.where((p) => p.id != id).toList();
      if (selectedPlan?.id == id) {
        selectedPlan = plans.isNotEmpty ? plans.first : null;
      }
      notifyListeners();
      return true;
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
      return false;
    }
  }

  Future<MembershipPlan?> createMembership(Map<String, dynamic> data) async {
    try {
      final newPlan = await _repository.createMembership(data);
      plans = [...plans, newPlan];
      notifyListeners();
      return newPlan;
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
      return null;
    }
  }

  Future<Map<String, dynamic>?> getMembershipBookings(
    int id, {
    bool completedOnly = false,
  }) async {
    try {
      return await _repository.getMembershipBookings(
        id,
        completedOnly: completedOnly,
      );
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
      return null;
    }
  }
}

class PaymentSession {
  PaymentSession({
    required this.plan,
    required this.paymentUrl,
    required this.transactionId,
  });

  final MembershipPlan plan;
  final String paymentUrl;
  final int transactionId;
}
