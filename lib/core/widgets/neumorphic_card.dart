import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// A neumorphic card widget with soft shadows
class NeumorphicCard extends StatelessWidget {
  const NeumorphicCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius,
    this.onTap,
    this.isPressed = false,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;
  final bool isPressed;

  @override
  Widget build(BuildContext context) {
    final borderRadius = this.borderRadius ?? BorderRadius.circular(20);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final lightColor =
        isDark ? Colors.grey.shade800 : AppColors.neumorphismLight;
    final darkColor = isDark ? Colors.grey.shade900 : AppColors.neumorphismDark;

    final content = Container(
      margin: margin,
      padding: padding ?? const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: lightColor,
        borderRadius: borderRadius,
        boxShadow: isPressed
            ? [
                BoxShadow(
                  color: darkColor.withOpacity(0.3),
                  blurRadius: 5,
                  offset: const Offset(2, 2),
                ),
              ]
            : [
                BoxShadow(
                  color: Colors.white.withOpacity(0.7),
                  blurRadius: 10,
                  offset: const Offset(-5, -5),
                ),
                BoxShadow(
                  color: darkColor.withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(5, 5),
                ),
              ],
      ),
      child: child,
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
