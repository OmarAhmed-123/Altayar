import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/utils/date_formatter.dart';
import 'package:altayar/features/booking/data/models/booking.dart';
import 'package:altayar/features/booking/presentation/providers/booking_provider.dart';
import 'package:altayar/features/membership/presentation/pages/fawaterak_checkout_page.dart';
import 'package:altayar/features/accounting/presentation/providers/accounting_provider.dart';
import 'package:altayar/features/membership/presentation/providers/membership_card_provider.dart';

class BookingDetailSheet extends StatelessWidget {
  const BookingDetailSheet({super.key, required this.booking});

  final BookingModel booking;

  static const statusFlow = [
    BookingStatus.pending,
    BookingStatus.confirmed,
    BookingStatus.paid,
    BookingStatus.completed,
    BookingStatus.cancelled,
  ];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<BookingProvider>();
    final currentIndex = statusFlow.indexOf(booking.status);
    return Padding(
      padding: MediaQuery.of(context).viewInsets.add(const EdgeInsets.all(24)),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'تفاصيل حجز #${booking.id}',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.person),
            title: Text(booking.customerName),
            subtitle: Text(booking.customerEmail),
          ),
          _InfoRow(
            label: 'الفئة',
            value: booking.category.name,
          ),
          _InfoRow(
            label: 'السعر',
            value: '${booking.totalPrice.toStringAsFixed(2)} EGP',
          ),
          _InfoRow(
            label: 'المدة',
            value:
                '${DateFormatter.format(booking.startDate)} → ${DateFormatter.format(booking.endDate)}',
          ),
          if (booking.specialRequests?.isNotEmpty ?? false)
            _InfoRow(
              label: 'الملاحظات',
              value: booking.specialRequests!,
            ),
          const SizedBox(height: 12),
          Text(
            'مخطط الحالة',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Row(
            children: statusFlow.map((status) {
              final index = statusFlow.indexOf(status);
              final isReached = index <= currentIndex;
              return Expanded(
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 14,
                      backgroundColor:
                          isReached ? Colors.green : Colors.grey.shade300,
                      child: const Icon(
                        Icons.check,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      status.name,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: statusFlow
                .where((status) => status != booking.status)
                .map(
                  (status) => OutlinedButton(
                    onPressed: () => provider.updateStatus(booking, status),
                    child: Text('تغيير إلى ${status.name}'),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 16),
          if (_canRequestPayment(booking))
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: provider.isGeneratingPayment(booking.id)
                    ? null
                    : () => _requestPayment(context, provider),
                icon: provider.isGeneratingPayment(booking.id)
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.receipt_long),
                label: Text(
                  provider.isGeneratingPayment(booking.id)
                      ? 'جاري إنشاء رابط الدفع...'
                      : 'دفع عبر فواتيرك',
                ),
              ),
            ),
        ],
      ),
    );
  }

  bool _canRequestPayment(BookingModel booking) {
    return booking.status == BookingStatus.pending ||
        booking.status == BookingStatus.confirmed;
  }

  Future<void> _requestPayment(
    BuildContext context,
    BookingProvider provider,
  ) async {
    final messenger = ScaffoldMessenger.of(context);
    final link = await provider.createPaymentLink(booking);
    if (!context.mounted) return;
    if (link != null && link.isNotEmpty) {
      // Open Fawaterak checkout page
      final shouldVerify = await FawaterakCheckoutPage.open(context, link);
      if (!context.mounted) return;
      if (shouldVerify) {
        // Verify payment and refresh data
        messenger.showSnackBar(
          const SnackBar(
            content: Text('تم الدفع بنجاح! جاري تحديث البيانات...'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
        // Refresh all data after successful payment
        await Future.wait([
          provider.loadData(refresh: true),
          context.read<AccountingProvider>().loadAll(refresh: true),
          context.read<MembershipCardProvider>().loadCard(),
        ]);
        if (context.mounted) {
          messenger.showSnackBar(
            const SnackBar(
              content: Text('تم تحديث البيانات بنجاح!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } else if (provider.paymentError != null) {
      messenger.showSnackBar(
        SnackBar(
          content: Text(provider.paymentError!),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      messenger.showSnackBar(
        const SnackBar(
          content: Text('تعذر إنشاء رابط الدفع حالياً.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(
            '$label:',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
