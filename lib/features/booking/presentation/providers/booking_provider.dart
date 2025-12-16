import 'package:flutter/foundation.dart';

import 'package:altayar/features/booking/data/booking_repository.dart';
import 'package:altayar/features/booking/data/models/booking.dart';

enum ActivityTimeFilter { all, today, week, month }

class BookingProvider extends ChangeNotifier {
  BookingProvider(this._repository);

  final BookingRepository _repository;

  List<BookingModel> adminBookings = [];
  List<BookingModel> myBookings = [];
  BookingStatus? statusFilter;
  BookingCategory? categoryFilter;
  String query = '';
  ActivityTimeFilter activityFilter = ActivityTimeFilter.all;

  bool isLoading = false;
  bool isCreating = false;
  String? errorMessage;
  String? paymentError;
  final Set<int> _processingPayments = {};
  bool _hasNewActivity = false;
  int _lastActivitiesCount = 0;
  bool _activitiesInitialized = false;

  Future<void> loadData({bool refresh = false}) async {
    isLoading = true;
    notifyListeners();
    try {
      final results = await Future.wait([
        _repository.getAdminBookings(force: refresh),
        _repository.getMyBookings(force: refresh),
      ]);
      adminBookings = results[0];
      myBookings = results[1];
      if (!_activitiesInitialized) {
        _activitiesInitialized = true;
      } else if (myBookings.length > _lastActivitiesCount) {
        _hasNewActivity = true;
      }
      _lastActivitiesCount = myBookings.length;
      errorMessage = null;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  List<BookingModel> get filteredAdmins {
    return adminBookings.where(_filterBooking).toList();
  }

  List<BookingModel> get filteredMine {
    return myBookings.where(_filterBooking).toList();
  }

  List<BookingModel> get filteredActivities {
    final now = DateTime.now();
    final results = myBookings.where((booking) {
      final date = booking.startDate ?? booking.createdAt;
      final diff = now.difference(date).inDays;
      switch (activityFilter) {
        case ActivityTimeFilter.today:
          return now.day == date.day &&
              now.month == date.month &&
              now.year == date.year;
        case ActivityTimeFilter.week:
          return diff <= 7;
        case ActivityTimeFilter.month:
          return diff <= 30;
        case ActivityTimeFilter.all:
          return true;
      }
    }).toList();
    results.sort(
      (a, b) =>
          (b.startDate ?? b.createdAt).compareTo(a.startDate ?? a.createdAt),
    );
    return results;
  }

  bool get hasNewActivity => _hasNewActivity;

  void consumeNewActivityFlag() {
    if (_hasNewActivity) {
      _hasNewActivity = false;
      notifyListeners();
    }
  }

  void setActivityFilter(ActivityTimeFilter filter) {
    if (activityFilter == filter) return;
    activityFilter = filter;
    notifyListeners();
  }

  bool _filterBooking(BookingModel booking) {
    if (statusFilter != null && booking.status != statusFilter) {
      return false;
    }
    if (categoryFilter != null && booking.category != categoryFilter) {
      return false;
    }
    if (query.isNotEmpty) {
      final value = query.toLowerCase();
      final haystack =
          '${booking.customerName}${booking.customerEmail}${booking.details}'
              .toLowerCase();
      if (!haystack.contains(value)) return false;
    }
    return true;
  }

  Future<bool> createBooking(Map<String, dynamic> payload) async {
    isCreating = true;
    notifyListeners();
    try {
      await _repository.createBooking(payload);
      await loadData(refresh: true);
      errorMessage = null;
      return true;
    } catch (error) {
      errorMessage = error.toString();
      return false;
    } finally {
      isCreating = false;
      notifyListeners();
    }
  }

  Future<bool> updateStatus(BookingModel booking, BookingStatus status) async {
    try {
      await _repository.updateStatus(booking.id, status);
      await loadData(refresh: true);
      errorMessage = null;
      return true;
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
      return false;
    }
  }

  bool isGeneratingPayment(int bookingId) =>
      _processingPayments.contains(bookingId);

  Future<String?> createPaymentLink(BookingModel booking) async {
    paymentError = null;
    _processingPayments.add(booking.id);
    notifyListeners();
    try {
      final link = await _repository.createPaymentLink(booking.id);
      return link;
    } catch (error) {
      paymentError = error.toString();
      return null;
    } finally {
      _processingPayments.remove(booking.id);
      notifyListeners();
    }
  }

  void setQuery(String value) {
    query = value;
    notifyListeners();
  }

  void setStatusFilter(BookingStatus? status) {
    statusFilter = status;
    notifyListeners();
  }

  void setCategoryFilter(BookingCategory? category) {
    categoryFilter = category;
    notifyListeners();
  }

  Future<bool> createBookingByAdmin(Map<String, dynamic> payload) async {
    isCreating = true;
    notifyListeners();
    try {
      await _repository.createBookingByAdmin(payload);
      await loadData(refresh: true);
      errorMessage = null;
      return true;
    } catch (error) {
      errorMessage = error.toString();
      return false;
    } finally {
      isCreating = false;
      notifyListeners();
    }
  }

  Future<bool> deleteBooking(int id) async {
    isLoading = true;
    notifyListeners();
    try {
      await _repository.deleteBooking(id);
      await loadData(refresh: true);
      errorMessage = null;
      return true;
    } catch (error) {
      errorMessage = error.toString();
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}
