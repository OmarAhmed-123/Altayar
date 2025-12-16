import 'package:intl/intl.dart';

class DateFormatter {
  DateFormatter._();

  static final DateFormat _short = DateFormat('dd MMM yyyy');

  static String format(DateTime? date) {
    if (date == null) return '—';
    return _short.format(date.toLocal());
  }
}

