import 'package:flutter/foundation.dart';

import 'package:altayar/core/networking/api_exceptions.dart';
import 'package:altayar/features/membership/data/membership_repository.dart';
import 'package:altayar/features/membership/data/models/membership_card.dart';

class MembershipCardProvider extends ChangeNotifier {
  MembershipCardProvider(this._repository);

  final MembershipRepository _repository;

  MembershipCard? card;
  bool isLoading = false;
  String? errorMessage;

  Future<void> loadCard() async {
    isLoading = true;
    notifyListeners();
    try {
      card = await _repository.getMembershipCard();
      errorMessage = null;
    } on ApiException catch (error) {
      errorMessage = error.message;
      card ??= _placeholderCard();
    } catch (_) {
      errorMessage = 'تعذّر تحميل بطاقة العضوية';
      card ??= _placeholderCard();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  MembershipCard _placeholderCard() {
    return MembershipCard(
      hasMembership: false,
      membershipNumber: 'ALT-000000',
      userName: 'ضيف ALTAYAR',
      userEmail: 'guest@example.com',
      membershipType: 'Silver',
      subscriptionDate: DateTime.now(),
      expiryDate: DateTime.now().add(const Duration(days: 365)),
      pointsBalance: 0,
      cashbackBalance: 0,
      benefits: const [],
    );
  }
}
