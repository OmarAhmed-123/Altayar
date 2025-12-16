import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/content/presentation/providers/content_provider.dart';
import 'package:altayar/features/content/presentation/widgets/comments_sheet.dart';
import 'package:altayar/features/packages/data/models/travel_package.dart';
import 'package:altayar/features/packages/presentation/providers/package_provider.dart';
import 'package:altayar/features/packages/presentation/utils/package_media_helper.dart';
import 'package:altayar/features/membership/presentation/pages/fawaterak_checkout_page.dart';
import 'package:altayar/features/chat/presentation/pages/communication_page.dart';
import 'package:altayar/features/accounting/presentation/providers/accounting_provider.dart';
import 'package:altayar/features/membership/presentation/providers/membership_card_provider.dart';

class PackageDetailSheet extends StatelessWidget {
  const PackageDetailSheet({
    super.key,
    required this.travelPackage,
    this.isLoading = false,
    this.errorMessage,
    this.onRetry,
    this.onExplore,
  });

  final TravelPackage travelPackage;
  final bool isLoading;
  final String? errorMessage;
  final VoidCallback? onRetry;
  final VoidCallback? onExplore;

  @override
  Widget build(BuildContext context) {
    final galleryImages = resolvePackageGalleryImages(travelPackage);
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.9,
      builder: (context, controller) => SingleChildScrollView(
        controller: controller,
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isLoading)
              const LinearProgressIndicator(
                minHeight: 4,
              ),
            if (!isLoading && errorMessage != null) ...[
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.withAlpha((255 * .08).round()),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'تعذّر تحديث تفاصيل الباقة',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(color: Colors.red[800]),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      errorMessage!,
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: Colors.red[800]),
                    ),
                    if (onRetry != null)
                      Align(
                        alignment: AlignmentDirectional.centerEnd,
                        child: TextButton(
                          onPressed: onRetry,
                          child: const Text('إعادة المحاولة'),
                        ),
                      ),
                  ],
                ),
              ),
            ],
            Row(
              children: [
                Expanded(
                  child: Text(
                    travelPackage.title,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ),
                if (travelPackage.isExclusive)
                  Chip(
                    label: const Text('Exclusive'),
                    backgroundColor: Colors.amber.shade100,
                  ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 220,
              child: PageView.builder(
                itemCount: galleryImages.length,
                itemBuilder: (context, index) {
                  final imageUrl = galleryImages[index];
                  return Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: CachedNetworkImage(
                        imageUrl: imageUrl,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => Container(
                          color: Colors.grey.shade200,
                          child: const Icon(Icons.photo, size: 48),
                        ),
                        errorWidget: (_, __, ___) => Container(
                          color: Colors.grey.shade100,
                          child: const Icon(Icons.broken_image, size: 48),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.location_on_outlined),
                const SizedBox(width: 6),
                Text(travelPackage.destination ?? 'غير محدد'),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.timelapse),
                const SizedBox(width: 6),
                Text(
                  '${travelPackage.durationDays} يوم / ${travelPackage.durationNights} ليلة',
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.event_seat),
                const SizedBox(width: 6),
                Text('تبقّى ${travelPackage.remainingSeats} مقعد'),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              travelPackage.description,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'السعر',
                        style: Theme.of(context).textTheme.labelLarge,
                      ),
                      Text(
                        '${travelPackage.price.toStringAsFixed(2)} EGP',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    icon: const Icon(Icons.credit_card),
                    label: const Text('الدفع عبر فواتيرك'),
                    onPressed: () => _handlePayment(context),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.help_outline),
                    label: const Text('طلب استفسار'),
                    onPressed: () => _handleInquiry(context),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              icon: const Icon(Icons.explore),
              label: const Text('استكشاف العرض'),
              onPressed: () => _handleExplore(context),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              icon: const Icon(Icons.mode_comment_outlined),
              label: const Text('مناقشة العرض'),
              onPressed: () => _openComments(context),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openComments(BuildContext context) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => ChangeNotifierProvider.value(
        value: context.read<ContentProvider>(),
        child: CommentsSheet(
          resourceType: 'package',
          resourceId: travelPackage.id,
          title: travelPackage.title,
        ),
      ),
    );
  }

  Future<void> _handlePayment(BuildContext context) async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    try {
      // Create payment invoice for package
      // Note: Backend expects 'booking' type, not 'package'
      // We'll create a booking first, then use it for payment
      final api = context.read<ApiClient>();

      // First, create a booking for this package
      // Note: Backend expects valid booking types: tour, nile_cruise, flight, hotel, transfer, nile_trip, general_tour, custom
      // Using 'general_tour' for package bookings
      final bookingResponse = await api.post(
        'bookings',
        body: {
          'bookingType': 'general_tour',
          'packageId': travelPackage.id,
          'totalPrice': travelPackage.price,
          'details': {
            'packageId': travelPackage.id,
            'packageTitle': travelPackage.title,
            'participants': 1,
          },
        },
      );

      final bookingData = bookingResponse.data as Map<String, dynamic>? ?? {};
      final bookingId = bookingData['id'] as int?;

      if (bookingId == null) {
        messenger.showSnackBar(
          const SnackBar(
              content: Text('فشل إنشاء الحجز. يرجى المحاولة مرة أخرى')),
        );
        return;
      }

      // Now create payment invoice using the booking
      final response = await api.post(
        'payments/fawaterak/create-invoice',
        body: {
          'type': 'booking',
          'itemId': bookingId,
          'amount': travelPackage.price,
          'currency': 'EGP',
          'description': 'حجز رحلة: ${travelPackage.title}',
        },
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      final paymentUrl = data['invoiceUrl'] ??
          data['invoice_url'] ??
          data['payment_url'] ??
          data['PaymentURL'] ??
          data['url'] ??
          data['invoice_link'] ??
          data['link'];
      if (paymentUrl == null || paymentUrl.toString().isEmpty) {
        messenger.showSnackBar(
          SnackBar(
            content: Text(
                'تعذّر إنشاء رابط الدفع: ${data['error'] ?? data['message'] ?? 'خطأ غير معروف'}'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
      // Open Fawaterak checkout page
      final shouldVerify = await FawaterakCheckoutPage.open(
        context,
        paymentUrl.toString(),
      );
      if (!context.mounted) return;
      if (shouldVerify) {
        // Verify payment and show success message
        messenger.showSnackBar(
          SnackBar(
            content:
                Text('تم الدفع بنجاح! تم حجز الرحلة: ${travelPackage.title}'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 4),
          ),
        );
        // Refresh all data after successful payment
        await Future.wait([
          context.read<PackageProvider>().loadPackages(refresh: true),
          context.read<AccountingProvider>().loadAll(refresh: true),
          context.read<MembershipCardProvider>().loadCard(),
        ]);
        navigator.pop();
      }
    } catch (error) {
      if (!context.mounted) return;
      messenger.showSnackBar(
        SnackBar(content: Text('خطأ في الدفع: ${error.toString()}')),
      );
    }
  }

  Future<void> _handleInquiry(BuildContext context) async {
    final navigator = Navigator.of(context);
    // Navigate to communication page to start inquiry
    navigator.pop(); // Close package detail sheet
    // Navigate to communication page - you may need to adjust this based on your navigation structure
    navigator.push(
      MaterialPageRoute(
        builder: (_) => const CommunicationPage(),
      ),
    );
  }

  void _handleExplore(BuildContext context) {
    final navigator = Navigator.of(context);
    navigator.pop(); // Close package detail sheet
    // Use onExplore callback if provided, otherwise navigate to packages page
    if (onExplore != null) {
      onExplore!();
    } else {
      // Fallback: navigate to packages page
      navigator.pushNamed('/packages').catchError((_) {
        // If named route doesn't exist, just show a message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('جارٍ فتح صفحة العروض...')),
        );
        return null; // Return null to satisfy the error handler
      });
    }
  }
}

class PackageDetailModal extends StatefulWidget {
  const PackageDetailModal({
    super.key,
    required this.packageId,
    required this.initialPackage,
    this.onExplore,
  });

  final int packageId;
  final TravelPackage initialPackage;
  final VoidCallback? onExplore;

  @override
  State<PackageDetailModal> createState() => _PackageDetailModalState();
}

class _PackageDetailModalState extends State<PackageDetailModal> {
  late TravelPackage _current = widget.initialPackage;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final detail = await context
          .read<PackageProvider>()
          .fetchPackageDetail(widget.packageId);
      if (!mounted) return;
      setState(() {
        _current = detail;
        _error = null;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString());
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PackageDetailSheet(
      travelPackage: _current,
      isLoading: _isLoading,
      errorMessage: _error,
      onRetry: _loadDetail,
      onExplore: widget.onExplore,
    );
  }
}
