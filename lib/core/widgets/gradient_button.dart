import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// A button with gradient background and smooth animations
class GradientButton extends StatefulWidget {
  const GradientButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isBusy = false,
    this.icon,
    this.colors,
    this.padding,
    this.borderRadius,
    this.textColor = Colors.white,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isBusy;
  final IconData? icon;
  final List<Color>? colors;
  final EdgeInsetsGeometry? padding;
  final BorderRadius? borderRadius;
  final Color textColor;

  @override
  State<GradientButton> createState() => _GradientButtonState();
}

class _GradientButtonState extends State<GradientButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    _controller.forward();
  }

  void _handleTapUp(TapUpDetails details) {
    _controller.reverse();
  }

  void _handleTapCancel() {
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final gradientColors = widget.colors ?? AppColors.primaryGradient;
    final borderRadius = widget.borderRadius ?? BorderRadius.circular(16);

    return GestureDetector(
      onTapDown:
          widget.onPressed != null && !widget.isBusy ? _handleTapDown : null,
      onTapUp: widget.onPressed != null && !widget.isBusy
          ? (details) {
              _handleTapUp(details);
              widget.onPressed?.call();
            }
          : null,
      onTapCancel:
          widget.onPressed != null && !widget.isBusy ? _handleTapCancel : null,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          padding: widget.padding ??
              const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: borderRadius,
            gradient: LinearGradient(
              colors: widget.isBusy || widget.onPressed == null
                  ? [Colors.grey.shade400, Colors.grey.shade500]
                  : gradientColors,
            ),
            boxShadow: [
              BoxShadow(
                color: gradientColors.first.withOpacity(0.4),
                blurRadius: 12,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.isBusy)
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              else if (widget.icon != null)
                Icon(widget.icon, color: widget.textColor, size: 20),
              if (widget.isBusy || widget.icon != null)
                const SizedBox(width: 8),
              Text(
                widget.label,
                style: TextStyle(
                  color: widget.textColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
