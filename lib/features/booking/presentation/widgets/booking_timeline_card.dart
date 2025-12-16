import 'package:flutter/material.dart';

import 'package:altayar/core/widgets/animated_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/core/utils/date_formatter.dart';
import 'package:altayar/features/booking/data/models/booking.dart';

class BookingTimelineCard extends StatelessWidget {
  const BookingTimelineCard({
    super.key,
    required this.booking,
    this.onTap,
    this.dense = false,
  });

  final BookingModel booking;
  final VoidCallback? onTap;
  final bool dense;

  Color get statusColor {
    switch (booking.status) {
      case BookingStatus.pending:
        return Colors.orange;
      case BookingStatus.confirmed:
        return Colors.blue;
      case BookingStatus.paid:
        return Colors.teal;
      case BookingStatus.completed:
        return Colors.green;
      case BookingStatus.cancelled:
        return Colors.redAccent;
    }
  }

  IconData get icon {
    switch (booking.category) {
      case BookingCategory.tour:
      case BookingCategory.generalTour:
        return Icons.hiking;
      case BookingCategory.nileCruise:
      case BookingCategory.nileTrip:
        return Icons.directions_boat_filled_outlined;
      case BookingCategory.flightTicket:
        return Icons.flight_takeoff;
      case BookingCategory.hotelBooking:
        return Icons.hotel;
      case BookingCategory.transfer:
        return Icons.directions_car;
      case BookingCategory.customRequest:
        return Icons.auto_fix_high;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedCard(
      borderRadius: BorderRadius.circular(20),
      margin: EdgeInsets.zero,
      onTap: onTap,
      child: Container(
        width: dense ? double.infinity : 320,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              statusColor.withOpacity(0.1),
              statusColor.withOpacity(0.05),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: statusColor.withOpacity(0.3),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: statusColor.withOpacity(0.2),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [
                        statusColor,
                        statusColor.withOpacity(0.7),
                      ],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: statusColor.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(icon, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Flexible(
                        child: Text(
                          booking.customerName,
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.dark,
                                  ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Flexible(
                        child: Text(
                          booking.customerEmail,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.grey[700],
                                  ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: statusColor.withOpacity(0.4),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    booking.status.name.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 16),
                const SizedBox(width: 4),
                Text(
                  DateFormatter.format(
                    booking.startDate ?? booking.createdAt,
                  ),
                ),
                if (booking.endDate != null) ...[
                  const SizedBox(width: 4),
                  const Icon(Icons.chevron_right, size: 16),
                  const SizedBox(width: 4),
                  Text(DateFormatter.format(booking.endDate)),
                ],
              ],
            ),
            if (booking.specialRequests != null &&
                booking.specialRequests!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                booking.specialRequests!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: AppColors.primaryGradient,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${booking.totalPrice.toStringAsFixed(0)} EGP',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Row(
                    children: [
                      const Icon(Icons.person_outline,
                          size: 16, color: Colors.white),
                      const SizedBox(width: 4),
                      Text(
                        '#${booking.id}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
