import 'package:flutter/material.dart';

import 'package:altayar/features/reports/data/models/invoice_data.dart';
import 'package:altayar/features/reports/data/models/payment_record.dart';
import 'package:altayar/features/reports/data/reports_repository.dart';

class ReportsProvider extends ChangeNotifier {
  ReportsProvider(this._repository);

  final ReportsRepository _repository;

  List<PaymentRecord> history = [];
  bool isLoading = false;
  bool isGenerating = false;
  String? errorMessage;

  String? _searchQuery;
  String? _typeFilter;

  String? get typeFilter => _typeFilter;
  String? get searchQuery => _searchQuery;

  Future<void> loadHistory({bool refresh = false}) async {
    isLoading = true;
    notifyListeners();
    try {
      history = await _repository.getHistory(
        force: refresh,
        search: _searchQuery,
        type: _typeFilter,
      );
      errorMessage = null;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  List<PaymentRecord> get filteredHistory {
    return history.where((record) {
      final matchesSearch = _searchQuery == null || _searchQuery!.isEmpty
          ? true
          : record.userName.toLowerCase().contains(_searchQuery!.toLowerCase());
      final matchesType =
          _typeFilter == null ? true : record.type == _typeFilter;
      return matchesSearch && matchesType;
    }).toList();
  }

  void updateSearch(String? query) {
    _searchQuery = query?.isEmpty == true ? null : query;
    notifyListeners();
    // Reload history with new search
    loadHistory(refresh: true);
  }

  void updateTypeFilter(String? type) {
    _typeFilter = type?.isEmpty == true ? null : type;
    notifyListeners();
    // Reload history with new filter
    loadHistory(refresh: true);
  }

  Future<InvoiceData?> generateInvoice(int bookingId) async {
    try {
      isGenerating = true;
      notifyListeners();
      final invoice = await _repository.generateInvoice(bookingId);
      errorMessage = null;
      return invoice;
    } catch (error) {
      errorMessage = error.toString();
      return null;
    } finally {
      isGenerating = false;
      notifyListeners();
    }
  }

  Future<String?> downloadCompanyReport() async {
    try {
      isGenerating = true;
      notifyListeners();
      return await _repository.downloadCompanyReport();
    } catch (error) {
      errorMessage = error.toString();
      return null;
    } finally {
      isGenerating = false;
      notifyListeners();
    }
  }
}
