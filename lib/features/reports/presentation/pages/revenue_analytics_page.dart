import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/reports/presentation/providers/revenue_analytics_provider.dart';
import 'package:altayar/features/reports/data/models/revenue_analytics.dart';
import 'package:altayar/features/reports/presentation/pages/users_bookings_memberships_analytics.dart';

class RevenueAnalyticsPage extends StatefulWidget {
  const RevenueAnalyticsPage({super.key});

  @override
  State<RevenueAnalyticsPage> createState() => _RevenueAnalyticsPageState();
}

class _RevenueAnalyticsPageState extends State<RevenueAnalyticsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RevenueAnalyticsProvider>().loadAnalytics();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<RevenueAnalyticsProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('تحليل الإيرادات الشامل'),
        actions: [
          PopupMenuButton<int>(
            icon: const Icon(Icons.filter_list),
            tooltip: 'اختر الفترة',
            onSelected: (value) {
              provider.setPeriod(value);
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 3, child: Text('آخر 3 أشهر')),
              const PopupMenuItem(value: 6, child: Text('آخر 6 أشهر')),
              const PopupMenuItem(value: 12, child: Text('آخر 12 شهر')),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => provider.loadAnalytics(refresh: true),
          ),
        ],
      ),
      body: provider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : provider.analytics == null
              ? Center(
                  child: Text(
                    provider.errorMessage ?? 'لا توجد بيانات',
                    style: const TextStyle(color: Colors.red),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => provider.loadAnalytics(refresh: true),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _SummaryCards(analytics: provider.analytics!),
                        const SizedBox(height: 20),
                        _RevenueByStatusChart(analytics: provider.analytics!),
                        const SizedBox(height: 20),
                        _RevenueByMethodChart(analytics: provider.analytics!),
                        const SizedBox(height: 20),
                        _MonthlyTrendChart(analytics: provider.analytics!),
                        const SizedBox(height: 20),
                        _DailyRevenueChart(analytics: provider.analytics!),
                        const SizedBox(height: 20),
                        _RevenueByTypeChart(analytics: provider.analytics!),
                        const SizedBox(height: 20),
                        UsersAnalyticsSection(analytics: provider.analytics!),
                        const SizedBox(height: 20),
                        BookingsAnalyticsSection(
                            analytics: provider.analytics!),
                        const SizedBox(height: 20),
                        MembershipsAnalyticsSection(
                            analytics: provider.analytics!),
                        const SizedBox(height: 20),
                        _TopUsersList(analytics: provider.analytics!),
                      ],
                    ),
                  ),
                ),
    );
  }
}

class _SummaryCards extends StatelessWidget {
  const _SummaryCards({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final summary = analytics.summary;
    return Row(
      children: [
        Expanded(
          child: _SummaryCard(
            title: 'إجمالي الإيرادات',
            value: summary.totalRevenue,
            color: AppColors.primary,
            icon: Icons.account_balance_wallet,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _SummaryCard(
            title: 'المدفوع',
            value: summary.paidRevenue,
            color: Colors.green,
            icon: Icons.check_circle,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _SummaryCard(
            title: 'المعلق',
            value: summary.pendingRevenue,
            color: Colors.orange,
            icon: Icons.pending,
          ),
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.title,
    required this.value,
    required this.color,
    required this.icon,
  });

  final String title;
  final double value;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color.withOpacity(0.2),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const Spacer(),
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              '${(value / 1000).toStringAsFixed(value >= 1000 ? 1 : 0)}${value >= 1000 ? 'K' : ''} EGP',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RevenueByStatusChart extends StatelessWidget {
  const _RevenueByStatusChart({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.byStatus;
    if (data.isEmpty) return const SizedBox.shrink();

    final total = data.fold<double>(0, (sum, item) => sum + item.total);
    final colors = [
      Colors.green, // completed/paid
      Colors.orange, // pending
      Colors.red, // failed
      Colors.grey, // refunded
      Colors.blue, // other
    ];

    return GlassCard(
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(colors: AppColors.primaryGradient),
                ),
                child:
                    const Icon(Icons.pie_chart, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'الإيرادات حسب الحالة',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'توزيع الإيرادات حسب حالة الدفع (مدفوع، معلق، فاشل، مسترد)',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 300,
            child: Row(
              children: [
                Expanded(
                  flex: 2,
                  child: PieChart(
                    PieChartData(
                      sections: data.asMap().entries.map((entry) {
                        final index = entry.key;
                        final item = entry.value;
                        final percentage = (item.total / total * 100);
                        return PieChartSectionData(
                          value: item.total,
                          title: '${percentage.toStringAsFixed(1)}%',
                          color: colors[index % colors.length],
                          radius: 80,
                          titleStyle: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        );
                      }).toList(),
                      sectionsSpace: 2,
                      centerSpaceRadius: 60,
                    ),
                  ),
                ),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: data.asMap().entries.map((entry) {
                      final index = entry.key;
                      final item = entry.value;
                      final statusLabels = {
                        'completed': 'مدفوع',
                        'pending': 'معلق',
                        'failed': 'فاشل',
                        'refunded': 'مسترد',
                      };
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            Container(
                              width: 16,
                              height: 16,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: colors[index % colors.length],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    statusLabels[item.status.toLowerCase()] ??
                                        item.status,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          fontWeight: FontWeight.w600,
                                        ),
                                  ),
                                  Text(
                                    '${(item.total / 1000).toStringAsFixed(1)}K EGP',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodySmall
                                        ?.copyWith(
                                          color: Colors.grey[600],
                                        ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RevenueByMethodChart extends StatelessWidget {
  const _RevenueByMethodChart({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.byMethod;
    if (data.isEmpty) return const SizedBox.shrink();

    final maxValue = data.map((e) => e.total).reduce((a, b) => a > b ? a : b);
    final colors = [
      Colors.blue,
      Colors.purple,
      Colors.teal,
      Colors.indigo,
      Colors.cyan,
    ];

    return GlassCard(
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(colors: AppColors.successGradient),
                ),
                child: const Icon(Icons.payment, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'الإيرادات حسب طريقة الدفع',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'توزيع الإيرادات حسب طرق الدفع المختلفة (بطاقة، تحويل، نقدي، إلخ)',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 250,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: maxValue * 1.2,
                barTouchData: BarTouchData(enabled: true),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index < 0 || index >= data.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            data[index].method,
                            style: const TextStyle(fontSize: 10),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      },
                      reservedSize: 40,
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 50,
                      getTitlesWidget: (value, meta) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Text(
                            '${(value / 1000).toStringAsFixed(value >= 1000 ? 1 : 0)}${value >= 1000 ? 'K' : ''}',
                            style: const TextStyle(fontSize: 10),
                          ),
                        );
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withOpacity(0.2),
                      strokeWidth: 1,
                    );
                  },
                ),
                borderData: FlBorderData(show: false),
                barGroups: data.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  return BarChartGroupData(
                    x: index,
                    barRods: [
                      BarChartRodData(
                        toY: item.total,
                        color: colors[index % colors.length],
                        width: 30,
                        borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(8)),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 8,
            children: data.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: colors[index % colors.length],
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${item.method}: ${(item.total / 1000).toStringAsFixed(1)}K',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _MonthlyTrendChart extends StatelessWidget {
  const _MonthlyTrendChart({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.monthlyTrend;
    if (data.isEmpty) return const SizedBox.shrink();

    final spots = data.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.total);
    }).toList();

    final maxValue = data.map((e) => e.total).reduce((a, b) => a > b ? a : b);

    return GlassCard(
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(colors: AppColors.warningGradient),
                ),
                child: const Icon(Icons.trending_up,
                    color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'الاتجاه الشهري للإيرادات',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'تطور الإيرادات على مدار الأشهر الماضية',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 250,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withOpacity(0.2),
                      strokeWidth: 1,
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index < 0 || index >= data.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            data[index].label,
                            style: const TextStyle(fontSize: 10),
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 50,
                      getTitlesWidget: (value, meta) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Text(
                            '${(value / 1000).toStringAsFixed(value >= 1000 ? 1 : 0)}${value >= 1000 ? 'K' : ''}',
                            style: const TextStyle(fontSize: 10),
                          ),
                        );
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                borderData: FlBorderData(show: true),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: AppColors.primary,
                    barWidth: 4,
                    dotData: FlDotData(show: true),
                    belowBarData: BarAreaData(
                      show: true,
                      color: AppColors.primary.withOpacity(0.1),
                    ),
                  ),
                ],
                minY: 0,
                maxY: maxValue * 1.2,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DailyRevenueChart extends StatelessWidget {
  const _DailyRevenueChart({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.dailyRevenue.take(30).toList();
    if (data.isEmpty) return const SizedBox.shrink();

    final spots = data.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.total);
    }).toList();

    final maxValue = data.map((e) => e.total).reduce((a, b) => a > b ? a : b);

    return GlassCard(
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(colors: AppColors.errorGradient),
                ),
                child: const Icon(Icons.calendar_today,
                    color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'الإيرادات اليومية (آخر 30 يوم)',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'تتبع الإيرادات على أساس يومي - Real-time',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 250,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withOpacity(0.2),
                      strokeWidth: 1,
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index < 0 ||
                            index >= data.length ||
                            index % 5 != 0) {
                          return const SizedBox.shrink();
                        }
                        final date = DateTime.tryParse(data[index].date);
                        if (date == null) return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            DateFormat('dd/MM').format(date),
                            style: const TextStyle(fontSize: 9),
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 50,
                      getTitlesWidget: (value, meta) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Text(
                            '${(value / 1000).toStringAsFixed(value >= 1000 ? 1 : 0)}${value >= 1000 ? 'K' : ''}',
                            style: const TextStyle(fontSize: 10),
                          ),
                        );
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                borderData: FlBorderData(show: true),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: Colors.orange,
                    barWidth: 3,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      color: Colors.orange.withOpacity(0.1),
                    ),
                  ),
                ],
                minY: 0,
                maxY: maxValue * 1.2,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RevenueByTypeChart extends StatelessWidget {
  const _RevenueByTypeChart({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.byType;
    if (data.isEmpty) return const SizedBox.shrink();

    final colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.teal,
    ];

    final typeLabels = {
      'booking_payment': 'حجوزات',
      'membership_purchase': 'عضويات',
      'cashback_earned': 'كاش باك',
      'points_spent': 'نقاط',
    };

    return GlassCard(
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient:
                      LinearGradient(colors: [Colors.purple, Colors.pink]),
                ),
                child:
                    const Icon(Icons.category, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'الإيرادات حسب نوع المعاملة',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'توزيع الإيرادات حسب أنواع المعاملات المختلفة',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 200,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: data.map((e) => e.total).reduce((a, b) => a > b ? a : b) *
                    1.2,
                barTouchData: BarTouchData(enabled: true),
                titlesData: FlTitlesData(
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index < 0 || index >= data.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            typeLabels[data[index].type] ?? data[index].type,
                            style: const TextStyle(fontSize: 10),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      },
                      reservedSize: 40,
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 50,
                      getTitlesWidget: (value, meta) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Text(
                            '${(value / 1000).toStringAsFixed(value >= 1000 ? 1 : 0)}${value >= 1000 ? 'K' : ''}',
                            style: const TextStyle(fontSize: 10),
                          ),
                        );
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withOpacity(0.2),
                      strokeWidth: 1,
                    );
                  },
                ),
                borderData: FlBorderData(show: false),
                barGroups: data.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  return BarChartGroupData(
                    x: index,
                    barRods: [
                      BarChartRodData(
                        toY: item.total,
                        color: colors[index % colors.length],
                        width: 40,
                        borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(8)),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TopUsersList extends StatelessWidget {
  const _TopUsersList({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.topUsers;
    if (data.isEmpty) return const SizedBox.shrink();

    return GlassCard(
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(colors: AppColors.primaryGradient),
                ),
                child: const Icon(Icons.people, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'أعلى 10 مستخدمين بالإيرادات',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'المستخدمون الأكثر إسهاماً في الإيرادات',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...data.asMap().entries.map((entry) {
            final index = entry.key;
            final user = entry.value;
            final rankColors = [
              Colors.amber,
              Colors.grey[400]!,
              Colors.brown[300]!,
            ];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: index < 3 ? rankColors[index] : Colors.grey[300],
                    ),
                    child: Center(
                      child: Text(
                        '${index + 1}',
                        style: TextStyle(
                          color: index < 3 ? Colors.white : Colors.black,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.userName,
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                        if (user.userEmail.isNotEmpty)
                          Text(
                            user.userEmail,
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: Colors.grey[600],
                                    ),
                          ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${(user.total / 1000).toStringAsFixed(1)}K EGP',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primary,
                                ),
                      ),
                      Text(
                        '${user.count} معاملة',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
