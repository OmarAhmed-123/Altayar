import 'package:flutter/material.dart';

import 'package:altayar/features/user_management/data/models/role_analytics_models.dart';

class LiveMonitoringPanel extends StatelessWidget {
  const LiveMonitoringPanel({
    super.key,
    required this.metrics,
    required this.activities,
    this.isLoading = false,
    this.onRefresh,
  });

  final List<LiveMetric> metrics;
  final List<RecentActivity> activities;
  final bool isLoading;
  final VoidCallback? onRefresh;

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
                const Icon(Icons.podcasts),
                const SizedBox(width: 8),
                Text(
                  'مراقبة حيّة للأدوار والأنشطة',
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
            if (metrics.isEmpty)
              const Text('لا توجد بيانات لحظية حالياً')
            else
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: metrics
                    .map((metric) => _MetricCard(metric: metric))
                    .toList(),
              ),
            const SizedBox(height: 16),
            Text(
              'آخر الأنشطة',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            if (activities.isEmpty)
              const Text('لم يتم تسجيل نشاط حديث')
            else
              ...activities.take(5).map(
                    (activity) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.bolt_rounded),
                      title: Text(activity.title),
                      subtitle: Text(activity.description),
                      trailing: Text(
                        activity.time != null
                            ? _formattedTime(activity.time!)
                            : '',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  ),
          ],
        ),
      ),
    );
  }

  String _formattedTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);
    if (difference.inMinutes < 1) return 'الآن';
    if (difference.inMinutes < 60) {
      return '${difference.inMinutes} د';
    }
    if (difference.inHours < 24) {
      return '${difference.inHours} س';
    }
    return '${difference.inDays} يوم';
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.metric});

  final LiveMetric metric;

  @override
  Widget build(BuildContext context) {
    final valueText = metric.value is double
        ? (metric.value as double).toStringAsFixed(1)
        : metric.value.toString();
    final trendColor =
        (metric.trend ?? 0) >= 0 ? Colors.green : Colors.redAccent;

    return Container(
      width: 180,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: Theme.of(context)
            .colorScheme
            .surfaceContainerHighest
            .withAlpha((255 * .5).round()),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            metric.label,
            style: Theme.of(context).textTheme.labelLarge,
          ),
          const SizedBox(height: 8),
          Text(
            valueText,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          if (metric.trend != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(
                  metric.trend! >= 0 ? Icons.trending_up : Icons.trending_down,
                  color: trendColor,
                  size: 16,
                ),
                const SizedBox(width: 4),
                Text(
                  '${metric.trend!.toStringAsFixed(1)}%',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: trendColor,
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
