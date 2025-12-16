import 'package:flutter/material.dart';

import 'package:altayar/features/user_management/data/models/role_analytics_models.dart';

class RoleMatrixBoard extends StatelessWidget {
  const RoleMatrixBoard({
    super.key,
    required this.entries,
    this.onRefresh,
    this.isLoading = false,
  });

  final List<RoleMatrixEntry> entries;
  final VoidCallback? onRefresh;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.grid_view_rounded),
                const SizedBox(width: 8),
                Text(
                  'مصفوفة الوصول الديناميكية (RBAC)',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const Spacer(),
                IconButton(
                  onPressed: isLoading ? null : onRefresh,
                  icon: isLoading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.refresh),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (entries.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: Text('لا توجد بيانات متاحة حالياً')),
              )
            else
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: entries.map((entry) {
                  return _RoleCard(entry: entry);
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({required this.entry});

  final RoleMatrixEntry entry;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      width: 280,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withAlpha((255 * .4).round()),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: scheme.primary.withAlpha((255 * .15).round()),
                child: Text(
                  entry.title.characters.first.toUpperCase(),
                  style: TextStyle(
                    color: scheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entry.title,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Text(
                    entry.role.toUpperCase(),
                    style: Theme.of(context)
                        .textTheme
                        .labelSmall
                        ?.copyWith(color: scheme.primary),
                  ),
                ],
              ),
              const Spacer(),
              Column(
                children: [
                  Text(
                    '${entry.count}',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Text(
                    'مستخدم',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: entry.permissions
                .map(
                  (permission) => Chip(
                    label: Text(permission),
                    visualDensity: VisualDensity.compact,
                  ),
                )
                .toList(),
          ),
          if (entry.trend != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  entry.trend! >= 0
                      ? Icons.arrow_upward_rounded
                      : Icons.arrow_downward_rounded,
                  color: entry.trend! >= 0 ? Colors.green : Colors.red,
                  size: 18,
                ),
                const SizedBox(width: 4),
                Text(
                  '${entry.trend!.toStringAsFixed(1)}% متوقع',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: entry.trend! >= 0 ? Colors.green : Colors.red,
                      ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
