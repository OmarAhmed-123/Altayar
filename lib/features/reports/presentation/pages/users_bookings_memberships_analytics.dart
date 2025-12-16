import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/reports/data/models/revenue_analytics.dart';

// Users Analytics Section
class UsersAnalyticsSection extends StatelessWidget {
  const UsersAnalyticsSection({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'تحليل إحصائيات المستخدمين',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.dark,
              ),
        ),
        const SizedBox(height: 16),
        UsersSummaryCard(analytics: analytics),
        const SizedBox(height: 16),
        UsersByRoleChart(analytics: analytics),
        const SizedBox(height: 16),
        UsersByMonthChart(analytics: analytics),
      ],
    );
  }
}

class UsersSummaryCard extends StatelessWidget {
  const UsersSummaryCard({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final summary = analytics.users.summary;
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
                      'ملخص المستخدمين',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'نظرة عامة على إحصائيات المستخدمين خلال الفترة المحددة',
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
          Row(
            children: [
              Expanded(
                child: StatItem(
                  label: 'إجمالي المستخدمين',
                  value: summary.total.toString(),
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StatItem(
                  label: 'مع عضوية',
                  value: summary.withMembership.toString(),
                  color: Colors.green,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: StatItem(
                  label: 'بدون عضوية',
                  value: summary.withoutMembership.toString(),
                  color: Colors.orange,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StatItem(
                  label: 'نشط',
                  value: summary.active.toString(),
                  color: Colors.blue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: StatItem(
                  label: 'غير نشط',
                  value: summary.inactive.toString(),
                  color: Colors.grey,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StatItem(
                  label: 'محظور',
                  value: summary.banned.toString(),
                  color: Colors.red,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class StatItem extends StatelessWidget {
  const StatItem({
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

class UsersByRoleChart extends StatelessWidget {
  const UsersByRoleChart({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.users.byRole;
    if (data.isEmpty) return const SizedBox.shrink();

    final total = data.fold<int>(0, (sum, item) => sum + item.count);
    final colors = [
      AppColors.primary,
      Colors.green,
      Colors.orange,
      Colors.blue,
      Colors.purple,
      Colors.red,
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
                      'المستخدمون حسب الدور',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'توزيع المستخدمين حسب الأدوار المختلفة (عميل، مسؤول، محاسب، إلخ)',
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
                        final percentage = (item.count / total * 100);
                        return PieChartSectionData(
                          value: item.count.toDouble(),
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
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            Container(
                              width: 16,
                              height: 16,
                              decoration: BoxDecoration(
                                color: colors[index % colors.length],
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                item.role,
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ),
                            Text(
                              '${item.count}',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
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

class UsersByMonthChart extends StatelessWidget {
  const UsersByMonthChart({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.users.byMonth;
    if (data.isEmpty) return const SizedBox.shrink();

    final spots = data.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.count.toDouble());
    }).toList();

    final maxValue = data.map((e) => e.count).reduce((a, b) => a > b ? a : b);

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
                child: const Icon(Icons.trending_up,
                    color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'اتجاه تسجيل المستخدمين الشهري',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'يعرض هذا الرسم البياني عدد المستخدمين الجدد المسجلين كل شهر',
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
            height: 280,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxValue / 5,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withOpacity(0.15),
                      strokeWidth: 1,
                      dashArray: [8, 4],
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Text(
                            value.toInt().toString(),
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
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
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(
                  show: true,
                  border: Border(
                    left: BorderSide(
                      color: AppColors.primary.withOpacity(0.3),
                      width: 2,
                    ),
                    bottom: BorderSide(
                      color: AppColors.primary.withOpacity(0.3),
                      width: 2,
                    ),
                    top: BorderSide.none,
                    right: BorderSide.none,
                  ),
                ),
                minX: 0,
                maxX: (data.length - 1).toDouble(),
                minY: 0,
                maxY: maxValue * 1.2,
                lineBarsData: [
                  LineChartBarData(
                    isCurved: true,
                    curveSmoothness: 0.4,
                    barWidth: 5,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 6,
                          color: Colors.white,
                          strokeWidth: 4,
                          strokeColor: AppColors.primary,
                        );
                      },
                    ),
                    color: AppColors.primary,
                    spots: spots,
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary.withOpacity(0.4),
                          AppColors.primary.withOpacity(0.1),
                          Colors.transparent,
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        stops: const [0.0, 0.5, 1.0],
                      ),
                    ),
                  ),
                ],
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipItems: (touchedSpots) {
                      return touchedSpots.map((LineBarSpot touchedSpot) {
                        final flSpot = touchedSpot;
                        final index = flSpot.x.toInt();
                        if (index < 0 || index >= data.length) {
                          return null;
                        }
                        final point = data[index];
                        return LineTooltipItem(
                          '${point.label}\n${point.count} مستخدم',
                          const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        );
                      }).toList();
                    },
                    tooltipRoundedRadius: 12,
                    tooltipPadding: const EdgeInsets.all(12),
                    tooltipMargin: 8,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Bookings Analytics Section
class BookingsAnalyticsSection extends StatelessWidget {
  const BookingsAnalyticsSection({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'تحليل إحصائيات الحجوزات',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.dark,
              ),
        ),
        const SizedBox(height: 16),
        BookingsByStatusChart(analytics: analytics),
        const SizedBox(height: 16),
        BookingsByTypeChart(analytics: analytics),
        const SizedBox(height: 16),
        BookingsByMonthChart(analytics: analytics),
        const SizedBox(height: 16),
        BookingsDailyChart(analytics: analytics),
      ],
    );
  }
}

class BookingsByStatusChart extends StatelessWidget {
  const BookingsByStatusChart({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.bookings.byStatus;
    if (data.isEmpty) return const SizedBox.shrink();

    final total = data.fold<int>(0, (sum, item) => sum + item.count);
    final colors = [
      Colors.green, // completed
      Colors.orange, // pending
      Colors.red, // cancelled
      Colors.blue, // confirmed
      Colors.grey, // other
    ];

    final statusLabels = {
      'completed': 'مكتمل',
      'pending': 'معلق',
      'cancelled': 'ملغي',
      'confirmed': 'مؤكد',
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
                      'الحجوزات حسب الحالة',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'توزيع الحجوزات حسب حالة الحجز (مكتمل، معلق، ملغي، مؤكد)',
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
                        final percentage = (item.count / total * 100);
                        return PieChartSectionData(
                          value: item.count.toDouble(),
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
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            Container(
                              width: 16,
                              height: 16,
                              decoration: BoxDecoration(
                                color: colors[index % colors.length],
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                statusLabels[item.status.toLowerCase()] ??
                                    item.status,
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ),
                            Text(
                              '${item.count}',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
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

class BookingsByTypeChart extends StatelessWidget {
  const BookingsByTypeChart({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.bookings.byType;
    if (data.isEmpty) return const SizedBox.shrink();

    final total = data.fold<int>(0, (sum, item) => sum + item.count);
    final colors = [
      AppColors.primary,
      Colors.green,
      Colors.orange,
      Colors.blue,
      Colors.purple,
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
                      'الحجوزات حسب النوع',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'توزيع الحجوزات حسب نوع الحجز (جولة، طيران، فندق، إلخ)',
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
                        final percentage = (item.count / total * 100);
                        return PieChartSectionData(
                          value: item.count.toDouble(),
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
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            Container(
                              width: 16,
                              height: 16,
                              decoration: BoxDecoration(
                                color: colors[index % colors.length],
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                item.type,
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ),
                            Text(
                              '${item.count}',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
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

class BookingsByMonthChart extends StatelessWidget {
  const BookingsByMonthChart({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.bookings.byMonth;
    if (data.isEmpty) return const SizedBox.shrink();

    final spots = data.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.count.toDouble());
    }).toList();

    final maxValue = data.map((e) => e.count).reduce((a, b) => a > b ? a : b);

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
                child: const Icon(Icons.trending_up,
                    color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'اتجاه الحجوزات الشهري',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'يعرض هذا الرسم البياني عدد الحجوزات كل شهر',
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
            height: 280,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxValue / 5,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withOpacity(0.15),
                      strokeWidth: 1,
                      dashArray: [8, 4],
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Text(
                            value.toInt().toString(),
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
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
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(
                  show: true,
                  border: Border(
                    left: BorderSide(
                      color: AppColors.primary.withOpacity(0.3),
                      width: 2,
                    ),
                    bottom: BorderSide(
                      color: AppColors.primary.withOpacity(0.3),
                      width: 2,
                    ),
                    top: BorderSide.none,
                    right: BorderSide.none,
                  ),
                ),
                minX: 0,
                maxX: (data.length - 1).toDouble(),
                minY: 0,
                maxY: maxValue * 1.2,
                lineBarsData: [
                  LineChartBarData(
                    isCurved: true,
                    curveSmoothness: 0.4,
                    barWidth: 5,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 6,
                          color: Colors.white,
                          strokeWidth: 4,
                          strokeColor: AppColors.primary,
                        );
                      },
                    ),
                    color: AppColors.primary,
                    spots: spots,
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary.withOpacity(0.4),
                          AppColors.primary.withOpacity(0.1),
                          Colors.transparent,
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        stops: const [0.0, 0.5, 1.0],
                      ),
                    ),
                  ),
                ],
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipItems: (touchedSpots) {
                      return touchedSpots.map((LineBarSpot touchedSpot) {
                        final flSpot = touchedSpot;
                        final index = flSpot.x.toInt();
                        if (index < 0 || index >= data.length) {
                          return null;
                        }
                        final point = data[index];
                        return LineTooltipItem(
                          '${point.label}\n${point.count} حجز',
                          const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        );
                      }).toList();
                    },
                    tooltipRoundedRadius: 12,
                    tooltipPadding: const EdgeInsets.all(12),
                    tooltipMargin: 8,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class BookingsDailyChart extends StatelessWidget {
  const BookingsDailyChart({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.bookings.daily.take(30).toList();
    if (data.isEmpty) return const SizedBox.shrink();

    final spots = data.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.count.toDouble());
    }).toList();

    final maxValue = data.map((e) => e.count).reduce((a, b) => a > b ? a : b);

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
                child: const Icon(Icons.calendar_today,
                    color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'الحجوزات اليومية (آخر 30 يوم)',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'يعرض هذا الرسم البياني عدد الحجوزات اليومية لآخر 30 يومًا',
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
            height: 280,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxValue / 5,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withOpacity(0.15),
                      strokeWidth: 1,
                      dashArray: [8, 4],
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Text(
                            value.toInt().toString(),
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index < 0 || index >= data.length) {
                          return const SizedBox.shrink();
                        }
                        final date = DateTime.parse(data[index].date);
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            DateFormat('dd/MM').format(date),
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(
                  show: true,
                  border: Border(
                    left: BorderSide(
                      color: AppColors.primary.withOpacity(0.3),
                      width: 2,
                    ),
                    bottom: BorderSide(
                      color: AppColors.primary.withOpacity(0.3),
                      width: 2,
                    ),
                    top: BorderSide.none,
                    right: BorderSide.none,
                  ),
                ),
                minX: 0,
                maxX: (data.length - 1).toDouble(),
                minY: 0,
                maxY: maxValue * 1.2,
                lineBarsData: [
                  LineChartBarData(
                    isCurved: true,
                    curveSmoothness: 0.4,
                    barWidth: 5,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 6,
                          color: Colors.white,
                          strokeWidth: 4,
                          strokeColor: AppColors.primary,
                        );
                      },
                    ),
                    color: AppColors.primary,
                    spots: spots,
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary.withOpacity(0.4),
                          AppColors.primary.withOpacity(0.1),
                          Colors.transparent,
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        stops: const [0.0, 0.5, 1.0],
                      ),
                    ),
                  ),
                ],
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipItems: (touchedSpots) {
                      return touchedSpots.map((LineBarSpot touchedSpot) {
                        final flSpot = touchedSpot;
                        final index = flSpot.x.toInt();
                        if (index < 0 || index >= data.length) {
                          return null;
                        }
                        final point = data[index];
                        final date = DateTime.parse(point.date);
                        return LineTooltipItem(
                          '${DateFormat('dd MMM').format(date)}\n${point.count} حجز',
                          const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        );
                      }).toList();
                    },
                    tooltipRoundedRadius: 12,
                    tooltipPadding: const EdgeInsets.all(12),
                    tooltipMargin: 8,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Memberships Analytics Section
class MembershipsAnalyticsSection extends StatelessWidget {
  const MembershipsAnalyticsSection({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'تحليل إحصائيات العضويات',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.dark,
              ),
        ),
        const SizedBox(height: 16),
        MembershipsSummaryCard(analytics: analytics),
        const SizedBox(height: 16),
        MembershipsByTierChart(analytics: analytics),
        const SizedBox(height: 16),
        MembershipsByStatusChart(analytics: analytics),
        const SizedBox(height: 16),
        MembershipsByMonthChart(analytics: analytics),
      ],
    );
  }
}

class MembershipsSummaryCard extends StatelessWidget {
  const MembershipsSummaryCard({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final summary = analytics.memberships.summary;
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
                child: const Icon(Icons.workspace_premium,
                    color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ملخص العضويات',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'نظرة عامة على إحصائيات العضويات خلال الفترة المحددة',
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
          Row(
            children: [
              Expanded(
                child: StatItem(
                  label: 'إجمالي العضويات',
                  value: summary.total.toString(),
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StatItem(
                  label: 'نشطة',
                  value: summary.active.toString(),
                  color: Colors.green,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StatItem(
                  label: 'منتهية',
                  value: summary.expired.toString(),
                  color: Colors.red,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class MembershipsByTierChart extends StatelessWidget {
  const MembershipsByTierChart({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.memberships.byTier;
    if (data.isEmpty) return const SizedBox.shrink();

    final total = data.fold<int>(0, (sum, item) => sum + item.count);
    final colors = [
      Colors.amber,
      Colors.grey[400]!,
      Colors.brown[300]!,
      Colors.blue,
      Colors.purple,
      Colors.green,
    ];

    final tierLabels = {
      'silver': 'فضي',
      'gold': 'ذهبي',
      'platinum': 'بلاتيني',
      'diamond': 'ماسي',
      'business': 'أعمال',
      'premium': 'مميز',
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
                      'العضويات حسب المستوى',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'توزيع العضويات حسب المستوى (فضي، ذهبي، بلاتيني، إلخ)',
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
                        final percentage = (item.count / total * 100);
                        return PieChartSectionData(
                          value: item.count.toDouble(),
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
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            Container(
                              width: 16,
                              height: 16,
                              decoration: BoxDecoration(
                                color: colors[index % colors.length],
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                tierLabels[item.tier.toLowerCase()] ??
                                    item.tier,
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ),
                            Text(
                              '${item.count}',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
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

class MembershipsByStatusChart extends StatelessWidget {
  const MembershipsByStatusChart({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.memberships.byStatus;
    if (data.isEmpty) return const SizedBox.shrink();

    final total = data.fold<int>(0, (sum, item) => sum + item.count);
    final colors = [
      Colors.green, // active
      Colors.red, // expired
      Colors.orange, // pending
      Colors.grey, // cancelled
    ];

    final statusLabels = {
      'active': 'نشط',
      'expired': 'منتهي',
      'pending': 'معلق',
      'cancelled': 'ملغي',
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
                      'العضويات حسب الحالة',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'توزيع العضويات حسب الحالة (نشط، منتهي، معلق، ملغي)',
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
                        final percentage = (item.count / total * 100);
                        return PieChartSectionData(
                          value: item.count.toDouble(),
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
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            Container(
                              width: 16,
                              height: 16,
                              decoration: BoxDecoration(
                                color: colors[index % colors.length],
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                statusLabels[item.status.toLowerCase()] ??
                                    item.status,
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ),
                            Text(
                              '${item.count}',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
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

class MembershipsByMonthChart extends StatelessWidget {
  const MembershipsByMonthChart({required this.analytics});

  final RevenueAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final data = analytics.memberships.byMonth;
    if (data.isEmpty) return const SizedBox.shrink();

    final spots = data.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.count.toDouble());
    }).toList();

    final maxValue = data.map((e) => e.count).reduce((a, b) => a > b ? a : b);

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
                child: const Icon(Icons.trending_up,
                    color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'اتجاه العضويات الشهري',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'يعرض هذا الرسم البياني عدد العضويات الجديدة كل شهر',
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
            height: 280,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxValue / 5,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withOpacity(0.15),
                      strokeWidth: 1,
                      dashArray: [8, 4],
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Text(
                            value.toInt().toString(),
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
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
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(
                  show: true,
                  border: Border(
                    left: BorderSide(
                      color: AppColors.primary.withOpacity(0.3),
                      width: 2,
                    ),
                    bottom: BorderSide(
                      color: AppColors.primary.withOpacity(0.3),
                      width: 2,
                    ),
                    top: BorderSide.none,
                    right: BorderSide.none,
                  ),
                ),
                minX: 0,
                maxX: (data.length - 1).toDouble(),
                minY: 0,
                maxY: maxValue * 1.2,
                lineBarsData: [
                  LineChartBarData(
                    isCurved: true,
                    curveSmoothness: 0.4,
                    barWidth: 5,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 6,
                          color: Colors.white,
                          strokeWidth: 4,
                          strokeColor: AppColors.primary,
                        );
                      },
                    ),
                    color: AppColors.primary,
                    spots: spots,
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary.withOpacity(0.4),
                          AppColors.primary.withOpacity(0.1),
                          Colors.transparent,
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        stops: const [0.0, 0.5, 1.0],
                      ),
                    ),
                  ),
                ],
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipItems: (touchedSpots) {
                      return touchedSpots.map((LineBarSpot touchedSpot) {
                        final flSpot = touchedSpot;
                        final index = flSpot.x.toInt();
                        if (index < 0 || index >= data.length) {
                          return null;
                        }
                        final point = data[index];
                        return LineTooltipItem(
                          '${point.label}\n${point.count} عضوية',
                          const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        );
                      }).toList();
                    },
                    tooltipRoundedRadius: 12,
                    tooltipPadding: const EdgeInsets.all(12),
                    tooltipMargin: 8,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
