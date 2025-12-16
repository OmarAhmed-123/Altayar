import 'package:altayar/features/vouchers/data/models/voucher_model.dart';
import 'package:altayar/features/vouchers/data/voucher_api.dart';

class VoucherRepository {
  VoucherRepository(this._api);

  final VoucherApi _api;
  List<VoucherModel>? _myCache;
  List<VoucherModel>? _adminCache;

  Future<List<VoucherModel>> getMyVouchers({bool force = false}) async {
    if (!force && _myCache != null) return _myCache!;
    final data = await _api.fetchMyVouchers();
    _myCache = data;
    return data;
  }

  Future<List<VoucherModel>> getAdminVouchers({bool force = false}) async {
    if (!force && _adminCache != null) return _adminCache!;
    final data = await _api.fetchAllVouchers();
    _adminCache = data;
    return data;
  }

  Future<VoucherModel> createVoucher(Map<String, dynamic> payload) async {
    final created = await _api.createManualVoucher(payload);
    _adminCache = _adminCache == null ? null : [created, ..._adminCache!];
    return created;
  }

  Future<VoucherModel> redeem(String code) async {
    final voucher = await _api.redeemVoucher(code);
    _myCache = _myCache
        ?.map((item) => item.code == voucher.code ? voucher : item)
        .toList();
    return voucher;
  }
}
