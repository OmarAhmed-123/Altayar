import 'package:flutter/material.dart';

/// An animated card with scale and fade transitions
class AnimatedCard extends StatelessWidget {
  const AnimatedCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius,
    this.onTap,
    this.elevation = 0,
    this.color,
    this.duration = const Duration(milliseconds: 300),
    this.curve = Curves.easeOut,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;
  final double elevation;
  final Color? color;
  final Duration duration;
  final Curve curve;

  @override
  Widget build(BuildContext context) {
    final borderRadius = this.borderRadius ?? BorderRadius.circular(20);
    final content = TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: duration,
      curve: curve,
      builder: (context, value, child) {
        return Transform.scale(
          scale: 0.9 + (value * 0.1),
          child: Opacity(
            opacity: value,
            child: child,
          ),
        );
      },
      child: Card(
        elevation: elevation,
        color: color,
        margin: margin ?? const EdgeInsets.symmetric(vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: borderRadius,
        ),
        child: Padding(
          padding: padding ?? const EdgeInsets.all(16),
          child: child,
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
