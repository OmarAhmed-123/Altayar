import 'package:flutter/material.dart';

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isBusy = false,
    this.icon,
  });

  final String label;
  final Future<void> Function()? onPressed;
  final bool isBusy;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return FilledButton.icon(
      onPressed: isBusy || onPressed == null
          ? null
          : () {
              onPressed!.call();
            },
      icon: isBusy
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Icon(icon ?? Icons.check_circle_outline),
      label: Text(label),
    );
  }
}
