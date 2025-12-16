import 'package:equatable/equatable.dart';

import 'package:altayar/features/booking/data/models/booking.dart';
import 'package:altayar/features/user_management/data/models/user_account.dart';

class ClientProfile extends Equatable {
  const ClientProfile({
    required this.user,
    required this.membershipName,
    required this.membershipTier,
    required this.points,
    required this.cashback,
    required this.joinedAt,
    required this.bookings,
  });

  final UserAccount user;
  final String membershipName;
  final String membershipTier;
  final int points;
  final double cashback;
  final DateTime joinedAt;
  final List<BookingModel> bookings;

  int get completedBookings =>
      bookings.where((b) => b.status == BookingStatus.completed).length;

  double get totalSpend =>
      bookings.fold<double>(0, (sum, booking) => sum + booking.totalPrice);

  BookingModel? get lastBooking {
    if (bookings.isEmpty) return null;
    final sorted = [...bookings]..sort(
        (a, b) =>
            (b.startDate ?? b.createdAt).compareTo(a.startDate ?? a.createdAt),
      );
    return sorted.first;
  }

  @override
  List<Object?> get props => [
        user,
        membershipName,
        membershipTier,
        points,
        cashback,
        joinedAt,
        bookings,
      ];
}
