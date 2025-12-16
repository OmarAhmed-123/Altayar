import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher_string.dart';

import 'package:altayar/features/ad_manager/data/models/ad_campaign.dart';
import 'package:altayar/features/ad_manager/presentation/utils/ad_media_helper.dart';
import 'package:altayar/features/packages/data/models/travel_package.dart';
import 'package:altayar/features/packages/presentation/providers/package_provider.dart';
import 'package:altayar/features/packages/presentation/widgets/package_detail_sheet.dart';
import 'package:altayar/features/booking/presentation/pages/booking_dashboard_page.dart';

Future<void> showAdPopup(
  BuildContext context,
  List<AdCampaign> ads, {
  void Function(int index)? onNavigate,
  int? offersIndex,
}) async {
  if (ads.isEmpty) return;
  await showDialog(
    context: context,
    builder: (context) => _AdPopupDialog(
      ads: ads,
      onNavigate: onNavigate,
      offersIndex: offersIndex,
    ),
  );
}

class _AdPopupDialog extends StatelessWidget {
  const _AdPopupDialog({
    required this.ads,
    this.onNavigate,
    this.offersIndex,
  });

  final List<AdCampaign> ads;
  final void Function(int index)? onNavigate;
  final int? offersIndex;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'عروض خاصة لك',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 12),
            CarouselSlider(
              options: CarouselOptions(
                height: 360,
                autoPlay: ads.length > 1,
                enlargeCenterPage: true,
              ),
              items: ads
                  .map(
                    (ad) => _PopupCard(
                      ad: ad,
                      onTap: () => _showOfferDetail(
                          context, ad, onNavigate, offersIndex),
                    ),
                  )
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _PopupCard extends StatelessWidget {
  const _PopupCard({required this.ad, required this.onTap});

  final AdCampaign ad;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(horizontal: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: LinearGradient(
            colors: [
              scheme.primaryContainer,
              scheme.secondaryContainer,
            ],
          ),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: CachedNetworkImage(
                imageUrl: resolveAdImage(ad),
                height: 160,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(
                  height: 160,
                  width: double.infinity,
                  color: Colors.white.withAlpha((255 * .12).round()),
                  alignment: Alignment.center,
                  child: const CircularProgressIndicator(strokeWidth: 2),
                ),
                errorWidget: (_, __, ___) => Container(
                  height: 160,
                  width: double.infinity,
                  color: Colors.white.withAlpha((255 * .12).round()),
                  alignment: Alignment.center,
                  child: Icon(
                    Icons.image_not_supported,
                    color: scheme.onPrimaryContainer,
                    size: 42,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              ad.title,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 6),
            Flexible(
              child: Text(
                ad.description,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Chip(
                  label: Text(
                    ad.startDate == null
                        ? 'حصري لفترة محدودة'
                        : 'متاح حتى ${ad.endDate?.toString().split(' ').first ?? 'قريباً'}',
                  ),
                ),
                Icon(Icons.touch_app,
                    color: Theme.of(context).colorScheme.primary),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

void _showOfferDetail(
  BuildContext context,
  AdCampaign ad,
  void Function(int index)? onNavigate,
  int? offersIndex,
) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
    ),
    builder: (_) => _OfferDetailSheet(
      ad: ad,
      onNavigate: onNavigate,
      offersIndex: offersIndex,
    ),
  );
}

class _OfferDetailSheet extends StatelessWidget {
  const _OfferDetailSheet({
    required this.ad,
    this.onNavigate,
    this.offersIndex,
  });

  final AdCampaign ad;
  final void Function(int index)? onNavigate;
  final int? offersIndex;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    theme.colorScheme.primary,
                    theme.colorScheme.secondary,
                  ],
                ),
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          ad.title,
                          style: theme.textTheme.headlineSmall
                              ?.copyWith(color: Colors.white),
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close, color: Colors.white70),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    ad.description,
                    style: theme.textTheme.bodyLarge
                        ?.copyWith(color: Colors.white70),
                  ),
                ],
              ),
            ),
            CachedNetworkImage(
              imageUrl: resolveAdImage(ad),
              height: 240,
              width: double.infinity,
              fit: BoxFit.cover,
              placeholder: (_, __) => Container(
                height: 240,
                alignment: Alignment.center,
                child: const CircularProgressIndicator(strokeWidth: 2),
              ),
              errorWidget: (_, __, ___) => Container(
                height: 240,
                alignment: Alignment.center,
                child: const Icon(Icons.broken_image, size: 48),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (ad.startDate != null || ad.endDate != null)
                    Row(
                      children: [
                        const Icon(Icons.calendar_month_outlined),
                        const SizedBox(width: 8),
                        Text(
                          ad.startDate == null
                              ? 'العرض سارٍ حتى ${ad.endDate?.toString().split(' ').first ?? 'نفاد الأماكن'}'
                              : 'من ${ad.startDate!.toString().split(' ').first}'
                                  ' إلى ${ad.endDate?.toString().split(' ').first ?? 'إشعار آخر'}',
                        ),
                      ],
                    ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.flight_takeoff),
                      label: Text(ad.ctaLabel ?? 'استكشف العرض'),
                      onPressed: () => _handlePrimaryAction(
                        context,
                        ad,
                        onNavigate,
                        offersIndex,
                      ),
                    ),
                  ),
                  if (ad.linkUrl != null && ad.packageId != null)
                    TextButton(
                      onPressed: () =>
                          _launchExternal(ad.linkUrl ?? '', context),
                      child: const Text('عرض صفحة العرض على الويب'),
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

Future<void> _handlePrimaryAction(
  BuildContext context,
  AdCampaign ad,
  void Function(int index)? onNavigate,
  int? offersIndex,
) async {
  // Close the popup first
  Navigator.of(context).pop();

  if (ad.packageId != null) {
    // If we have onNavigate callback and offersIndex, navigate to offers page with package highlight
    if (onNavigate != null && offersIndex != null) {
      // Navigate directly to packages page with highlighted package
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) =>
              BookingDashboardPage(highlightPackageId: ad.packageId),
        ),
      );
      // Wait a bit then show package details
      await Future.delayed(const Duration(milliseconds: 500));
      if (context.mounted) {
        await _openPackage(context, ad.packageId!);
      }
    } else {
      // Fallback: just open package details
      await _openPackage(context, ad.packageId!);
    }
    return;
  }
  if (ad.linkUrl != null) {
    await _launchExternal(ad.linkUrl!, context);
    return;
  }
  // If no packageId and no linkUrl, navigate to offers page if available
  if (onNavigate != null && offersIndex != null) {
    onNavigate(offersIndex);
  } else {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('لم يتم ربط العرض بحزمة بعد.')),
    );
  }
}

Future<void> _openPackage(BuildContext context, int packageId) async {
  final provider = context.read<PackageProvider>();
  TravelPackage? pkg = _findPackage(provider, packageId);
  pkg ??= await provider.fetchPackageDetail(packageId);
  if (!context.mounted) return;
  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (_) => ChangeNotifierProvider.value(
      value: provider,
      child: PackageDetailModal(
        packageId: pkg!.id,
        initialPackage: pkg,
        onExplore: () {
          Navigator.of(context).pop();
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) =>
                  BookingDashboardPage(highlightPackageId: packageId),
            ),
          );
        },
      ),
    ),
  );
}

Future<void> _launchExternal(String url, BuildContext context) async {
  if (url.isEmpty) return;
  if (!await launchUrlString(url, mode: LaunchMode.externalApplication)) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تعذّر فتح الرابط، تفضل بتجربة لاحقة.'),
        ),
      );
    }
  }
}

TravelPackage? _findPackage(PackageProvider provider, int id) {
  for (final pkg in provider.packages) {
    if (pkg.id == id) return pkg;
  }
  return null;
}
