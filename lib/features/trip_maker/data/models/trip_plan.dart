import 'package:equatable/equatable.dart';

class TripDayPlan extends Equatable {
  const TripDayPlan({
    required this.dayNumber,
    this.destination,
    this.hotel,
    this.transport,
    this.activities = const [],
  });

  final int dayNumber;
  final String? destination;
  final String? hotel;
  final String? transport;
  final List<String> activities;

  TripDayPlan copyWith({
    String? destination,
    String? hotel,
    String? transport,
    List<String>? activities,
  }) {
    return TripDayPlan(
      dayNumber: dayNumber,
      destination: destination ?? this.destination,
      hotel: hotel ?? this.hotel,
      transport: transport ?? this.transport,
      activities: activities ?? this.activities,
    );
  }

  Map<String, dynamic> toJson() => {
        'dayNumber': dayNumber,
        'destination': destination,
        'hotel': hotel,
        'transport': transport,
        'activities': activities,
      };

  @override
  List<Object?> get props =>
      [dayNumber, destination, hotel, transport, activities];
}

class TripPlan {
  TripPlan({
    this.title = '',
    this.description = '',
    DateTime? startDate,
    DateTime? endDate,
    List<TripDayPlan>? days,
  })  : startDate = startDate ?? DateTime.now(),
        endDate = endDate ?? DateTime.now().add(const Duration(days: 2)),
        days = days ??
            List.generate(
              3,
              (index) => TripDayPlan(dayNumber: index + 1),
            );

  String title;
  String description;
  DateTime startDate;
  DateTime endDate;
  List<TripDayPlan> days;

  Map<String, dynamic> toPayload() {
    return {
      'title': title,
      'description': description,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'destinations': days
          .map((day) => day.destination)
          .whereType<String>()
          .toSet()
          .toList(),
      'details': {
        'days': days.map((day) => day.toJson()).toList(),
      },
      'isPublic': false,
    };
  }
}
