import 'package:flutter/material.dart';

class AuthSocialButton extends StatelessWidget {
  const AuthSocialButton({
    super.key,
    required this.icon,
    required this.label,
    this.onPressed,
    this.backgroundColor,
  });

  final IconData icon;
  final String label;
  final Future<void> Function()? onPressed;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    return FilledButton.tonalIcon(
      style: FilledButton.styleFrom(
        backgroundColor: backgroundColor ?? Colors.white,
        foregroundColor: Colors.black87,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
      onPressed: onPressed == null
          ? null
          : () {
              onPressed!.call();
            },
      icon: Icon(icon, size: 20),
      label: Text(label),
    );
  }
}
