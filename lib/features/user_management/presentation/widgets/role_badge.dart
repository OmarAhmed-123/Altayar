import 'package:flutter/material.dart';

class RoleBadge extends StatelessWidget {
  const RoleBadge({
    super.key,
    required this.role,
    this.isSuperAdmin = false,
  });

  final String role;
  final bool isSuperAdmin;

  Color get _color {
    switch (role) {
      case 'super_admin':
        return Colors.deepPurple;
      case 'admin':
        return Colors.blue;
      case 'sales':
        return Colors.orange;
      case 'hr':
        return Colors.teal;
      case 'accountant':
        return Colors.indigo;
      case 'reservations':
        return Colors.cyan;
      case 'support':
        return Colors.green;
      case 'agent':
        return Colors.pink;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: _color.withAlpha((255 * .15).round()),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isSuperAdmin) ...[
            const Icon(Icons.workspace_premium, size: 16),
            const SizedBox(width: 4),
          ],
          Text(
            role.toUpperCase(),
            style: TextStyle(
              color: _color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
