import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/dashboard/data/models/dashboard_stats.dart';
import 'package:altayar/features/dashboard/presentation/providers/dashboard_provider.dart';

class RevenueChart extends StatefulWidget {
  const RevenueChart({super.key, required this.stats});

  final DashboardStats stats;

  @override
  State<RevenueChart> createState() => _RevenueChartState();
}

class _RevenueChartState extends State<RevenueChart> {
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final spots = <FlSpot>[];
    double maxValue = 0;
    for (var i = 0; i < widget.stats.chartPoints.length; i++) {
      final value = widget.stats.chartPoints[i].value;
      spots.add(FlSpot(i.toDouble(), value));
      if (value > maxValue) maxValue = value;
    }

    // Add padding to max value for better visualization
    maxValue = maxValue * 1.2;
    if (maxValue == 0) maxValue = 1000;

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
                  gradient: LinearGradient(
                    colors: AppColors.primaryGradient,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.trending_up,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'أداء الإيرادات',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.dark,
                          ),
                    ),
                    Text(
                      'إجمالي إيرادات جميع المستخدمين',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ),
              ),
              PopupMenuButton<int>(
                icon: const Icon(Icons.filter_list),
                tooltip: 'اختر الفترة',
                onSelected: (value) async {
                  setState(() {
                    _isLoading = true;
                  });
                  try {
                    final provider = context.read<DashboardProvider>();
                    // CRITICAL: Reload dashboard with selected period to get real revenue data
                    await provider.loadDashboard(
                        refresh: true, chartMonths: value);
                  } catch (error) {
                    print('❌ [RevenueChart] Error loading chart: $error');
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                              'فشل تحميل بيانات الرسم البياني: ${error.toString()}'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  } finally {
                    if (mounted) {
                      setState(() => _isLoading = false);
                    }
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 3, child: Text('آخر 3 أشهر')),
                  const PopupMenuItem(value: 6, child: Text('آخر 6 أشهر')),
                  const PopupMenuItem(value: 12, child: Text('آخر 12 شهر')),
                ],
              ),
            ],
          ),
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(child: CircularProgressIndicator()),
            )
          else ...[
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
                        reservedSize: 50,
                        interval: maxValue / 5,
                        getTitlesWidget: (value, meta) {
                          if (value == 0) return const SizedBox.shrink();
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: Text(
                              '${(value / 1000).toStringAsFixed(value >= 1000 ? 1 : 0)}${value >= 1000 ? 'K' : ''}',
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey[700],
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 35,
                        getTitlesWidget: (value, meta) {
                          final index = value.toInt();
                          if (index < 0 ||
                              index >= widget.stats.chartPoints.length) {
                            return const SizedBox.shrink();
                          }
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              widget.stats.chartPoints[index].label,
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.grey[700],
                                fontWeight: FontWeight.w600,
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
                        color: AppColors.primary.withOpacity(0.4),
                        width: 2,
                      ),
                      bottom: BorderSide(
                        color: AppColors.primary.withOpacity(0.4),
                        width: 2,
                      ),
                      top: BorderSide.none,
                      right: BorderSide.none,
                    ),
                  ),
                  minY: 0,
                  maxY: maxValue,
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
                      shadow: Shadow(
                        color: AppColors.primary.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ),
                  ],
                  lineTouchData: LineTouchData(
                    touchTooltipData: LineTouchTooltipData(
                      getTooltipColor: (touchedSpot) => AppColors.primary,
                      tooltipRoundedRadius: 12,
                      tooltipPadding: const EdgeInsets.all(12),
                      tooltipBorder: BorderSide(
                        color: Colors.white.withOpacity(0.2),
                        width: 1,
                      ),
                    ),
                    handleBuiltInTouches: true,
                    getTouchLineStart: (data, index) => 0,
                    getTouchLineEnd: (data, index) => double.infinity,
                  ),
                ),
              ),
            ),
            if (widget.stats.chartPoints.isNotEmpty) ...[
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _StatIndicator(
                    label: 'أعلى قيمة',
                    value: maxValue.toStringAsFixed(0),
                    color: AppColors.primary,
                  ),
                  _StatIndicator(
                    label: 'متوسط',
                    value: (widget.stats.chartPoints
                                .map((p) => p.value)
                                .reduce((a, b) => a + b) /
                            widget.stats.chartPoints.length)
                        .toStringAsFixed(0),
                    color: Colors.orange,
                  ),
                  _StatIndicator(
                    label: 'إجمالي',
                    value: widget.stats.chartPoints
                        .map((p) => p.value)
                        .reduce((a, b) => a + b)
                        .toStringAsFixed(0),
                    color: Colors.green,
                  ),
                ],
              ),
            ],
          ],
        ],
      ),
    );
  }
}

class _StatIndicator extends StatelessWidget {
  const _StatIndicator({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
                fontSize: 10,
              ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
      ],
    );
  }
}
