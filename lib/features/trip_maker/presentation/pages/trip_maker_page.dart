import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/trip_maker/presentation/providers/trip_maker_provider.dart';
import 'package:altayar/features/trip_maker/presentation/widgets/trip_day_card.dart';

class TripMakerPage extends StatefulWidget {
  const TripMakerPage({super.key});

  @override
  State<TripMakerPage> createState() => _TripMakerPageState();
}

class _TripMakerPageState extends State<TripMakerPage> {
  final _titleController = TextEditingController(text: 'رحلة مخصصة');
  final _descController = TextEditingController(text: 'جدول سفر مبدئي');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<TripMakerProvider>();
      provider.updateTitle(_titleController.text);
      provider.updateDescription(_descController.text);
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<TripMakerProvider>();
    final plan = provider.plan;
    return Scaffold(
      appBar: AppBar(
        title: const Text('صانع الرحلات'),
        actions: [
          IconButton(
            onPressed: provider.addDay,
            icon: const Icon(Icons.add),
            tooltip: 'إضافة يوم',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            GlassCard(
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
                            gradient: LinearGradient(
                              colors: AppColors.primaryGradient,
                            ),
                          ),
                          child: const Icon(
                            Icons.flight_takeoff,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'معلومات الرحلة',
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.dark,
                                  ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _titleController,
                      decoration: const InputDecoration(
                        labelText: 'عنوان الرحلة',
                        border: OutlineInputBorder(),
                      ),
                      onChanged: provider.updateTitle,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _descController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'وصف مختصر',
                        border: OutlineInputBorder(),
                      ),
                      onChanged: provider.updateDescription,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            GlassCard(
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
                            gradient: LinearGradient(
                              colors: AppColors.successGradient,
                            ),
                          ),
                          child: const Icon(
                            Icons.calendar_today,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'تواريخ الرحلة',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.dark,
                                  ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () async {
                              final selected = await showDatePicker(
                                context: context,
                                initialDate: plan.startDate,
                                firstDate: DateTime.now()
                                    .subtract(const Duration(days: 30)),
                                lastDate: DateTime.now()
                                    .add(const Duration(days: 400)),
                              );
                              if (selected != null) {
                                provider.updateDates(selected, plan.endDate);
                              }
                            },
                            icon: const Icon(Icons.calendar_month),
                            label: Text(
                              'البداية: ${plan.startDate.toString().split(' ').first}',
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () async {
                              final selected = await showDatePicker(
                                context: context,
                                initialDate: plan.endDate,
                                firstDate: plan.startDate,
                                lastDate: DateTime.now()
                                    .add(const Duration(days: 400)),
                              );
                              if (selected != null) {
                                provider.updateDates(plan.startDate, selected);
                              }
                            },
                            icon: const Icon(Icons.calendar_today),
                            label: Text(
                              'النهاية: ${plan.endDate.toString().split(' ').first}',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            GlassCard(
              borderRadius: BorderRadius.circular(20),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: AppColors.warningGradient,
                        ),
                      ),
                      child: const Icon(
                        Icons.map,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'الجدول التفاعلي',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.dark,
                          ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            ...plan.days.asMap().entries.map(
              (entry) {
                final index = entry.key;
                final day = entry.value;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: TripDayCard(
                    plan: day,
                    onDestinationChanged: (value) => provider.updateDay(
                      index,
                      destination: value,
                    ),
                    onHotelChanged: (value) => provider.updateDay(
                      index,
                      hotel: value,
                    ),
                    onTransportChanged: (value) => provider.updateDay(
                      index,
                      transport: value,
                    ),
                    onActivitiesChanged: (list) => provider.updateDay(
                      index,
                      dayActivities: list,
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 20),
            if (provider.errorMessage != null) ...[
              GlassCard(
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: AppColors.errorGradient,
                          ),
                        ),
                        child: const Icon(
                          Icons.error_outline,
                          color: Colors.white,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          provider.errorMessage!,
                          style: const TextStyle(
                            color: AppColors.error,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
            Row(
              children: [
                Expanded(
                  child: GradientButton(
                    label: 'حفظ كمسودة',
                    icon: Icons.save_outlined,
                    onPressed: provider.isSaving
                        ? null
                        : () async {
                            final success = await provider.saveDraft();
                            if (!mounted) return;
                            if (success) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('تم حفظ الرحلة كمسودة'),
                                ),
                              );
                            }
                          },
                    isBusy: provider.isSaving,
                    colors: AppColors.warningGradient,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GradientButton(
                    label: 'إرسال للإدارة',
                    icon: Icons.send,
                    onPressed: provider.isSaving
                        ? null
                        : () async {
                            final success = await provider.submitForQuote();
                            if (!mounted) return;
                            if (success) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('تم إرسال الرحلة للتسعير'),
                                ),
                              );
                            }
                          },
                    isBusy: provider.isSaving,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
