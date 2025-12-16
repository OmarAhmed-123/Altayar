import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher_string.dart';

import 'package:altayar/features/ad_manager/data/models/ad_campaign.dart';
import 'package:altayar/features/ad_manager/presentation/utils/ad_media_helper.dart';

class AdCard extends StatelessWidget {
  const AdCard({
    super.key,
    required this.ad,
    required this.onToggleActive,
    required this.onDelete,
    required this.onSend,
  });

  final AdCampaign ad;
  final VoidCallback onToggleActive;
  final VoidCallback onDelete;
  final Future<void> Function() onSend;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    ad.title,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
                Switch(
                  value: ad.isActive,
                  onChanged: (_) => onToggleActive(),
                  thumbColor: WidgetStatePropertyAll(
                    Theme.of(context).colorScheme.primary,
                  ),
                  trackColor: WidgetStatePropertyAll(
                    Theme.of(context)
                        .colorScheme
                        .primary
                        .withAlpha((255 * .3).round()),
                  ),
                ),
              ],
            ),
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: CachedNetworkImage(
                imageUrl: resolveAdImage(ad),
                height: 160,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (_, __) => const _AdImagePlaceholder(),
                errorWidget: (_, __, ___) =>
                    const _AdImagePlaceholder(icon: Icons.image_not_supported),
              ),
            ),
            const SizedBox(height: 12),
            Text(ad.description),
            const SizedBox(height: 8),
            if (ad.linkUrl != null) ...[
              TextButton.icon(
                onPressed: () async {
                  await launchUrlString(
                    ad.linkUrl!,
                    mode: LaunchMode.externalApplication,
                  );
                },
                icon: const Icon(Icons.open_in_new),
                label: const Text('معاينة رابط الحملة'),
              ),
              const SizedBox(height: 8),
            ],
            Wrap(
              spacing: 8,
              children: [
                Chip(
                  label: Text(
                    ad.startDate == null
                        ? 'بدون تاريخ بداية'
                        : 'يبدأ ${ad.startDate!.toString().split(' ').first}',
                  ),
                ),
                Chip(
                  label: Text(
                    ad.endDate == null
                        ? 'بدون تاريخ نهاية'
                        : 'ينتهي ${ad.endDate!.toString().split(' ').first}',
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            Row(
              children: [
                ElevatedButton.icon(
                  onPressed: onSend,
                  icon: const Icon(Icons.campaign),
                  label: const Text('إرسال إشعار'),
                ),
                const SizedBox(width: 12),
                OutlinedButton.icon(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_outline),
                  label: const Text('حذف'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AdImagePlaceholder extends StatelessWidget {
  const _AdImagePlaceholder({this.icon = Icons.photo});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 160,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.blueGrey.shade100,
            Colors.blueGrey.shade50,
          ],
        ),
      ),
      child: Icon(
        icon,
        size: 40,
        color: Colors.blueGrey.shade400,
      ),
    );
  }
}
