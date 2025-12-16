import 'package:flutter/foundation.dart';

import 'package:altayar/features/sales/data/models/client_profile.dart';
import 'package:altayar/features/sales/data/models/quotation_item.dart';
import 'package:altayar/features/sales/data/models/quotation_summary.dart';
import 'package:altayar/features/sales/data/sales_repository.dart';
import 'package:altayar/features/user_management/data/models/user_account.dart';

class SalesProvider extends ChangeNotifier {
  SalesProvider(this._repository);

  final SalesRepository _repository;

  List<UserAccount> customers = [];
  ClientProfile? selectedProfile;
  List<QuotationSummary> quotations = [];

  bool isLoadingCustomers = false;
  bool isLoadingProfile = false;
  bool isSendingOffer = false;
  bool isCreatingQuotation = false;

  String searchQuery = '';
  String? errorMessage;

  Future<void> loadCustomers({String? query}) async {
    searchQuery = query ?? '';
    isLoadingCustomers = true;
    notifyListeners();
    try {
      customers = await _repository.getCustomers(search: searchQuery);
      errorMessage = null;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isLoadingCustomers = false;
      notifyListeners();
    }
  }

  Future<void> selectCustomer(UserAccount customer) async {
    selectedProfile = null;
    quotations = [];
    isLoadingProfile = true;
    notifyListeners();
    try {
      final profile = await _repository.getClientProfile(customer.id);
      final quotes = await _repository.getQuotations(customer.id);
      selectedProfile = profile;
      quotations = quotes;
      errorMessage = null;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isLoadingProfile = false;
      notifyListeners();
    }
  }

  Future<bool> sendOffer({
    required String title,
    required String message,
  }) async {
    final profile = selectedProfile;
    if (profile == null) return false;
    try {
      isSendingOffer = true;
      notifyListeners();
      await _repository.sendOffer(
        userId: profile.user.id,
        title: title,
        message: message,
      );
      errorMessage = null;
      return true;
    } catch (error) {
      errorMessage = error.toString();
      return false;
    } finally {
      isSendingOffer = false;
      notifyListeners();
    }
  }

  Future<bool> createQuotation({
    required List<QuotationItem> items,
    String? notes,
    double? discount,
    DateTime? validUntil,
  }) async {
    final profile = selectedProfile;
    if (profile == null || items.isEmpty) return false;
    try {
      isCreatingQuotation = true;
      notifyListeners();
      final quotation = await _repository.createQuotation(
        customerId: profile.user.id,
        items: items.map((item) => item.toJson()).toList(),
        notes: notes,
        discount: discount,
        validUntil: validUntil,
      );
      quotations = [quotation, ...quotations];
      errorMessage = null;
      return true;
    } catch (error) {
      errorMessage = error.toString();
      return false;
    } finally {
      isCreatingQuotation = false;
      notifyListeners();
    }
  }
}
