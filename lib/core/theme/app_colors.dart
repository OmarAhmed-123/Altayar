import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color primary = Color(0xFF2265C3);
  static const Color secondary = Color(0xFF19B6E8);
  static const Color accent = Color(0xFF000000);
  static const Color dark = Color(0xFF1D231F);
  static const Color light = Color(0xFFF5F7FB);

  static const Color success = Color(0xFF2DD36F);
  static const Color warning = Color(0xFFFF9F1C);
  static const Color error = Color(0xFFFF4E50);

  static const Color cardGradientStart = primary;
  static const Color cardGradientEnd = secondary;

  // Enhanced gradient colors for modern design
  static const List<Color> primaryGradient = [
    Color(0xFF2265C3),
    Color(0xFF19B6E8),
    Color(0xFF00D4FF),
  ];

  static const List<Color> successGradient = [
    Color(0xFF2DD36F),
    Color(0xFF1AB65C),
  ];

  static const List<Color> warningGradient = [
    Color(0xFFFF9F1C),
    Color(0xFFFFB84D),
  ];

  static const List<Color> errorGradient = [
    Color(0xFFFF4E50),
    Color(0xFFFF6B6D),
  ];

  static const List<Color> infoGradient = [
    Color(0xFF2196F3),
    Color(0xFF42A5F5),
  ];

  static const List<Color> secondaryGradient = [
    Color(0xFF19B6E8),
    Color(0xFF00D4FF),
  ];

  static const List<Color> membershipCardGradient = [
    Color(0xFF667EEA),
    Color(0xFF764BA2),
  ];

  // Glassmorphism colors
  static Color glassBackground(BuildContext context) =>
      Theme.of(context).brightness == Brightness.light
          ? Colors.white.withValues(alpha: 0.25)
          : Colors.black.withValues(alpha: 0.25);

  static Color glassBorder(BuildContext context) =>
      Theme.of(context).brightness == Brightness.light
          ? Colors.white.withValues(alpha: 0.18)
          : Colors.white.withValues(alpha: 0.1);

  // Neumorphism colors
  static const Color neumorphismLight = Color(0xFFF5F7FB);
  static const Color neumorphismDark = Color(0xFFE8EBF0);
  static const Color neumorphismShadow = Color(0xFFD1D5DB);

  // Pastel colors for modern UI
  static const Color pastelBlue = Color(0xFFE3F2FD);
  static const Color pastelGreen = Color(0xFFE8F5E9);
  static const Color pastelOrange = Color(0xFFFFF3E0);
  static const Color pastelPurple = Color(0xFFF3E5F5);
  static const Color pastelPink = Color(0xFFFCE4EC);

  static const List<Color> tierColors = [
    Color(0xFFC0C0C0), // Silver
    Color(0xFFFFD700), // Gold
    Color(0xFFE5E4E2), // Platinum
    Color(0xFFB76E79), // VIP
    Color(0xFFB9F2FF), // Diamond
    Color(0xFF0F62FE), // Business
  ];
}
