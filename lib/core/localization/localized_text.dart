import 'package:flutter/material.dart';

extension LocalizationExt on BuildContext {
  Locale get currentLocale => Localizations.localeOf(this);

  String trans({required String ar, required String en}) {
    final code = currentLocale.languageCode;
    return code == 'ar' ? ar : en;
  }

  TextDirection get localeDirection => currentLocale.languageCode == 'ar'
      ? TextDirection.rtl
      : TextDirection.ltr;
}

class LocalizedText extends StatelessWidget {
  const LocalizedText({
    super.key,
    required this.ar,
    required this.en,
    this.style,
    this.textAlign,
  });

  final String ar;
  final String en;
  final TextStyle? style;
  final TextAlign? textAlign;

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context).languageCode;
    return Text(
      locale == 'ar' ? ar : en,
      style: style,
      textAlign: textAlign,
    );
  }
}
