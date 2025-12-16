import 'package:altayar/core/utils/value_parser.dart';

class InvoiceData {
  InvoiceData({
    required this.invoiceNumber,
    required this.invoiceDate,
    required this.dueDate,
    required this.user,
    required this.booking,
    required this.services,
    required this.subtotal,
    required this.total,
    required this.terms,
  });

  final String invoiceNumber;
  final String invoiceDate;
  final String dueDate;
  final InvoiceUser user;
  final InvoiceBooking booking;
  final List<InvoiceService> services;
  final double subtotal;
  final double total;
  final String terms;

  factory InvoiceData.fromJson(Map<String, dynamic> json) {
    final normalized = _extractPayload(json);
    final bookingJson = Map<String, dynamic>.from(
        normalized['booking'] ?? json['booking'] ?? {});
    final servicesJson = normalized['services'] ?? json['services'] ?? [];
    return InvoiceData(
      invoiceNumber: normalized['invoiceNumber']?.toString() ??
          normalized['invoice_id']?.toString() ??
          'INV-${DateTime.now().millisecondsSinceEpoch}',
      invoiceDate: normalized['invoiceDate']?.toString() ??
          normalized['invoice_date']?.toString() ??
          '',
      dueDate: normalized['dueDate']?.toString() ??
          normalized['due_date']?.toString() ??
          '',
      user: InvoiceUser.fromJson(
        Map<String, dynamic>.from(
          normalized['user'] ?? json['user'] ?? {},
        ),
      ),
      booking: InvoiceBooking.fromJson(bookingJson),
      services: servicesJson is List
          ? servicesJson
              .whereType<Map<String, dynamic>>()
              .map(InvoiceService.fromJson)
              .toList()
          : const <InvoiceService>[],
      subtotal: parseDouble(
        normalized['subtotal'] ?? bookingJson['totalPrice'],
      ),
      total: parseDouble(
        normalized['total'] ?? bookingJson['totalPrice'],
      ),
      terms: normalized['terms']?.toString() ??
          'الدفع مستحق خلال 30 يوماً من تاريخ الفاتورة.',
    );
  }

  static Map<String, dynamic> _extractPayload(Map<String, dynamic> source) {
    final data = source['data'];
    if (data is Map<String, dynamic>) {
      return {...source, ...data};
    }
    return source;
  }
}

class InvoiceUser {
  InvoiceUser({
    required this.name,
    required this.email,
  });

  final String name;
  final String? email;

  factory InvoiceUser.fromJson(Map<String, dynamic> json) {
    return InvoiceUser(
      name: json['name']?.toString() ?? 'العميل',
      email: json['email']?.toString(),
    );
  }
}

class InvoiceBooking {
  InvoiceBooking({
    required this.id,
    required this.bookingType,
    required this.status,
    required this.totalPrice,
    required this.participants,
    required this.numberOfDays,
    this.startDate,
    this.endDate,
    this.specialRequests,
  });

  final int id;
  final String? bookingType;
  final String? status;
  final double totalPrice;
  final int participants;
  final int numberOfDays;
  final String? startDate;
  final String? endDate;
  final String? specialRequests;

  factory InvoiceBooking.fromJson(Map<String, dynamic> json) {
    return InvoiceBooking(
      id: parseInt(json['id']),
      bookingType:
          json['bookingType']?.toString() ?? json['booking_type']?.toString(),
      status: json['status']?.toString(),
      totalPrice: parseDouble(json['totalPrice'] ?? json['total_price']),
      participants: parseInt(json['participants']),
      numberOfDays: parseInt(json['numberOfDays'] ?? json['number_of_days']),
      startDate: json['startDate']?.toString(),
      endDate: json['endDate']?.toString(),
      specialRequests: json['specialRequests']?.toString(),
    );
  }
}

class InvoiceService {
  InvoiceService({
    required this.name,
    required this.description,
    required this.quantity,
    required this.rate,
    required this.total,
  });

  final String name;
  final String description;
  final double quantity;
  final double rate;
  final double total;

  factory InvoiceService.fromJson(Map<String, dynamic> json) {
    return InvoiceService(
      name: json['name']?.toString() ?? 'خدمة',
      description: json['description']?.toString() ?? '',
      quantity: parseDouble(json['quantity'], fallback: 1),
      rate: parseDouble(json['rate']),
      total: parseDouble(json['total']),
    );
  }
}
