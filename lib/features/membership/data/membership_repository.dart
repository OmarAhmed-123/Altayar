import 'package:altayar/core/utils/logger.dart';
import 'package:altayar/features/membership/data/membership_api.dart';
import 'package:altayar/features/membership/data/models/membership_card.dart';
import 'package:altayar/features/membership/data/models/membership_plan.dart';
import 'package:altayar/features/membership/data/models/referral_summary.dart';

class MembershipRepository {
  MembershipRepository(this._api);

  final MembershipApi _api;
  List<MembershipPlan>? _cache;

  Future<List<MembershipPlan>> getPlans({bool forceRefresh = false}) async {
    // CRITICAL: Always refresh when forceRefresh is true to get latest data from database
    if (!forceRefresh && _cache != null) {
      print(
          '📦 [MembershipRepository] Using cached plans: ${_cache!.length} plans');
      return _cache!;
    }
    try {
      print(
          '🔄 [MembershipRepository] Fetching plans from API (forceRefresh: $forceRefresh)');
      final plans = await _api.fetchPlans();
      _cache = plans;
      print('✅ [MembershipRepository] Cached ${plans.length} plans');
      return plans;
    } catch (error, stackTrace) {
      AppLogger.error('Failed to fetch plans', error, stackTrace);
      print('❌ [MembershipRepository] Error fetching plans: $error');
      // If we have cached data, return it even on error
      if (_cache != null && _cache!.isNotEmpty) {
        print('⚠️ [MembershipRepository] Returning cached plans due to error');
        return _cache!;
      }
      rethrow;
    }
  }

  Future<MembershipCard> getMembershipCard() => _api.fetchCard();

  Future<void> subscribe(int planId) => _api.subscribeToPlan(planId);

  Future<ReferralSummary> getReferralSummary() => _api.fetchReferralSummary();

  Future<Map<String, dynamic>> invite(String email) => _api.inviteFriend(email);

  Future<MembershipPlan> updatePlan(
    MembershipPlan plan, {
    double? price,
    int? points,
    double? pointMultiplier,
    double? cashbackRate,
    int? welcomePoints,
    double? welcomeCashback,
  }) async {
    final payload = <String, dynamic>{};
    if (price != null) payload['price'] = price;
    if (points != null) payload['points'] = points;
    if (pointMultiplier != null) {
      payload['point_multiplier'] = pointMultiplier;
    }
    if (cashbackRate != null) {
      payload['cashback_rate'] = cashbackRate;
    }
    if (welcomePoints != null) {
      payload['welcome_points'] = welcomePoints;
    }
    if (welcomeCashback != null) {
      payload['welcome_cashback'] = welcomeCashback;
    }
    final updated = await _api.updateMembership(plan.id, payload);
    _cache =
        _cache?.map((item) => item.id == plan.id ? updated : item).toList();
    return updated;
  }

  Future<Map<String, dynamic>> createInvoice({
    required MembershipPlan plan,
    String? description,
  }) {
    return _api.createFawaterakInvoice(
      membershipId: plan.id,
      amount: plan.price,
      description: description ?? plan.name,
    );
  }

  Future<Map<String, dynamic>> checkInvoiceStatus(int transactionId) {
    return _api.checkFawaterakStatus(transactionId);
  }

  Future<Map<String, dynamic>> fetchCardFile() =>
      _api.fetchMembershipCardFile();

  Future<Map<String, dynamic>> getDownloadUrl({
    required String fileType,
    required int id,
  }) =>
      _api.getDownloadUrl(fileType: fileType, id: id);

  Future<Map<String, dynamic>> getAnalytics() => _api.fetchAnalytics();

  Future<MembershipPlan> createMembership(Map<String, dynamic> data) async {
    final newPlan = await _api.createMembership(data);
    _cache = _cache != null ? [..._cache!, newPlan] : [newPlan];
    return newPlan;
  }

  Future<void> deleteMembership(int id) async {
    await _api.deleteMembership(id);
    _cache = _cache?.where((p) => p.id != id).toList();
  }

  Future<Map<String, dynamic>> getMembershipBookings(
    int id, {
    bool completedOnly = false,
  }) =>
      _api.getMembershipBookings(id, completedOnly: completedOnly);
}
