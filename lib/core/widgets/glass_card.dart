import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// A glassmorphism card widget with blur effect and transparency
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius,
    this.onTap,
    this.blur = 10.0,
    this.opacity = 0.25,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;
  final double blur;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    final borderRadius = this.borderRadius ?? BorderRadius.circular(24);
    final content = Container(
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        border: Border.all(
          color: AppColors.glassBorder(context),
          width: 1.5,
        ),
      ),
      child: ClipRRect(
        borderRadius: borderRadius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: Container(
            padding: padding ?? const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.glassBackground(context).withOpacity(opacity),
              borderRadius: borderRadius,
            ),
            child: child,
          ),
        ),
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
