import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/vouchers/data/models/voucher_model.dart';

class VoucherApi {
  VoucherApi(this._client);

  final ApiClient _client;

  Future<List<VoucherModel>> fetchMyVouchers() async {
    try {
      final result = await _client.get('vouchers/my');
      final responseData = result.data;

      List<dynamic> data;
      if (responseData is List) {
        data = responseData;
      } else if (responseData is Map<String, dynamic>) {
        data = responseData['data'] as List<dynamic>? ??
            responseData['vouchers'] as List<dynamic>? ??
            [];
      } else {
        data = [];
      }

      final vouchers = <VoucherModel>[];
      for (final item in data) {
        try {
          if (item is Map<String, dynamic>) {
            vouchers.add(VoucherModel.fromJson(item));
          }
        } catch (e) {
          // Skip invalid items
        }
      }
      return vouchers;
    } catch (e) {
      return [];
    }
  }

  Future<List<VoucherModel>> fetchAllVouchers() async {
    try {
      final result = await _client.get('vouchers/admin');
      final responseData = result.data;

      List<dynamic> data;
      if (responseData is List) {
        data = responseData;
      } else if (responseData is Map<String, dynamic>) {
        data = responseData['data'] as List<dynamic>? ??
            responseData['vouchers'] as List<dynamic>? ??
            [];
      } else {
        data = [];
      }

      final vouchers = <VoucherModel>[];
      for (final item in data) {
        try {
          if (item is Map<String, dynamic>) {
            vouchers.add(VoucherModel.fromJson(item));
          }
        } catch (e) {
          // Skip invalid items
        }
      }
      return vouchers;
    } catch (e) {
      return [];
    }
  }

  Future<VoucherModel> createManualVoucher(Map<String, dynamic> payload) async {
    final result = await _client.post('vouchers', body: payload);
    return VoucherModel.fromJson(
      result.data as Map<String, dynamic>? ?? {},
    );
  }

  Future<VoucherModel> redeemVoucher(String code) async {
    final result = await _client.put('vouchers/use/$code');
    return VoucherModel.fromJson(
      (result.data as Map<String, dynamic>? ?? {})['voucher']
              as Map<String, dynamic>? ??
          {},
    );
  }
}
