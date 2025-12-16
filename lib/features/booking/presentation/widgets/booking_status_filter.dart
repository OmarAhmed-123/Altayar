import 'package:flutter/material.dart';

import 'package:altayar/features/booking/data/models/booking.dart';

class BookingStatusFilter extends StatelessWidget {
  const BookingStatusFilter({
    super.key,
    required this.selected,
    required this.onChanged,
  });

  final BookingStatus? selected;
  final ValueChanged<BookingStatus?> onChanged;

  static const labels = {
    BookingStatus.pending: 'Pending',
    BookingStatus.confirmed: 'Confirmed',
    BookingStatus.paid: 'Paid',
    BookingStatus.completed: 'Done',
    BookingStatus.cancelled: 'Cancelled',
  };

  Color _color(BookingStatus status) {
    switch (status) {
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

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 38,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: const Text('الكل'),
              selected: selected == null,
              onSelected: (_) => onChanged(null),
            ),
          ),
          ...BookingStatus.values.map(
            (status) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(labels[status]!),
                selectedColor: _color(status).withAlpha((255 * .2).round()),
                selected: selected == status,
                onSelected: (_) => onChanged(status),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
