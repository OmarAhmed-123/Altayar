import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';

class EmployeeProfileCard extends StatelessWidget {
  const EmployeeProfileCard({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().currentUser;
    if (user == null) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: Theme.of(context)
                      .colorScheme
                      .primary
                      .withAlpha((255 * .1).round()),
                  child: Text(
                    user.name.isNotEmpty ? user.name[0] : '?',
                    style: const TextStyle(
                        fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.name,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Text(
                        user.email,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      Text(
                        'الدور الحالي: ${user.role.toUpperCase()}',
                        style: Theme.of(context).textTheme.labelLarge,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _MetricTile(
                  label: 'نقاط الولاء',
                  value: '${user.points}',
                  icon: Icons.loyalty,
                ),
                const SizedBox(width: 12),
                _MetricTile(
                  label: 'الكاش باك',
                  value: user.cashback.toStringAsFixed(2),
                  icon: Icons.account_balance_wallet_outlined,
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Wrap(
              spacing: 8,
              children: [
                Chip(
                  avatar: Icon(Icons.security),
                  label: Text('2FA Enabled'),
                ),
                Chip(
                  avatar: Icon(Icons.verified_user),
                  label: Text('OAuth Linked'),
                ),
                Chip(
                  avatar: Icon(Icons.schedule),
                  label: Text('Monitoring SLA'),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          color: Colors.grey.shade100,
        ),
        child: Column(
          children: [
            Icon(icon),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            Text(label),
          ],
        ),
      ),
    );
  }
}
