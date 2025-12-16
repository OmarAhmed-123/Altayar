import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/core/utils/logger.dart';
import 'package:altayar/features/accounting/data/models/transaction_model.dart';

class AccountingApi {
  AccountingApi(this._client);

  final ApiClient _client;

  Future<List<TransactionModel>> fetchTransactions() async {
    try {
      final response = await _client.get('transactions');
      final responseData = response.data;

      // Handle different response formats
      List<dynamic> data;
      if (responseData is List) {
        data = responseData;
      } else if (responseData is Map<String, dynamic>) {
        // Check for common data fields
        if (responseData.containsKey('data')) {
          final dataField = responseData['data'];
          if (dataField is List) {
            data = dataField;
          } else {
            AppLogger.warn(
                'Transactions data field is not a list: ${dataField.runtimeType}');
            data = [];
          }
        } else if (responseData.containsKey('transactions')) {
          final transactionsField = responseData['transactions'];
          if (transactionsField is List) {
            data = transactionsField;
          } else {
            AppLogger.warn(
                'Transactions field is not a list: ${transactionsField.runtimeType}');
            data = [];
          }
        } else {
          AppLogger.warn(
              'Unexpected transactions response format. Keys: ${responseData.keys.toList()}');
          data = [];
        }
      } else {
        AppLogger.warn(
            'Unexpected transactions response type: ${responseData.runtimeType}');
        data = [];
      }

      // Safely parse transactions
      final transactions = <TransactionModel>[];
      for (final item in data) {
        try {
          if (item is Map<String, dynamic>) {
            transactions.add(TransactionModel.fromJson(item));
          } else {
            AppLogger.warn(
                'Skipping invalid transaction item: ${item.runtimeType}');
          }
        } catch (e, stackTrace) {
          AppLogger.error('Failed to parse transaction item', e, stackTrace);
          // Continue processing other items
        }
      }

      return transactions;
    } catch (e, stackTrace) {
      AppLogger.error('Failed to fetch transactions', e, stackTrace);
      rethrow;
    }
  }
}
