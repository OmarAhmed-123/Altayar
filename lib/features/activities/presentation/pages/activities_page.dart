import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher_string.dart';

import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/core/utils/url_builder.dart';
import 'package:altayar/core/utils/date_formatter.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/booking/data/models/booking.dart';
import 'package:altayar/features/booking/presentation/providers/booking_provider.dart';
import 'package:altayar/features/accounting/presentation/providers/accounting_provider.dart';
import 'package:altayar/features/accounting/data/models/transaction_model.dart';
import 'package:altayar/features/vouchers/presentation/providers/voucher_provider.dart';
import 'package:altayar/features/membership/presentation/providers/membership_card_provider.dart';
import 'package:altayar/features/auth/presentation/widgets/server_config_sheet.dart';

class ActivitiesPage extends StatefulWidget {
  const ActivitiesPage({super.key});

  @override
  State<ActivitiesPage> createState() => _ActivitiesPageState();
}

class _ActivitiesPageState extends State<ActivitiesPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  ActivityTimeFilter _selectedFilter = ActivityTimeFilter.all;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _animationController.forward();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAllData();
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _loadAllData() async {
    final bookingProvider = context.read<BookingProvider>();
    final accountingProvider = context.read<AccountingProvider>();
    final voucherProvider = context.read<VoucherProvider>();
    final membershipProvider = context.read<MembershipCardProvider>();

    await Future.wait([
      bookingProvider.loadData(refresh: true),
      accountingProvider.loadAll(refresh: true),
      voucherProvider.loadData(refresh: true),
      membershipProvider.loadCard(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final bookingProvider = context.watch<BookingProvider>();
    final accountingProvider = context.watch<AccountingProvider>();
    final voucherProvider = context.watch<VoucherProvider>();

    final allActivities = _getAllActivities(
      bookingProvider,
      accountingProvider,
      voucherProvider,
    );

    final filteredActivities =
        _filterActivities(allActivities, _selectedFilter);
    final groupedActivities = _groupByDate(filteredActivities);

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: AppColors.primaryGradient,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.history,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text('سجل الأنشطة'),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => _loadAllData(),
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterChips(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _loadAllData(),
              color: AppColors.primary,
              child: filteredActivities.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.all(16),
                      itemCount: groupedActivities.length,
                      itemBuilder: (context, index) {
                        final entry =
                            groupedActivities.entries.elementAt(index);
                        return _DateGroupSection(
                          date: entry.key,
                          activities: entry.value,
                          animationController: _animationController,
                          index: index,
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    return Container(
      height: 70,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        children: ActivityTimeFilter.values.map((filter) {
          final isSelected = _selectedFilter == filter;
          return Padding(
            padding: const EdgeInsets.only(left: 8),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOutCubic,
              decoration: BoxDecoration(
                gradient: isSelected
                    ? LinearGradient(colors: AppColors.primaryGradient)
                    : null,
                color: isSelected ? null : Colors.grey.shade50,
                borderRadius: BorderRadius.circular(25),
                border: Border.all(
                  color: isSelected ? Colors.transparent : Colors.grey.shade300,
                  width: isSelected ? 0 : 1.5,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.4),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                          spreadRadius: 1,
                        ),
                      ]
                    : [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 5,
                          offset: const Offset(0, 2),
                        ),
                      ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    setState(() {
                      _selectedFilter = filter;
                    });
                  },
                  borderRadius: BorderRadius.circular(25),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    child: Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (isSelected) ...[
                            const Icon(
                              Icons.check_circle,
                              color: Colors.white,
                              size: 18,
                            ),
                            const SizedBox(width: 6),
                          ],
                          Text(
                            _getFilterLabel(filter),
                            style: TextStyle(
                              color:
                                  isSelected ? Colors.white : Colors.grey[700],
                              fontWeight: isSelected
                                  ? FontWeight.bold
                                  : FontWeight.w600,
                              fontSize: 14,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.0, end: 1.0),
            duration: const Duration(milliseconds: 600),
            curve: Curves.elasticOut,
            builder: (context, value, child) {
              return Transform.scale(
                scale: value,
                child: child,
              );
            },
            child: Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    AppColors.primaryGradient.first.withOpacity(0.1),
                    AppColors.primaryGradient.last.withOpacity(0.05),
                  ],
                ),
              ),
              child: Icon(
                Icons.history,
                size: 80,
                color: AppColors.primaryGradient.first.withOpacity(0.5),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'لا توجد أنشطة في الفترة المحددة',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'سيتم عرض جميع أنشطتك هنا عند توفرها',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[500],
                ),
          ),
        ],
      ),
    );
  }

  List<ActivityItem> _getAllActivities(
    BookingProvider bookingProvider,
    AccountingProvider accountingProvider,
    VoucherProvider voucherProvider,
  ) {
    final activities = <ActivityItem>[];

    try {
      // Add bookings
      for (final booking in bookingProvider.myBookings) {
        try {
          final bookingDescription = booking.details != null
              ? booking.details!.toString()
              : (booking.specialRequests ?? '');
          activities.add(ActivityItem(
            type: ActivityType.booking,
            title: _getBookingTitle(booking),
            description: bookingDescription,
            date: booking.startDate ?? booking.createdAt,
            status: booking.status.name,
            data: booking,
            icon: Icons.event,
            color: _getStatusColor(booking.status),
          ));
        } catch (e) {
          // Skip invalid bookings
          continue;
        }
      }
    } catch (e) {
      // Handle error silently
    }

    try {
      // Add transactions
      for (final transaction in accountingProvider.transactions) {
        try {
          activities.add(ActivityItem(
            type: ActivityType.transaction,
            title: transaction.readableType,
            description: transaction.description ?? '',
            date: transaction.createdAt,
            status: transaction.status,
            data: transaction,
            icon: _getTransactionIcon(transaction.type),
            color: transaction.isPositive ? Colors.green : Colors.red,
          ));
        } catch (e) {
          // Skip invalid transactions
          continue;
        }
      }
    } catch (e) {
      // Handle error silently
    }

    try {
      // Add vouchers
      for (final voucher in voucherProvider.myVouchers) {
        try {
          final status = voucher.status.toLowerCase();
          activities.add(ActivityItem(
            type: ActivityType.voucher,
            title: 'قسيمة ${voucher.type}',
            description: voucher.description ?? '',
            date: voucher.createdAt,
            status: status,
            data: voucher,
            icon: Icons.card_giftcard,
            color: status == 'active' ? Colors.purple : Colors.grey,
          ));
        } catch (e) {
          // Skip invalid vouchers
          continue;
        }
      }
    } catch (e) {
      // Handle error silently
    }

    return activities;
  }

  List<ActivityItem> _filterActivities(
    List<ActivityItem> activities,
    ActivityTimeFilter filter,
  ) {
    final now = DateTime.now();
    return activities.where((activity) {
      final diff = now.difference(activity.date).inDays;
      switch (filter) {
        case ActivityTimeFilter.today:
          return now.day == activity.date.day &&
              now.month == activity.date.month &&
              now.year == activity.date.year;
        case ActivityTimeFilter.week:
          return diff <= 7;
        case ActivityTimeFilter.month:
          return diff <= 30;
        case ActivityTimeFilter.all:
          return true;
      }
    }).toList()
      ..sort((a, b) => b.date.compareTo(a.date));
  }

  Map<String, List<ActivityItem>> _groupByDate(List<ActivityItem> activities) {
    final grouped = <String, List<ActivityItem>>{};
    final today = DateTime.now();
    final yesterday = today.subtract(const Duration(days: 1));

    for (final activity in activities) {
      String key;
      try {
        if (activity.date.year == today.year &&
            activity.date.month == today.month &&
            activity.date.day == today.day) {
          key = 'اليوم';
        } else if (activity.date.year == yesterday.year &&
            activity.date.month == yesterday.month &&
            activity.date.day == yesterday.day) {
          key = 'أمس';
        } else {
          // Use the date directly without parsing to avoid FormatException
          key = DateFormat('EEEE، d MMMM yyyy', 'ar').format(activity.date);
        }
      } catch (e) {
        // Fallback to simple date format if locale formatting fails
        try {
          key = DateFormat('yyyy-MM-dd').format(activity.date);
        } catch (_) {
          // Last resort: use ISO string
          key = activity.date.toIso8601String().split('T')[0];
        }
      }

      grouped.putIfAbsent(key, () => []).add(activity);
    }

    return grouped;
  }

  String _getBookingTitle(BookingModel booking) {
    switch (booking.category) {
      case BookingCategory.tour:
        return 'حجز رحلة';
      case BookingCategory.nileCruise:
        return 'حجز رحلة نيلية';
      case BookingCategory.flightTicket:
        return 'حجز تذكرة طيران';
      case BookingCategory.hotelBooking:
        return 'حجز فندق';
      case BookingCategory.transfer:
        return 'حجز نقل';
      case BookingCategory.nileTrip:
        return 'رحلة نيلية';
      case BookingCategory.generalTour:
        return 'رحلة عامة';
      case BookingCategory.customRequest:
        return 'طلب مخصص';
    }
  }

  Color _getStatusColor(BookingStatus status) {
    switch (status) {
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

  IconData _getTransactionIcon(TransactionType type) {
    switch (type) {
      case TransactionType.membershipPurchase:
        return Icons.card_membership;
      case TransactionType.bookingPayment:
        return Icons.event;
      case TransactionType.cashbackEarned:
        return Icons.account_balance_wallet;
      case TransactionType.pointsSpent:
        return Icons.stars;
      case TransactionType.manualDeposit:
        return Icons.account_balance;
      case TransactionType.invoicePayment:
        return Icons.receipt;
    }
  }

  String _getFilterLabel(ActivityTimeFilter filter) {
    switch (filter) {
      case ActivityTimeFilter.all:
        return 'الكل';
      case ActivityTimeFilter.today:
        return 'اليوم';
      case ActivityTimeFilter.week:
        return 'آخر أسبوع';
      case ActivityTimeFilter.month:
        return 'آخر شهر';
    }
  }
}

class _DateGroupSection extends StatelessWidget {
  const _DateGroupSection({
    required this.date,
    required this.activities,
    required this.animationController,
    required this.index,
  });

  final String date;
  final List<ActivityItem> activities;
  final AnimationController animationController;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 20,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: AppColors.primaryGradient,
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                date,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.dark,
                    ),
              ),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryGradient.first.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${activities.length}',
                  style: TextStyle(
                    color: AppColors.primaryGradient.first,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ),
        ...activities.asMap().entries.map((entry) {
          final activityIndex = entry.key;
          final activity = entry.value;
          return TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.0, end: 1.0),
            duration: Duration(milliseconds: 300 + (activityIndex * 50)),
            curve: Curves.easeOut,
            builder: (context, value, child) {
              return Opacity(
                opacity: value,
                child: Transform.translate(
                  offset: Offset(0, 20 * (1 - value)),
                  child: child,
                ),
              );
            },
            child: _ActivityCard(activity: activity),
          );
        }),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _ActivityCard extends StatelessWidget {
  const _ActivityCard({required this.activity});

  final ActivityItem activity;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _handleTap(context),
          borderRadius: BorderRadius.circular(24),
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.white,
                  activity.color.withOpacity(0.03),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: activity.color.withOpacity(0.15),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: activity.color.withOpacity(0.1),
                  blurRadius: 15,
                  offset: const Offset(0, 5),
                  spreadRadius: 0,
                ),
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [
                          activity.color,
                          activity.color.withOpacity(0.8),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: activity.color.withOpacity(0.4),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                    child: Icon(
                      activity.icon,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                activity.title,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.dark,
                                      fontSize: 16,
                                    ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    activity.color.withOpacity(0.2),
                                    activity.color.withOpacity(0.1),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: activity.color.withOpacity(0.3),
                                  width: 1,
                                ),
                              ),
                              child: Text(
                                _getStatusLabel(activity.status),
                                style: TextStyle(
                                  color: activity.color,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (activity.description.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Text(
                            activity.description,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: Colors.grey[700],
                                  height: 1.4,
                                ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Icon(
                                Icons.access_time,
                                size: 14,
                                color: Colors.grey[700],
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              DateFormat('hh:mm a', 'ar').format(activity.date),
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: Colors.grey[700],
                                    fontWeight: FontWeight.w500,
                                  ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.chevron_left,
                      color: Colors.grey[600],
                      size: 20,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _handleTap(BuildContext context) {
    switch (activity.type) {
      case ActivityType.booking:
        _showBookingDetails(context, activity.data as BookingModel);
        break;
      case ActivityType.transaction:
        // Show transaction details if needed
        break;
      case ActivityType.voucher:
        // Show voucher details if needed
        break;
    }
  }

  void _showBookingDetails(BuildContext context, BookingModel booking) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'تفاصيل الحجز',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _DetailRow('رقم الحجز', '#${booking.id}'),
            _DetailRow('الحالة', _getStatusLabel(booking.status.name)),
            _DetailRow('التاريخ',
                DateFormatter.format(booking.startDate ?? booking.createdAt)),
            if (booking.totalPrice > 0)
              _DetailRow(
                  'المبلغ', '${booking.totalPrice.toStringAsFixed(2)} EGP'),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _openInvoice(context, booking.id),
                icon: const Icon(Icons.picture_as_pdf),
                label: const Text('تحميل الفاتورة'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openInvoice(BuildContext context, int bookingId) async {
    final api = context.read<ApiClient>();
    final token = api.authToken;
    if (token == null) return;
    final url = UrlBuilder.resolveMedia(
      '/api/files/invoice/$bookingId?token=${Uri.encodeComponent(token)}&ts=${DateTime.now().millisecondsSinceEpoch}',
    );
    try {
      final opened =
          await launchUrlString(url, mode: LaunchMode.externalApplication);
      if (!opened && context.mounted) {
        _showInvoiceError(context);
      }
    } catch (_) {
      if (context.mounted) {
        _showInvoiceError(context);
      }
    }
  }

  void _showInvoiceError(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text(
          'تعذّر فتح رابط الفاتورة. تأكد من أن عنوان الخادم صحيح أو قم بتعديله.',
        ),
        action: SnackBarAction(
          label: 'إعدادات الخادم',
          onPressed: () {
            showModalBottomSheet<void>(
              context: context,
              builder: (_) => const ServerConfigSheet(),
            );
          },
        ),
      ),
    );
  }

  String _getStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'قيد المراجعة';
      case 'confirmed':
        return 'تم التأكيد';
      case 'paid':
        return 'مدفوع';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'تم الإلغاء';
      case 'active':
        return 'نشط';
      case 'redeemed':
        return 'مستخدم';
      case 'expired':
        return 'منتهي';
      default:
        return status;
    }
  }

  Widget _DetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

enum ActivityType {
  booking,
  transaction,
  voucher,
}

class ActivityItem {
  ActivityItem({
    required this.type,
    required this.title,
    required this.description,
    required this.date,
    required this.status,
    required this.data,
    required this.icon,
    required this.color,
  });

  final ActivityType type;
  final String title;
  final String description;
  final DateTime date;
  final String status;
  final dynamic data;
  final IconData icon;
  final Color color;
}
