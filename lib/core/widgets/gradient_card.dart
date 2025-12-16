import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// A card widget with gradient background
class GradientCard extends StatelessWidget {
  const GradientCard({
    super.key,
    required this.child,
    this.colors,
    this.padding,
    this.margin,
    this.borderRadius,
    this.onTap,
    this.begin = Alignment.topLeft,
    this.end = Alignment.bottomRight,
  });

  final Widget child;
  final List<Color>? colors;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;
  final AlignmentGeometry begin;
  final AlignmentGeometry end;

  @override
  Widget build(BuildContext context) {
    final gradientColors = colors ?? AppColors.primaryGradient;
    final borderRadius = this.borderRadius ?? BorderRadius.circular(24);
    final content = Container(
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        gradient: LinearGradient(
          colors: gradientColors,
          begin: begin,
          end: end,
        ),
        boxShadow: [
          BoxShadow(
            color: gradientColors.first.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Padding(
        padding: padding ?? const EdgeInsets.all(20),
        child: child,
      ),
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: borderRadius,
        child: content,
      );
    }

    return content;
  }
}
