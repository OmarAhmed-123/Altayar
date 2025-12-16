import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/widgets/animated_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/reports/data/models/user_report.dart';
import 'package:altayar/features/reports/presentation/providers/user_report_provider.dart';

class UserReportPage extends StatefulWidget {
  const UserReportPage({super.key});

  @override
  State<UserReportPage> createState() => _UserReportPageState();
}

class _UserReportPageState extends State<UserReportPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<UserReportProvider>().loadReport();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<UserReportProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final data = provider.report;

    return Scaffold(
      appBar: AppBar(
        title: const Text('تقاريرى الشخصية'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: provider.isLoading ? null : provider.refresh,
            tooltip: 'تحديث البيانات',
          ),
          IconButton(
            icon: provider.isDownloading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.picture_as_pdf_outlined),
            onPressed: provider.isDownloading || provider.report == null
                ? null
                : () async {
                    await provider.downloadPdf();
                    if (!mounted) return;
                    if (provider.errorMessage != null) {
                      messenger.showSnackBar(
                        SnackBar(content: Text(provider.errorMessage!)),
                      );
                    } else {
                      messenger.showSnackBar(
                        const SnackBar(
                          content:
                              Text('تم بدء تحميل التقرير بصيغة PDF بنجاح.'),
                        ),
                      );
                    }
                  },
            tooltip: 'تحميل نسخة PDF الرسمية',
          ),
        ],
      ),
      body: provider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : data == null
              ? _ErrorState(message: provider.errorMessage)
              : RefreshIndicator(
                  onRefresh: provider.refresh,
                  child: CustomScrollView(
                    slivers: [
                      SliverPadding(
                        padding: const EdgeInsets.all(16),
                        sliver: SliverList.list(
                          children: [
                            _UserHeaderCard(data.user, data.membership),
                            const SizedBox(height: 16),
                            _StatsGrid(data.statistics),
                            const SizedBox(height: 16),
                            const _SectionLabel('أحدث الحجوزات'),
                            _BookingsList(data.bookings),
                            const SizedBox(height: 16),
                            const _SectionLabel('الرحلات'),
                            _TripsList(data.trips),
                            const SizedBox(height: 16),
                            const _SectionLabel('المعاملات المالية'),
                            _TransactionsList(data.transactions),
                            const SizedBox(height: 120),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.report_problem, size: 48, color: Colors.orange),
          const SizedBox(height: 12),
          Text(message ?? 'تعذّر تحميل التقرير حالياً.'),
        ],
      ),
    );
  }
}

class _UserHeaderCard extends StatelessWidget {
  const _UserHeaderCard(this.user, this.membership);

  final ReportUser user;
  final ReportMembership? membership;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.watch<AuthProvider>();
    final profilePictureUrl = auth.currentUser?.profilePictureUrl;

    return GlassCard(
      borderRadius: BorderRadius.circular(24),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor:
                      theme.colorScheme.primary.withAlpha((255 * .1).round()),
                  child: profilePictureUrl != null &&
                          profilePictureUrl.isNotEmpty
                      ? ClipOval(
                          child: Image.network(
                            profilePictureUrl,
                            width: 60,
                            height: 60,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Text(
                                user.name.isNotEmpty
                                    ? user.name.characters.first
                                    : '?',
                                style: theme.textTheme.titleLarge?.copyWith(
                                  color: theme.colorScheme.primary,
                                  fontWeight: FontWeight.bold,
                                ),
                              );
                            },
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return SizedBox(
                                width: 30,
                                height: 30,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    theme.colorScheme.primary,
                                  ),
                                  value: loadingProgress.expectedTotalBytes !=
                                          null
                                      ? loadingProgress.cumulativeBytesLoaded /
                                          loadingProgress.expectedTotalBytes!
                                      : null,
                                ),
                              );
                            },
                          ),
                        )
                      : Text(
                          user.name.isNotEmpty
                              ? user.name.characters.first
                              : '?',
                          style: theme.textTheme.titleLarge?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.name,
                        style: theme.textTheme.titleLarge,
                      ),
                      const SizedBox(height: 4),
                      Text(user.email, style: theme.textTheme.bodyMedium),
                      if (user.phone != null && user.phone!.isNotEmpty)
                        Text(
                          user.phone!,
                          style: theme.textTheme.bodySmall,
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                _InfoChip(
                  label: 'تاريخ الانضمام',
                  value: DateFormat.yMMMMd('ar').format(user.createdAt),
                ),
                _InfoChip(
                  label: 'الدور',
                  value: user.role == 'customer' ? 'عميل' : user.role,
                ),
                if (membership != null) ...[
                  _InfoChip(
                    label: 'العضوية',
                    value: membership!.type ?? 'غير محدد',
                  ),
                  _InfoChip(
                    label: 'حالة العضوية',
                    value: membership!.status ?? 'غير متاح',
                  ),
                  _InfoChip(
                    label: 'رصيد الكاش باك',
                    value: NumberFormat.decimalPattern('ar')
                        .format(membership!.cashbackBalance),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid(this.stats);

  final ReportStatistics stats;

  @override
  Widget build(BuildContext context) {
    final entries = [
      _StatEntry(
          'إجمالي الحجوزات', stats.totalBookings.toString(), Icons.event),
      _StatEntry('إجمالي الرحلات', stats.totalTrips.toString(),
          Icons.airplanemode_active),
      _StatEntry(
        'إجمالي المدفوع',
        NumberFormat.compactCurrency(
          locale: 'ar_EG',
          symbol: 'ج.م ',
        ).format(stats.totalSpent),
        Icons.payments,
      ),
      _StatEntry(
        'مدفوعات معلقة',
        NumberFormat.compactCurrency(
          locale: 'ar_EG',
          symbol: 'ج.م ',
        ).format(stats.pendingPayments),
        Icons.lock_clock,
      ),
    ];
    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      itemCount: entries.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 2.8,
      ),
      itemBuilder: (context, index) {
        final entry = entries[index];
        return AnimatedCard(
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary.withOpacity(0.05),
                  AppColors.primary.withOpacity(0.02),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: AppColors.primary.withOpacity(0.1),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: AppColors.primaryGradient,
                    ),
                  ),
                  child: Icon(
                    entry.icon,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        entry.label,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey[700],
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        entry.value,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.dark,
                                ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _StatEntry {
  _StatEntry(this.label, this.value, this.icon);

  final String label;
  final String value;
  final IconData icon;
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
    );
  }
}

class _BookingsList extends StatelessWidget {
  const _BookingsList(this.bookings);

  final List<ReportBooking> bookings;

  @override
  Widget build(BuildContext context) {
    if (bookings.isEmpty) {
      return const _EmptyState(message: 'لا توجد حجوزات بعد.');
    }
    return Column(
      children: bookings.take(5).map((booking) {
        return AnimatedCard(
          borderRadius: BorderRadius.circular(16),
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            contentPadding: const EdgeInsets.all(12),
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: AppColors.primaryGradient,
                ),
              ),
              child: const Icon(
                Icons.event_available,
                color: Colors.white,
                size: 20,
              ),
            ),
            title: Text(
              booking.packageName ?? 'حجز #${booking.id}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              booking.bookingDate ?? 'بدون تاريخ',
            ),
            trailing: Flexible(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Flexible(
                    child: Text(
                      NumberFormat.currency(locale: 'ar_EG', symbol: 'ج.م ')
                          .format(booking.totalAmount),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: AppColors.successGradient,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      booking.status ?? 'قيد المراجعة',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _TripsList extends StatelessWidget {
  const _TripsList(this.trips);

  final List<ReportTrip> trips;

  @override
  Widget build(BuildContext context) {
    if (trips.isEmpty) {
      return const _EmptyState(message: 'لا توجد رحلات مسجلة.');
    }
    return Column(
      children: trips.take(5).map((trip) {
        return AnimatedCard(
          borderRadius: BorderRadius.circular(16),
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            contentPadding: const EdgeInsets.all(12),
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: AppColors.successGradient,
                ),
              ),
              child: const Icon(
                Icons.map_outlined,
                color: Colors.white,
                size: 20,
              ),
            ),
            title: Text(
              trip.destination ?? 'رحلة',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              '${trip.startDate ?? '—'} → ${trip.endDate ?? '—'}',
            ),
            trailing: Container(
              constraints: const BoxConstraints(maxWidth: 100),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: AppColors.warningGradient,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                trip.status ?? 'قيد التنفيذ',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _TransactionsList extends StatelessWidget {
  const _TransactionsList(this.transactions);

  final List<ReportTransaction> transactions;

  @override
  Widget build(BuildContext context) {
    if (transactions.isEmpty) {
      return const _EmptyState(message: 'لا توجد معاملات بعد.');
    }
    return Column(
      children: transactions.take(6).map((tx) {
        final isDebit = tx.amount < 0;
        return AnimatedCard(
          borderRadius: BorderRadius.circular(16),
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            contentPadding: const EdgeInsets.all(12),
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: isDebit
                      ? AppColors.errorGradient
                      : AppColors.successGradient,
                ),
              ),
              child: Icon(
                isDebit ? Icons.arrow_outward : Icons.arrow_downward,
                color: Colors.white,
                size: 20,
              ),
            ),
            title: Text(tx.description ?? tx.type ?? 'عملية مالية'),
            subtitle: Text(tx.createdAt ?? ''),
            trailing: SizedBox(
              width: 100,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    NumberFormat.currency(
                      locale: 'ar_EG',
                      symbol: 'ج.م ',
                    ).format(tx.amount),
                    style: TextStyle(
                      color: isDebit ? Colors.red : Colors.green,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.end,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    tx.status ?? '—',
                    style: const TextStyle(fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.end,
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          const Icon(Icons.info_outline, size: 18),
          const SizedBox(width: 8),
          Expanded(child: Text(message)),
        ],
      ),
    );
  }
}
