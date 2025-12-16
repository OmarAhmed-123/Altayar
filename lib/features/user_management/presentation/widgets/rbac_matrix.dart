import 'package:flutter/material.dart';

import 'package:altayar/features/user_management/data/models/rbac_capability.dart';

class RbacMatrix extends StatelessWidget {
  const RbacMatrix({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'مصفوفة الصلاحيات',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            ...RoleMatrix.capabilities.map(
              (capability) => ExpansionTile(
                leading:
                    Icon(Icons.verified_user, color: theme.colorScheme.primary),
                title: Text(
                  capability.title,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text('Role: ${capability.role.toUpperCase()}'),
                children: capability.permissions
                    .map(
                      (permission) => ListTile(
                        dense: true,
                        leading: const Icon(Icons.check_circle, size: 18),
                        title: Text(permission),
                      ),
                    )
                    .toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
