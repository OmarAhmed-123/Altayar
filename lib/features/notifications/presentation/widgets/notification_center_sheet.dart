import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/features/notifications/presentation/providers/notification_provider.dart';

class NotificationCenterSheet extends StatelessWidget {
  const NotificationCenterSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NotificationProvider>();
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'مركز الإشعارات',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                IconButton(
                  onPressed: () => provider.refresh(),
                  icon: const Icon(Icons.refresh),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            if (provider.isLoading)
              const Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              )
            else if (provider.notifications.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Text('لا توجد إشعارات جديدة.'),
              )
            else
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: provider.notifications.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final notification = provider.notifications[index];
                    return ListTile(
                      leading: Icon(
                        Icons.notifications,
                        color: notification.isRead
                            ? Colors.grey
                            : Theme.of(context).colorScheme.primary,
                      ),
                      title: Text(notification.title),
                      subtitle: Text(notification.message),
                      trailing: Text(
                        notification.createdAt
                            .toLocal()
                            .toString()
                            .split('.')
                            .first,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      onTap: () => provider.markAsRead(notification.id),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
