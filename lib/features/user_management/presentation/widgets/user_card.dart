import 'package:flutter/material.dart';

import 'package:altayar/core/widgets/animated_card.dart';
import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/user_management/data/models/user_account.dart';
import 'package:altayar/features/user_management/presentation/widgets/role_badge.dart';

class UserCard extends StatelessWidget {
  const UserCard({
    super.key,
    required this.user,
    required this.onRoleChange,
    required this.onGiftTap,
    this.onDelete,
    this.onBan,
  });

  final UserAccount user;
  final ValueChanged<String> onRoleChange;
  final VoidCallback onGiftTap;
  final VoidCallback? onDelete;
  final VoidCallback? onBan;

  static const _roleOptions = [
    'super_admin',
    'admin',
    'hr',
    'accountant',
    'sales',
    'reservations',
    'support',
    'data_entry',
    'agent',
    'customer',
  ];

  static bool _isValidRole(String role) {
    // Valid roles based on database constraint
    const validRoles = [
      'super_admin',
      'admin',
      'hr',
      'accountant',
      'sales',
      'reservations',
      'support',
      'data_entry',
      'agent',
      'customer',
    ];
    return validRoles.contains(role);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AnimatedCard(
      borderRadius: BorderRadius.circular(20),
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: user.banned
                          ? AppColors.errorGradient
                          : AppColors.primaryGradient,
                    ),
                  ),
                  child: Icon(
                    user.banned ? Icons.block : Icons.person,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              user.name,
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: user.banned
                                    ? Colors.grey[600]
                                    : AppColors.dark,
                                decoration: user.banned
                                    ? TextDecoration.lineThrough
                                    : null,
                              ),
                            ),
                          ),
                          if (user.banned)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.red[100],
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                'محظور',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: Colors.red[800],
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                        ],
                      ),
                      Text(
                        user.email,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color:
                              user.banned ? Colors.grey[500] : Colors.grey[700],
                        ),
                      ),
                    ],
                  ),
                ),
                RoleBadge(
                  role: user.role,
                  isSuperAdmin: user.isSuperAdmin,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _StatChip(
                  icon: Icons.stars,
                  label: 'النقاط',
                  value: '${user.points}',
                ),
                const SizedBox(width: 12),
                _StatChip(
                  icon: Icons.attach_money,
                  label: 'الكاش باك',
                  value: user.cashback.toStringAsFixed(2),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: user.role,
                    decoration: const InputDecoration(
                      labelText: 'تحديث الدور',
                    ),
                    items: _roleOptions
                        .where((role) => _isValidRole(role))
                        .map(
                          (role) => DropdownMenuItem(
                            value: role,
                            child: Text(role.toUpperCase()),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value != null && value != user.role) {
                        onRoleChange(value);
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                GradientButton(
                  label: 'هدية',
                  icon: Icons.card_giftcard,
                  onPressed: onGiftTap,
                  colors: AppColors.warningGradient,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                if (onBan != null)
                  Expanded(
                    child: GradientButton(
                      label: user.banned ? 'إلغاء الحظر' : 'حظر',
                      icon: user.banned ? Icons.check_circle : Icons.block,
                      onPressed: onBan,
                      colors: user.banned
                          ? AppColors.successGradient
                          : AppColors.errorGradient,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 12,
                      ),
                    ),
                  ),
                if (onBan != null && onDelete != null) const SizedBox(width: 8),
                if (onDelete != null)
                  Expanded(
                    child: GradientButton(
                      label: 'حذف',
                      icon: Icons.delete_outline,
                      onPressed: onDelete,
                      colors: AppColors.errorGradient,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 12,
                      ),
                    ),
                  ),
              ],
            )
          ],
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppColors.primary.withOpacity(0.1),
              AppColors.primary.withOpacity(0.05),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: AppColors.primary.withOpacity(0.2),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withOpacity(0.15),
              ),
              child: Icon(icon, size: 16, color: AppColors.primary),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[700],
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
