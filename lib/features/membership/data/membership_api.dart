import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/membership/data/models/membership_card.dart';
import 'package:altayar/features/membership/data/models/membership_plan.dart';
import 'package:altayar/features/membership/data/models/referral_summary.dart';

class MembershipApi {
  MembershipApi(this._client);

  final ApiClient _client;

  Future<List<MembershipPlan>> fetchPlans() async {
    try {
      print('🔄 [MembershipAPI] Starting to fetch plans from API...');
      final result = await _client.get('memberships');

      // Log raw response structure for debugging
      print('📥 [MembershipAPI] Raw response type: ${result.data.runtimeType}');
      if (result.data is Map) {
        print(
            '📥 [MembershipAPI] Response keys: ${(result.data as Map).keys.toList()}');
      }

      // Handle both direct array and wrapped in 'data' property
      // ApiClient already extracts 'data' from response if it exists, so result.data should be the array
      final responseData = result.data;
      List<dynamic> data;

      if (responseData is Map && responseData.containsKey('data')) {
        // Double-check: if ApiClient didn't extract it, extract it here
        final dataField = responseData['data'];
        if (dataField is List) {
          data = dataField;
          print(
              '📦 [MembershipAPI] Extracted data from Map.data field: ${data.length} items');
        } else {
          print(
              '⚠️ [MembershipAPI] Map.data is not a List, type: ${dataField.runtimeType}');
          data = [];
        }
      } else if (responseData is List) {
        data = responseData;
        print(
            '📦 [MembershipAPI] Response is direct List: ${data.length} items');
      } else {
        print(
            '⚠️ [MembershipAPI] Unexpected response format: ${responseData.runtimeType}');
        data = [];
      }

      print('📊 [MembershipAPI] Total items to parse: ${data.length}');

      // CRITICAL: Parse ALL plans from database (don't filter by isActive here)
      // The backend already filters by is_active=true, so we get all active plans
      final allPlans = data
          .map((item) {
            try {
              if (item is! Map<String, dynamic>) {
                print(
                    '⚠️ [MembershipAPI] Item is not a Map: ${item.runtimeType}');
                return null;
              }
              final plan = MembershipPlan.fromJson(item);
              print(
                  '✅ [MembershipAPI] Parsed plan: "${plan.name}" (ID: ${plan.id}, Tier: ${plan.tier}, Active: ${plan.isActive}, Price: ${plan.price})');
              return plan;
            } catch (e, stackTrace) {
              // Log parsing errors but continue
              print('❌ [MembershipAPI] Failed to parse plan: $e');
              print('❌ [MembershipAPI] Stack trace: $stackTrace');
              print('❌ [MembershipAPI] Item data: $item');
              return null;
            }
          })
          .whereType<MembershipPlan>()
          .toList();

      print(
          '📋 [MembershipAPI] Successfully parsed ${allPlans.length} plans from ${data.length} items');

      // CRITICAL: Filter only by isActive to ensure we show all active plans
      // Backend should return only active plans, but we double-check here
      final activePlans = allPlans.where((plan) {
        if (!plan.isActive) {
          print(
              '⚠️ [MembershipAPI] Plan "${plan.name}" (ID: ${plan.id}) is not active - excluding');
          return false;
        }
        print(
            '✅ [MembershipAPI] Including active plan: "${plan.name}" (ID: ${plan.id}, Tier: ${plan.tier})');
        return true;
      }).toList();

      print(
          '✅ [MembershipAPI] Final result: ${activePlans.length} active plans from ${data.length} total items in response');
      if (activePlans.isNotEmpty) {
        print(
            '📋 [MembershipAPI] Active plans list: ${activePlans.map((p) => '${p.tier}: ${p.name}').join(', ')}');
      } else {
        print(
            '⚠️ [MembershipAPI] WARNING: No active plans found! This might indicate a problem.');
      }

      return activePlans;
    } catch (error, stackTrace) {
      print('❌ [MembershipAPI] Error fetching plans: $error');
      print('❌ [MembershipAPI] Stack trace: $stackTrace');
      rethrow;
    }
  }

  Future<MembershipCard> fetchCard() async {
    final result = await _client.get('memberships/card/my');
    return MembershipCard.fromJson(result.data as Map<String, dynamic>? ?? {});
  }

  Future<void> subscribeToPlan(int planId) async {
    await _client.post('memberships/subscribe', body: {'membershipId': planId});
  }

  Future<ReferralSummary> fetchReferralSummary() async {
    final result = await _client.get('affiliate/earnings');
    final data = result.data as Map<String, dynamic>? ?? {};
    final payload = data['data'] is Map<String, dynamic>
        ? data['data'] as Map<String, dynamic>
        : data;
    return ReferralSummary.fromJson(payload);
  }

  Future<Map<String, dynamic>> inviteFriend(String email) async {
    final result =
        await _client.post('affiliate/invite', body: {'email': email});
    return result.data as Map<String, dynamic>? ?? {};
  }

  Future<MembershipPlan> updateMembership(
    int id,
    Map<String, dynamic> payload,
  ) async {
    final result = await _client.put('memberships/$id', body: payload);
    return MembershipPlan.fromJson(result.data as Map<String, dynamic>? ?? {});
  }

  Future<Map<String, dynamic>> createFawaterakInvoice({
    required int membershipId,
    required double amount,
    String currency = 'EGP',
    String? description,
  }) async {
    final result = await _client.post(
      'payments/fawaterak/create-invoice',
      body: {
        'type': 'membership',
        'itemId': membershipId,
        'amount': amount,
        'currency': currency,
        if (description != null) 'description': description,
      },
    );
    return (result.data as Map<String, dynamic>?) ?? {};
  }

  Future<Map<String, dynamic>> checkFawaterakStatus(int transactionId) async {
    final result = await _client.get(
      'payments/fawaterak/status/$transactionId',
    );
    return (result.data as Map<String, dynamic>?) ?? {};
  }

  Future<Map<String, dynamic>> fetchMembershipCardFile() async {
    final result = await _client.get(
      'files/membership-card',
      queryParams: const {'format': 'json'},
    );
    return (result.data as Map<String, dynamic>?) ?? {};
  }

  Future<Map<String, dynamic>> getDownloadUrl({
    required String fileType,
    required int id,
  }) async {
    final result = await _client.get('files/download-url/$fileType/$id');
    return (result.data as Map<String, dynamic>?) ?? {};
  }

  Future<Map<String, dynamic>> fetchAnalytics() async {
    final result = await _client.get('memberships/analytics');
    final data = result.data as Map<String, dynamic>? ?? {};
    return data['data'] is Map<String, dynamic>
        ? data['data'] as Map<String, dynamic>
        : data;
  }

  Future<MembershipPlan> createMembership(Map<String, dynamic> payload) async {
    final result = await _client.post('memberships', body: payload);
    final data = result.data as Map<String, dynamic>? ?? {};
    final membershipData = data['data'] is Map<String, dynamic>
        ? data['data'] as Map<String, dynamic>
        : data;
    return MembershipPlan.fromJson(membershipData);
  }

  Future<void> deleteMembership(int id) async {
    await _client.delete('memberships/$id');
  }

  Future<Map<String, dynamic>> getMembershipBookings(
    int id, {
    bool completedOnly = false,
  }) async {
    final url = completedOnly
        ? 'memberships/$id/bookings?completedOnly=true'
        : 'memberships/$id/bookings';
    final result = await _client.get(url);
    final data = result.data as Map<String, dynamic>? ?? {};
    return data['data'] is Map<String, dynamic>
        ? data['data'] as Map<String, dynamic>
        : data;
  }
}
