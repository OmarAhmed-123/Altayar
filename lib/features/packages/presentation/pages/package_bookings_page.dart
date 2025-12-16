import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/booking/presentation/providers/booking_provider.dart';

Future<void> _showDeleteConfirmation(
  BuildContext context,
  Map<String, dynamic> booking,
) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('تأكيد الحذف'),
      content: Text(
        'هل أنت متأكد من حذف الحجز #${booking['id']}؟\nسيتم حذف الحجز من قاعدة البيانات ولن يظهر عند جميع المستخدمين.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('إلغاء'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(true),
          style: FilledButton.styleFrom(
            backgroundColor: Colors.red,
          ),
          child: const Text('حذف'),
        ),
      ],
    ),
  );

  if (confirmed == true && context.mounted) {
    final provider = Provider.of<BookingProvider>(context, listen: false);
    final success = await provider.deleteBooking(booking['id'] as int);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success
              ? 'تم حذف الحجز بنجاح'
              : 'فشل حذف الحجز: ${provider.errorMessage ?? "خطأ غير معروف"}'),
          backgroundColor: success ? Colors.green : Colors.red,
        ),
      );
    }
  }
}

class PackageBookingsPage extends StatelessWidget {
  const PackageBookingsPage({
    super.key,
    required this.packageId,
    required this.packageName,
    required this.bookingsData,
    this.showOnlyCompleted = false,
    this.isAdmin = false,
  });

  final int packageId;
  final String packageName;
  final Map<String, dynamic> bookingsData;
  final bool showOnlyCompleted;
  final bool isAdmin;

  @override
  Widget build(BuildContext context) {
    final summary = bookingsData['summary'] as Map<String, dynamic>? ?? {};
    final bookings = (showOnlyCompleted
            ? (bookingsData['completedBookings'] as List<dynamic>? ?? [])
            : (bookingsData['bookings'] as List<dynamic>? ?? []))
        .cast<Map<String, dynamic>>();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          showOnlyCompleted
              ? 'الحجوزات المكتملة - $packageName'
              : 'الحجوزات المتعلقة - $packageName',
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Summary Card
            GlassCard(
              borderRadius: BorderRadius.circular(24),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'ملخص',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _SummaryItem(
                          label: 'إجمالي الحجوزات',
                          value: (summary['totalBookings'] ?? 0).toString(),
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _SummaryItem(
                          label: 'مكتملة',
                          value: (summary['completedBookings'] ?? 0).toString(),
                          color: Colors.green,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _SummaryItem(
                          label: 'معلقة',
                          value: (summary['pendingBookings'] ?? 0).toString(),
                          color: Colors.orange,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Bookings Section
            if (bookings.isNotEmpty) ...[
              Text(
                showOnlyCompleted ? 'الحجوزات المكتملة' : 'الحجوزات',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 16),
              ...bookings.map((booking) => _BookingCard(
                    booking: booking,
                    isAdmin: isAdmin,
                    onDelete: isAdmin
                        ? () => _showDeleteConfirmation(context, booking)
                        : null,
                  )),
            ] else ...[
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    children: [
                      Icon(
                        Icons.book_outlined,
                        size: 64,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        showOnlyCompleted
                            ? 'لا توجد حجوزات مكتملة'
                            : 'لا توجد حجوزات',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: Colors.grey[600],
                                ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SummaryItem extends StatelessWidget {
  const _SummaryItem({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey[700],
                ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
          ),
        ],
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  const _BookingCard({
    required this.booking,
    this.isAdmin = false,
    this.onDelete,
  });

  final Map<String, dynamic> booking;
  final bool isAdmin;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final status = booking['status']?.toString() ?? 'unknown';
    final statusColor = _getStatusColor(status);
    final date = booking['createdAt'] != null
        ? DateTime.tryParse(booking['createdAt'].toString())
        : null;

    return GlassCard(
      borderRadius: BorderRadius.circular(16),
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      booking['userName']?.toString() ?? 'مستخدم غير معروف',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    if (booking['userEmail'] != null)
                      Text(
                        booking['userEmail'].toString(),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                      ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: statusColor),
                ),
                child: Text(
                  _getStatusLabel(status),
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
              if (isAdmin && onDelete != null) ...[
                const SizedBox(width: 8),
                IconButton(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  tooltip: 'حذف الحجز',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _InfoItem(
                  icon: Icons.confirmation_number,
                  label: 'رقم الحجز',
                  value: '#${booking['id']}',
                ),
              ),
              Expanded(
                child: _InfoItem(
                  icon: Icons.category,
                  label: 'النوع',
                  value: booking['bookingType']?.toString() ?? 'غير محدد',
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _InfoItem(
                  icon: Icons.attach_money,
                  label: 'المبلغ',
                  value:
                      '${((booking['totalPrice'] as num?) ?? 0).toStringAsFixed(0)} EGP',
                ),
              ),
              if (date != null)
                Expanded(
                  child: _InfoItem(
                    icon: Icons.calendar_today,
                    label: 'التاريخ',
                    value: DateFormat('dd/MM/yyyy').format(date),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return Colors.green;
      case 'pending':
      case 'confirmed':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'مكتمل';
      case 'paid':
        return 'مدفوع';
      case 'pending':
        return 'معلق';
      case 'confirmed':
        return 'مؤكد';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  }
}

class _InfoItem extends StatelessWidget {
  const _InfoItem({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 4),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                      fontSize: 10,
                    ),
              ),
              Text(
                value,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
