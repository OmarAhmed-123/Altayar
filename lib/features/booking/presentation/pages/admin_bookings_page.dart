import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/booking/presentation/providers/booking_provider.dart';
import 'package:altayar/features/booking/data/models/booking.dart';
import 'package:altayar/features/booking/presentation/pages/add_edit_booking_page.dart';

class AdminBookingsPage extends StatefulWidget {
  const AdminBookingsPage({super.key});

  @override
  State<AdminBookingsPage> createState() => _AdminBookingsPageState();
}

class _AdminBookingsPageState extends State<AdminBookingsPage> {
  BookingStatus? _statusFilter;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BookingProvider>().loadData(refresh: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('إدارة الحجوزات'),
        actions: [
          IconButton(
            onPressed: () {
              context.read<BookingProvider>().loadData(refresh: true);
            },
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث',
          ),
          IconButton(
            onPressed: () => _showAddBookingDialog(context),
            icon: const Icon(Icons.add),
            tooltip: 'إضافة حجز جديد',
          ),
        ],
      ),
      body: Column(
        children: [
          // Search and Filter Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Search Field
                TextField(
                  decoration: InputDecoration(
                    hintText: 'بحث في الحجوزات...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              setState(() => _searchQuery = '');
                              context.read<BookingProvider>().setQuery('');
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: Colors.grey[100],
                  ),
                  onChanged: (value) {
                    setState(() => _searchQuery = value);
                    context.read<BookingProvider>().setQuery(value);
                  },
                ),
                const SizedBox(height: 12),
                // Status Filter Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterChip(
                        label: 'الكل',
                        isSelected: _statusFilter == null,
                        onTap: () {
                          setState(() => _statusFilter = null);
                          context.read<BookingProvider>().setStatusFilter(null);
                        },
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'معلق',
                        isSelected: _statusFilter == BookingStatus.pending,
                        onTap: () {
                          setState(() => _statusFilter = BookingStatus.pending);
                          context
                              .read<BookingProvider>()
                              .setStatusFilter(BookingStatus.pending);
                        },
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'مؤكد',
                        isSelected: _statusFilter == BookingStatus.confirmed,
                        onTap: () {
                          setState(
                              () => _statusFilter = BookingStatus.confirmed);
                          context
                              .read<BookingProvider>()
                              .setStatusFilter(BookingStatus.confirmed);
                        },
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'مدفوع',
                        isSelected: _statusFilter == BookingStatus.paid,
                        onTap: () {
                          setState(() => _statusFilter = BookingStatus.paid);
                          context
                              .read<BookingProvider>()
                              .setStatusFilter(BookingStatus.paid);
                        },
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'مكتمل',
                        isSelected: _statusFilter == BookingStatus.completed,
                        onTap: () {
                          setState(
                              () => _statusFilter = BookingStatus.completed);
                          context
                              .read<BookingProvider>()
                              .setStatusFilter(BookingStatus.completed);
                        },
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'ملغي',
                        isSelected: _statusFilter == BookingStatus.cancelled,
                        onTap: () {
                          setState(
                              () => _statusFilter = BookingStatus.cancelled);
                          context
                              .read<BookingProvider>()
                              .setStatusFilter(BookingStatus.cancelled);
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Bookings List
          Expanded(
            child: Consumer<BookingProvider>(
              builder: (context, provider, _) {
                if (provider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (provider.errorMessage != null) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline,
                            size: 64, color: Colors.red[300]),
                        const SizedBox(height: 16),
                        Text(
                          'خطأ في تحميل الحجوزات',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          provider.errorMessage!,
                          style: Theme.of(context).textTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: () => provider.loadData(refresh: true),
                          child: const Text('إعادة المحاولة'),
                        ),
                      ],
                    ),
                  );
                }

                final bookings = provider.filteredAdmins;

                if (bookings.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.book_outlined,
                            size: 64, color: Colors.grey[400]),
                        const SizedBox(height: 16),
                        Text(
                          'لا توجد حجوزات',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _statusFilter != null
                              ? 'لا توجد حجوزات بالحالة المحددة'
                              : 'لم يتم العثور على حجوزات',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => provider.loadData(refresh: true),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: bookings.length,
                    itemBuilder: (context, index) {
                      final booking = bookings[index];
                      return _BookingCard(
                        booking: booking,
                        onDelete: () => _showDeleteConfirmation(
                          context,
                          booking,
                          provider,
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showAddBookingDialog(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AddEditBookingPage(
          onSave: (booking) {
            context.read<BookingProvider>().loadData(refresh: true);
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('تم إضافة الحجز بنجاح'),
                  backgroundColor: Colors.green,
                ),
              );
            }
          },
        ),
      ),
    );
  }

  Future<void> _showDeleteConfirmation(
    BuildContext context,
    BookingModel booking,
    BookingProvider provider,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تأكيد الحذف'),
        content: Text(
          'هل أنت متأكد من حذف الحجز #${booking.id}؟\nسيتم حذف الحجز من قاعدة البيانات ولن يظهر عند جميع المستخدمين.',
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
      final success = await provider.deleteBooking(booking.id);
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
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => onTap(),
      selectedColor: AppColors.primary.withOpacity(0.2),
      checkmarkColor: AppColors.primary,
      labelStyle: TextStyle(
        color: isSelected ? AppColors.primary : Colors.grey[700],
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  const _BookingCard({
    required this.booking,
    required this.onDelete,
  });

  final BookingModel booking;
  final VoidCallback onDelete;

  Color get statusColor {
    switch (booking.status) {
      case BookingStatus.pending:
        return Colors.orange;
      case BookingStatus.confirmed:
        return Colors.blue;
      case BookingStatus.paid:
        return Colors.teal;
      case BookingStatus.completed:
        return Colors.green;
      case BookingStatus.cancelled:
        return Colors.redAccent;
    }
  }

  String get statusLabel {
    switch (booking.status) {
      case BookingStatus.pending:
        return 'معلق';
      case BookingStatus.confirmed:
        return 'مؤكد';
      case BookingStatus.paid:
        return 'مدفوع';
      case BookingStatus.completed:
        return 'مكتمل';
      case BookingStatus.cancelled:
        return 'ملغي';
    }
  }

  String get categoryLabel {
    switch (booking.category) {
      case BookingCategory.tour:
        return 'جولة';
      case BookingCategory.nileCruise:
        return 'رحلة نيلية';
      case BookingCategory.flightTicket:
        return 'تذكرة طيران';
      case BookingCategory.hotelBooking:
        return 'حجز فندق';
      case BookingCategory.transfer:
        return 'نقل';
      case BookingCategory.nileTrip:
        return 'رحلة نيلية';
      case BookingCategory.generalTour:
        return 'جولة عامة';
      case BookingCategory.customRequest:
        return 'طلب مخصص';
    }
  }

  @override
  Widget build(BuildContext context) {
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
                      booking.customerName,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      booking.customerEmail,
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
                  statusLabel,
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: onDelete,
                icon: const Icon(Icons.delete_outline, color: Colors.red),
                tooltip: 'حذف الحجز',
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _InfoItem(
                  icon: Icons.confirmation_number,
                  label: 'رقم الحجز',
                  value: '#${booking.id}',
                ),
              ),
              Expanded(
                child: _InfoItem(
                  icon: Icons.category,
                  label: 'النوع',
                  value: categoryLabel,
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
                  value: '${booking.totalPrice.toStringAsFixed(0)} EGP',
                ),
              ),
              Expanded(
                child: _InfoItem(
                  icon: Icons.calendar_today,
                  label: 'التاريخ',
                  value: DateFormat('dd/MM/yyyy').format(booking.createdAt),
                ),
              ),
            ],
          ),
          if (booking.startDate != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _InfoItem(
                    icon: Icons.event,
                    label: 'تاريخ البداية',
                    value: DateFormat('dd/MM/yyyy').format(booking.startDate!),
                  ),
                ),
                if (booking.endDate != null)
                  Expanded(
                    child: _InfoItem(
                      icon: Icons.event_available,
                      label: 'تاريخ النهاية',
                      value: DateFormat('dd/MM/yyyy').format(booking.endDate!),
                    ),
                  ),
              ],
            ),
          ],
          if (booking.specialRequests != null &&
              booking.specialRequests!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'طلبات خاصة:',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[700],
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    booking.specialRequests!,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
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
