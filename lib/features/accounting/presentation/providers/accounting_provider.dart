import 'package:flutter/foundation.dart';

import 'package:altayar/core/utils/logger.dart';
import 'package:altayar/features/accounting/data/accounting_repository.dart';
import 'package:altayar/features/accounting/data/models/transaction_model.dart';
import 'package:altayar/features/accounting/data/models/wallet_summary.dart';
import 'package:altayar/features/membership/data/models/referral_summary.dart';

class AccountingProvider extends ChangeNotifier {
  AccountingProvider(this._repository);

  final AccountingRepository _repository;

  WalletSummary? wallet;
  List<TransactionModel> transactions = [];
  ReferralSummary? referralSummary;

  bool isLoading = false;
  bool isInviting = false;
  String? errorMessage;

  TransactionType? typeFilter;

  Future<void> loadAll({bool refresh = false}) async {
    isLoading = true;
    notifyListeners();
    try {
      final results = await Future.wait([
        _repository.getWalletSummary(force: refresh),
        _repository.getTransactions(force: refresh),
        _repository.getReferralSummary(force: refresh),
      ]);
      wallet = results[0] as WalletSummary;
      transactions = results[1] as List<TransactionModel>;
      referralSummary = results[2] as ReferralSummary;
      errorMessage = null;
    } catch (error, stackTrace) {
      errorMessage = error.toString();
      AppLogger.error('Accounting load failed', error, stackTrace);
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  List<TransactionModel> get filteredTransactions {
    if (typeFilter == null) return transactions;
    return transactions.where((tx) => tx.type == typeFilter).toList();
  }

  void setFilter(TransactionType? type) {
    typeFilter = type;
    notifyListeners();
  }

  Future<bool> inviteFriend(String email) async {
    try {
      isInviting = true;
      notifyListeners();
      await _repository.inviteFriend(email);
      // Reload all data after successful invite
      await loadAll(refresh: true);
      errorMessage = null;
      return true;
    } catch (error) {
      errorMessage = error.toString();
      return false;
    } finally {
      isInviting = false;
      notifyListeners();
    }
  }

  /// Refresh wallet data after payment or transaction
  /// This should be called after any payment operation
  Future<void> refreshAfterPayment() async {
    try {
      // Force refresh to get latest data from backend
      await loadAll(refresh: true);
    } catch (error) {
      AppLogger.error(
          'Failed to refresh after payment', error, StackTrace.current);
    }
  }
}
