import 'package:flutter/foundation.dart';

import 'package:altayar/features/vouchers/data/models/voucher_model.dart';
import 'package:altayar/features/vouchers/data/voucher_repository.dart';

class VoucherProvider extends ChangeNotifier {
  VoucherProvider(this._repository);

  final VoucherRepository _repository;

  List<VoucherModel> myVouchers = [];
  List<VoucherModel> adminVouchers = [];

  bool isLoading = false;
  bool isCreating = false;
  bool isRedeeming = false;
  String? errorMessage;

  String? statusFilter;
  String? typeFilter;

  Future<void> loadData(
      {bool refresh = false, bool includeAdmin = false}) async {
    isLoading = true;
    notifyListeners();
    try {
      myVouchers = await _repository.getMyVouchers(force: refresh);
      if (includeAdmin) {
        adminVouchers = await _repository.getAdminVouchers(force: refresh);
      } else {
        adminVouchers = [];
      }
      errorMessage = null;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  List<VoucherModel> get filteredMyVouchers {
    return myVouchers.where(_applyFilters).toList();
  }

  List<VoucherModel> get filteredAdminVouchers {
    return adminVouchers.where(_applyFilters).toList();
  }

  bool _applyFilters(VoucherModel voucher) {
    if (statusFilter != null &&
        voucher.status.toLowerCase() != statusFilter!.toLowerCase()) {
      return false;
    }
    if (typeFilter != null &&
        voucher.type.toLowerCase() != typeFilter!.toLowerCase()) {
      return false;
    }
    return true;
  }

  void setStatusFilter(String? status) {
    statusFilter = status;
    notifyListeners();
  }

  void setTypeFilter(String? type) {
    typeFilter = type;
    notifyListeners();
  }

  Future<VoucherModel?> createManualVoucher({
    required int userId,
    required String type,
    double? value,
    String? description,
    DateTime? expiresAt,
  }) async {
    try {
      isCreating = true;
      notifyListeners();
      final payload = {
        'userId': userId,
        'type': type,
        if (value != null) 'value': value,
        if (description != null && description.isNotEmpty)
          'description': description,
        if (expiresAt != null) 'expiresAt': expiresAt.toIso8601String(),
      };
      final voucher = await _repository.createVoucher(payload);
      adminVouchers = [voucher, ...adminVouchers];
      errorMessage = null;
      return voucher;
    } catch (error) {
      errorMessage = error.toString();
      return null;
    } finally {
      isCreating = false;
      notifyListeners();
    }
  }

  Future<VoucherModel?> redeemVoucher(String code) async {
    try {
      isRedeeming = true;
      notifyListeners();
      final voucher = await _repository.redeem(code);
      myVouchers = myVouchers
          .map((item) => item.code == voucher.code ? voucher : item)
          .toList();
      return voucher;
    } catch (error) {
      errorMessage = error.toString();
      return null;
    } finally {
      isRedeeming = false;
      notifyListeners();
    }
  }
}
