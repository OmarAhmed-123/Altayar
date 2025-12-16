import 'package:flutter/foundation.dart';

import 'package:altayar/features/trip_maker/data/models/trip_plan.dart';
import 'package:altayar/features/trip_maker/data/trip_repository.dart';

class TripMakerProvider extends ChangeNotifier {
  TripMakerProvider(this._repository);

  final TripRepository _repository;

  TripPlan plan = TripPlan();
  bool isSaving = false;
  String? errorMessage;

  static const destinations = [
    'القاهرة',
    'شرم الشيخ',
    'الغردقة',
    'الأقصر',
    'أسوان',
    'دبي',
  ];

  static const hotels = [
    'ALTAYAR Grand',
    'Nile View Suites',
    'Desert Rose Resort',
    'Palm Luxury Hotel',
  ];

  static const transports = [
    'طيران داخلي',
    'حافلة خاصة',
    'سيارة VIP',
    'يخت',
  ];

  static const activities = [
    'رحلة نيلية',
    'جولة تاريخية',
    'سبا & ويلنس',
    'مطعم فاخر',
    'سفاري صحراوي',
    'زيارة متحف',
  ];

  void addDay() {
    final next = plan.days.length + 1;
    plan.days.add(TripDayPlan(dayNumber: next));
    notifyListeners();
  }

  void updateDay(
    int index, {
    String? destination,
    String? hotel,
    String? transport,
    List<String>? dayActivities,
  }) {
    final current = plan.days[index];
    plan.days[index] = current.copyWith(
      destination: destination,
      hotel: hotel,
      transport: transport,
      activities: dayActivities,
    );
    notifyListeners();
  }

  void updateTitle(String value) {
    plan.title = value;
    notifyListeners();
  }

  void updateDescription(String value) {
    plan.description = value;
    notifyListeners();
  }

  void updateDates(DateTime start, DateTime end) {
    plan.startDate = start;
    plan.endDate = end;
    notifyListeners();
  }

  Future<bool> saveDraft() => _submitWithStatus('draft');

  Future<bool> submitForQuote() => _submitWithStatus('pending_pricing');

  Future<bool> _submitWithStatus(String status) async {
    isSaving = true;
    errorMessage = null;
    notifyListeners();
    try {
      final id = await _repository.createTrip(plan: plan, status: status);
      if (id == null) {
        throw Exception('تعذّر الحصول على رقم الرحلة');
      }
      return true;
    } catch (error) {
      errorMessage = error.toString();
      return false;
    } finally {
      isSaving = false;
      notifyListeners();
    }
  }
}
