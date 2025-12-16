import 'package:flutter/material.dart';

import 'package:altayar/core/widgets/animated_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/reports/presentation/providers/reports_provider.dart';

class PaymentHistoryTable extends StatelessWidget {
  const PaymentHistoryTable({super.key, required this.provider});

  final ReportsProvider provider;

  @override
  Widget build(BuildContext context) {
    if (provider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    final records = provider.filteredHistory;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.search),
                    hintText: 'بحث باسم العميل',
                  ),
                  onChanged: provider.updateSearch,
                ),
              ),
              const SizedBox(width: 12),
              DropdownButton<String>(
                value: provider.typeFilter,
                hint: const Text('نوع العملية'),
                items: const [
                  DropdownMenuItem(
                      value: 'membership_purchase', child: Text('عضويات')),
                  DropdownMenuItem(
                      value: 'booking_payment', child: Text('حجوزات')),
                  DropdownMenuItem(
                      value: 'cashback_earned', child: Text('كاش باك')),
                  DropdownMenuItem(
                      value: 'points_spent', child: Text('صرف نقاط')),
                ],
                onChanged: provider.updateTypeFilter,
              ),
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: () => provider.loadHistory(refresh: true),
              ),
            ],
          ),
        ),
        Expanded(
          child: records.isEmpty
              ? const Center(child: Text('لا توجد معاملات مطابقة.'))
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: records.length,
                  itemBuilder: (context, index) {
                    final record = records[index];
                    return AnimatedCard(
                      borderRadius: BorderRadius.circular(16),
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        leading: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              colors: AppColors.primaryGradient,
                            ),
                          ),
                          child: Text(
                            record.userName.characters.first.toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        title: Text(
                          record.userName,
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.dark,
                                  ),
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'نوع العملية: ${record.type}',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              if (record.bookingId != null)
                                Text(
                                  'حجز رقم #${record.bookingId}',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              Text(
                                'التاريخ: ${record.createdAt.toLocal()}',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: AppColors.primaryGradient,
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${record.amount.toStringAsFixed(0)} EGP',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                record.status,
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.9),
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
