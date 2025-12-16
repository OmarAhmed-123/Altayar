import 'package:flutter/material.dart';

class ActivityTimeline extends StatelessWidget {
  const ActivityTimeline({super.key, required this.activities});

  final List<Map<String, dynamic>> activities;

  @override
  Widget build(BuildContext context) {
    if (activities.isEmpty) {
      return const Center(child: Text('لا توجد حركات حديثة.'));
    }
    return Column(
      children: activities.map((activity) {
        final title = activity['title']?.toString() ?? 'نشاط';
        final description = activity['description']?.toString() ?? '';
        final timestamp = activity['created_at']?.toString() ?? '';
        return ListTile(
          leading: const Icon(Icons.bolt, color: Colors.amber),
          title: Text(title),
          subtitle: Text('$description\n$timestamp'),
          isThreeLine: true,
        );
      }).toList(),
    );
  }
}
