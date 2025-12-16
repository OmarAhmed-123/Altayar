import 'package:equatable/equatable.dart';

enum BookingCategory {
  tour,
  nileCruise,
  flightTicket,
  hotelBooking,
  transfer,
  nileTrip,
  generalTour,
  customRequest,
}

enum BookingStatus { pending, confirmed, paid, completed, cancelled }

class BookingModel extends Equatable {
  const BookingModel({
    required this.id,
    required this.userId,
    required this.category,
    required this.status,
    required this.customerName,
    required this.customerEmail,
    required this.totalPrice,
    required this.createdAt,
    this.employeeId,
    this.packageId,
    this.startDate,
    this.endDate,
    this.specialRequests,
    this.details,
  });

  final int id;
  final int userId;
  final BookingCategory category;
  final BookingStatus status;
  final String customerName;
  final String customerEmail;
  final double totalPrice;
  final DateTime createdAt;
  final int? employeeId;
  final int? packageId;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? specialRequests;
  final Map<String, dynamic>? details;

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    return BookingModel(
      id: json['id'] as int,
      userId: json['user_id'] as int? ?? json['userId'] as int? ?? 0,
      category: _categoryFrom(json['bookingType'] ?? json['category']),
      status: _statusFrom(json['status']),
      customerName: json['customer_name']?.toString() ??
          json['user']?['name']?.toString() ??
          'عميل',
      customerEmail: json['customer_email']?.toString() ??
          json['user']?['email']?.toString() ??
          'n/a',
      totalPrice: _asDouble(json['totalPrice'] ?? json['total_price']),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
      employeeId: json['assigned_employee_id'] as int?,
      packageId: json['package_id'] as int?,
      startDate: DateTime.tryParse(json['startDate']?.toString() ?? ''),
      endDate: DateTime.tryParse(json['endDate']?.toString() ?? ''),
      specialRequests: json['specialRequests']?.toString(),
      details: json['details'] is Map<String, dynamic>
          ? json['details'] as Map<String, dynamic>
          : null,
    );
  }

  BookingModel copyWith({
    BookingStatus? status,
    int? employeeId,
  }) {
    return BookingModel(
      id: id,
      userId: userId,
      category: category,
      status: status ?? this.status,
      customerName: customerName,
      customerEmail: customerEmail,
      totalPrice: totalPrice,
      createdAt: createdAt,
      employeeId: employeeId ?? this.employeeId,
      packageId: packageId,
      startDate: startDate,
      endDate: endDate,
      specialRequests: specialRequests,
      details: details,
    );
  }

  static BookingCategory _categoryFrom(dynamic value) {
    final normalized =
        value?.toString().toLowerCase().replaceAll(' ', '_') ?? '';
    switch (normalized) {
      case 'tour':
        return BookingCategory.tour;
      case 'nile_cruise':
        return BookingCategory.nileCruise;
      case 'flight_ticket':
        return BookingCategory.flightTicket;
      case 'hotel_booking':
        return BookingCategory.hotelBooking;
      case 'transfer':
      case 'transfers':
        return BookingCategory.transfer;
      case 'nile_trip':
      case 'nile_cruise_short':
        return BookingCategory.nileTrip;
      case 'general_tour':
        return BookingCategory.generalTour;
      case 'custom_request':
      case 'custom':
        return BookingCategory.customRequest;
      default:
        return BookingCategory.generalTour;
    }
  }

  static BookingStatus _statusFrom(dynamic value) {
    final normalized = value?.toString().toLowerCase() ?? '';
    switch (normalized) {
      case 'pending':
        return BookingStatus.pending;
      case 'confirmed':
        return BookingStatus.confirmed;
      case 'paid':
        return BookingStatus.paid;
      case 'completed':
        return BookingStatus.completed;
      case 'cancelled':
      case 'canceled':
        return BookingStatus.cancelled;
      default:
        return BookingStatus.pending;
    }
  }

  static double _asDouble(dynamic source) {
    if (source is double) return source;
    if (source is int) return source.toDouble();
    if (source is num) return source.toDouble();
    if (source is String) {
      return double.tryParse(source) ?? 0;
    }
    return 0;
  }

  @override
  List<Object?> get props => [id, status, category, totalPrice];
}
