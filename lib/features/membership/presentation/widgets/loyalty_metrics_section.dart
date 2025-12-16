import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:altayar/features/accounting/presentation/providers/accounting_provider.dart';

class LoyaltyMetricsSection extends StatelessWidget {
  const LoyaltyMetricsSection({
    super.key,
    required this.pointsBalance,
    required this.cashback,
    this.chartData,
  });

  final int pointsBalance;
  final double cashback;
  final List<Map<String, dynamic>>? chartData;

  @override
  Widget build(BuildContext context) {
    final accountingProvider = context.watch<AccountingProvider>();
    final wallet = accountingProvider.wallet;

    // Use real data if available, otherwise use provided data
    final realPoints = wallet?.pointsBalance ?? pointsBalance;
    final realCashback = wallet?.cashbackBalance ?? cashback;

    // Generate chart spots from real data or provided chartData
    List<FlSpot> chartSpots = [];
    double maxY = (realPoints * 1.2).clamp(200, 2000).toDouble();

    if (chartData != null && chartData!.isNotEmpty) {
      // Use real chart data from analytics
      chartSpots = chartData!.asMap().entries.map((entry) {
        final index = entry.key.toDouble();
        final data = entry.value;
        final value = (data['earned'] as num? ?? 0).toDouble() +
            (data['spent'] as num? ?? 0).toDouble();
        maxY = maxY > value ? maxY : value * 1.2;
        return FlSpot(index, value);
      }).toList();
    } else {
      // Generate spots from points balance (fallback)
      chartSpots = List.generate(
        7,
        (index) => FlSpot(
          index.toDouble(),
          (realPoints * (0.5 + index / 10)),
        ),
      );
    }

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      elevation: 8,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.blue.shade50,
              Colors.purple.shade50,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.blue.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.blue.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.analytics,
                      color: Colors.blue,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'لوحة التحليلات الذكية',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                height: 200,
                child: LineChart(
                  LineChartData(
                    titlesData: FlTitlesData(
                      leftTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 40,
                          getTitlesWidget: (value, meta) {
                            return Text(
                              value.toInt().toString(),
                              style: const TextStyle(fontSize: 10),
                            );
                          },
                        ),
                      ),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 30,
                          getTitlesWidget: (value, meta) {
                            if (chartData != null &&
                                value.toInt() < chartData!.length) {
                              final month =
                                  chartData![value.toInt()]['month'] ?? '';
                              return Text(
                                month,
                                style: const TextStyle(fontSize: 10),
                              );
                            }
                            return const Text('');
                          },
                        ),
                      ),
                      rightTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false),
                      ),
                      topTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false),
                      ),
                    ),
                    gridData: FlGridData(
                      show: true,
                      drawVerticalLine: false,
                      horizontalInterval: maxY / 5,
                      getDrawingHorizontalLine: (value) {
                        return FlLine(
                          color: Colors.grey.withOpacity(0.2),
                          strokeWidth: 1,
                        );
                      },
                    ),
                    borderData: FlBorderData(
                      show: true,
                      border: Border(
                        bottom: BorderSide(color: Colors.grey.withOpacity(0.3)),
                        left: BorderSide(color: Colors.grey.withOpacity(0.3)),
                      ),
                    ),
                    minX: 0,
                    maxX: (chartSpots.length - 1).toDouble(),
                    minY: 0,
                    maxY: maxY,
                    lineBarsData: [
                      LineChartBarData(
                        isCurved: true,
                        color: Colors.blue,
                        barWidth: 4,
                        dotData: FlDotData(
                          show: true,
                          getDotPainter: (spot, percent, barData, index) {
                            return FlDotCirclePainter(
                              radius: 4,
                              color: Colors.blue,
                              strokeWidth: 2,
                              strokeColor: Colors.white,
                            );
                          },
                        ),
                        spots: chartSpots,
                        belowBarData: BarAreaData(
                          show: true,
                          gradient: LinearGradient(
                            colors: [
                              Colors.blue.withOpacity(0.3),
                              Colors.blue.withOpacity(0.05),
                            ],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _MetricTile(
                    label: 'النقاط',
                    value: '$realPoints',
                    icon: Icons.stars,
                    color: Colors.amber,
                  ),
                  _MetricTile(
                    label: 'الكاش باك',
                    value: '${realCashback.toStringAsFixed(2)} EGP',
                    icon: Icons.account_balance_wallet,
                    color: Colors.green,
                  ),
                  _MetricTile(
                    label: 'إجمالي المعاملات',
                    value: '${accountingProvider.transactions.length}',
                    icon: Icons.payments,
                    color: Colors.red,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    this.icon,
    this.color,
  });

  final String label;
  final String value;
  final IconData? icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (icon != null)
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: (color ?? Colors.blue).withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: color ?? Colors.blue,
              size: 20,
            ),
          ),
        if (icon != null) const SizedBox(height: 8),
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
              ),
        ),
      ],
    );
  }
}
