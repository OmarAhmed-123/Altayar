import 'package:flutter/material.dart';

import 'package:altayar/features/booking/data/models/booking.dart';

class BookingCategoryFilter extends StatelessWidget {
  const BookingCategoryFilter({
    super.key,
    required this.selected,
    required this.onChanged,
  });

  final BookingCategory? selected;
  final ValueChanged<BookingCategory?> onChanged;

  static const labels = {
    BookingCategory.tour: 'جولة سياحية',
    BookingCategory.nileCruise: 'نايل كروز',
    BookingCategory.flightTicket: 'تذاكر طيران',
    BookingCategory.hotelBooking: 'حجز فنادق',
    BookingCategory.transfer: 'انتقالات',
    BookingCategory.nileTrip: 'رحلة نيلية قصيرة',
    BookingCategory.generalTour: 'جولات عامة',
    BookingCategory.customRequest: 'طلب مخصص',
  };

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        FilterChip(
          label: const Text('الكل'),
          selected: selected == null,
          onSelected: (_) => onChanged(null),
        ),
        ...BookingCategory.values.map(
          (category) => FilterChip(
            label: Text(labels[category]!),
            selected: selected == category,
            onSelected: (_) => onChanged(
              selected == category ? null : category,
            ),
          ),
        ),
      ],
    );
  }
}
