import 'package:collection/collection.dart';

import 'package:altayar/features/membership/data/membership_repository.dart';
import 'package:altayar/features/sales/data/models/client_profile.dart';
import 'package:altayar/features/sales/data/models/quotation_summary.dart';
import 'package:altayar/features/sales/data/sales_api.dart';
import 'package:altayar/features/user_management/data/models/user_account.dart';

class SalesRepository {
  SalesRepository(
    this._api,
    this._membershipRepository,
  );

  final SalesApi _api;
  final MembershipRepository _membershipRepository;

  Future<List<UserAccount>> getCustomers({String? search}) {
    return _api.fetchCustomers(search: search);
  }

  Future<ClientProfile> getClientProfile(int userId) async {
    final user = await _api.fetchClient(userId);
    final bookings = await _api.fetchClientBookings(userId);
    final plans = await _membershipRepository.getPlans();
    final plan = plans.firstWhereOrNull((item) => item.id == user.membershipId);

    return ClientProfile(
      user: user,
      membershipName: plan?.name ?? 'غير محدد',
      membershipTier: plan?.tier ?? 'Standard',
      points: user.points,
      cashback: user.cashback,
      joinedAt: user.createdAt,
      bookings: bookings,
    );
  }

  Future<List<QuotationSummary>> getQuotations(int customerId) {
    return _api.fetchQuotations(customerId: customerId);
  }

  Future<void> sendOffer({
    required int userId,
    required String title,
    required String message,
  }) {
    return _api.sendOffer(userId: userId, title: title, message: message);
  }

  Future<QuotationSummary> createQuotation({
    required int customerId,
    required List<Map<String, dynamic>> items,
    double? discount,
    String? notes,
    DateTime? validUntil,
  }) async {
    final quotation = await _api.createQuotation(
      customerId: customerId,
      items: items,
      discount: discount,
      notes: notes,
      validUntil: validUntil,
    );
    if (quotation.id != 0) {
      await _api.sendQuotation(quotation.id);
    }
    return quotation;
  }
}
