import 'dart:convert';
import 'dart:io';

import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/booking/data/models/booking.dart';
import 'package:http/http.dart' as http;

class BookingApi {
  BookingApi(this._client);

  final ApiClient _client;

  Future<List<BookingModel>> fetchAdminBookings() async {
    try {
      final result = await _client.get('bookings/admin');
      final responseData = result.data;

      List<dynamic> data;
      if (responseData is List) {
        data = responseData;
      } else if (responseData is Map<String, dynamic>) {
        data = responseData['data'] as List<dynamic>? ??
            responseData['bookings'] as List<dynamic>? ??
            [];
      } else {
        data = [];
      }

      final bookings = <BookingModel>[];
      for (final item in data) {
        try {
          if (item is Map<String, dynamic>) {
            bookings.add(BookingModel.fromJson(item));
          }
        } catch (e) {
          // Skip invalid items
        }
      }
      return bookings;
    } catch (e) {
      return [];
    }
  }

  Future<List<BookingModel>> fetchMyBookings() async {
    try {
      final result = await _client.get('bookings/myactivities');
      final responseData = result.data;

      List<dynamic> data;
      if (responseData is List) {
        data = responseData;
      } else if (responseData is Map<String, dynamic>) {
        data = responseData['data'] as List<dynamic>? ??
            responseData['bookings'] as List<dynamic>? ??
            [];
      } else {
        data = [];
      }

      final bookings = <BookingModel>[];
      for (final item in data) {
        try {
          if (item is Map<String, dynamic>) {
            bookings.add(BookingModel.fromJson(item));
          }
        } catch (e) {
          // Skip invalid items
        }
      }
      return bookings;
    } catch (e) {
      return [];
    }
  }

  Future<BookingModel> createBooking(Map<String, dynamic> payload) async {
    final images = (payload['images'] as List<String>?) ?? const [];
    final body = Map<String, dynamic>.from(payload)..remove('images');

    final backendData = {
      'bookingType': body['bookingType'] ?? 'general_tour',
      'totalPrice': body['totalPrice'] ?? 0,
      'details': json.encode({
        'participants': body['participants'] ?? 1,
        'startDate': body['startDate'],
        'endDate': body['endDate'],
        'specialRequests': body['specialRequests'],
        'packageId': body['packageId'],
      }),
    };

    if (images.isNotEmpty) {
      final files = await Future.wait(images.map((path) async {
        final file = File(path);
        final fileName = path.split('/').last;
        final stream = http.ByteStream(file.openRead());
        final length = await file.length();
        return http.MultipartFile(
          'images',
          stream,
          length,
          filename: fileName,
        );
      }));

      final result = await _client.postMultipart(
        'bookings',
        fields: {
          'bookingType': backendData['bookingType'].toString(),
          'totalPrice': backendData['totalPrice'].toString(),
          'details': backendData['details'].toString(),
        },
        files: files,
      );

      return BookingModel.fromJson(
        result.data as Map<String, dynamic>? ?? {},
      );
    }

    final result = await _client.post(
      'bookings',
      body: backendData,
    );
    return BookingModel.fromJson(
      result.data as Map<String, dynamic>? ?? {},
    );
  }

  Future<BookingModel> updateStatus(int id, BookingStatus status) async {
    final result = await _client.put(
      'bookings/$id',
      body: {
        'status': status.name,
      },
    );
    return BookingModel.fromJson(
      result.data as Map<String, dynamic>? ?? {},
    );
  }

  Future<String> createPaymentLink(int bookingId) async {
    final result = await _client.post(
      'payments/fawaterak/create-invoice',
      body: {
        'type': 'booking',
        'itemId': bookingId,
      },
    );
    final data = result.data as Map<String, dynamic>? ?? {};
    final url =
        data['invoiceUrl']?.toString() ?? data['invoice_url']?.toString();
    if (url == null || url.isEmpty) {
      throw Exception('لم يتم إنشاء رابط الدفع من فواتيرك.');
    }
    return url;
  }

  Future<BookingModel> createBookingByAdmin(
      Map<String, dynamic> payload) async {
    final result = await _client.post('bookings/admin', body: payload);
    return BookingModel.fromJson(
      result.data as Map<String, dynamic>? ?? {},
    );
  }

  Future<void> deleteBooking(int id) async {
    await _client.delete('bookings/$id');
  }
}
