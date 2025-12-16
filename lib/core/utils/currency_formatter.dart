import 'package:intl/intl.dart';

class CurrencyFormatter {
  CurrencyFormatter._();

  static String format(num value, {String currency = 'USD'}) {
    final formatter = NumberFormat.currency(
      symbol: currency == 'USD' ? '\$' : '$currency ',
      decimalDigits: 2,
    );
    return formatter.format(value);
  }
}

