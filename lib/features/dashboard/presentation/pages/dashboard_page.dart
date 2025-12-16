import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/localization/localized_text.dart';
import 'package:altayar/core/localization/locale_provider.dart';
import 'package:altayar/features/dashboard/presentation/providers/dashboard_provider.dart';
import 'package:altayar/features/dashboard/presentation/widgets/activity_timeline.dart';
import 'package:altayar/features/dashboard/presentation/widgets/dashboard_stats_grid.dart';
import 'package:altayar/features/frontend/presentation/widgets/frontend_pages.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key, required this.onNavigate});

  final void Function(int index) onNavigate;

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage>
    with SingleTickerProviderStateMixin {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardProvider>().loadDashboard();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DashboardProvider>();
    final localeProvider = context.watch<LocaleProvider>();
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const LocalizedText(
            ar: 'لوحة التحكم',
            en: 'Dashboard',
          ),
          actions: [
            IconButton(
              onPressed: () => localeProvider.toggleLocale(),
              icon: const Icon(Icons.language),
            ),
          ],
          bottom: TabBar(
            tabs: [
              Tab(text: context.trans(ar: 'نظرة عامة', en: 'Overview')),
              Tab(text: context.trans(ar: 'واجهة الموقع', en: 'Frontend')),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            provider.isLoading
                ? const Center(child: CircularProgressIndicator())
                : _OverviewTab(
                    provider: provider,
                    onNavigate: widget.onNavigate,
                  ),
            const FrontendPages(),
          ],
        ),
      ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  const _OverviewTab({
    required this.provider,
    required this.onNavigate,
  });

  final DashboardProvider provider;
  final void Function(int index) onNavigate;

  @override
  Widget build(BuildContext context) {
    final stats = provider.stats;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (stats != null)
            DashboardStatsGrid(
              stats: stats,
              onStatTap: onNavigate,
            ),
          const SizedBox(height: 16),
          _ShortcutGrid(onNavigate: onNavigate),
          const SizedBox(height: 16),
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    context.trans(ar: 'آخر النشاطات', en: 'Recent Activity'),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  ActivityTimeline(activities: provider.activities),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ShortcutGrid extends StatelessWidget {
  const _ShortcutGrid({required this.onNavigate});

  final void Function(int index) onNavigate;

  @override
  Widget build(BuildContext context) {
    final shortcuts = [
      const _ShortcutItem(
        icon: Icons.workspace_premium,
        ar: 'العضويات',
        en: 'Memberships',
        index: 1,
      ),
      const _ShortcutItem(
        icon: Icons.admin_panel_settings,
        ar: 'الصلاحيات',
        en: 'RBAC',
        index: 2,
      ),
      const _ShortcutItem(
        icon: Icons.event_available,
        ar: 'الحجوزات',
        en: 'Bookings',
        index: 3,
      ),
      const _ShortcutItem(
        icon: Icons.card_travel,
        ar: 'الباقات',
        en: 'Packages',
        index: 12,
      ),
      const _ShortcutItem(
        icon: Icons.receipt_long,
        ar: 'التقارير',
        en: 'Reports',
        index: 10,
      ),
      const _ShortcutItem(
        icon: Icons.campaign,
        ar: 'الإعلانات',
        en: 'Ads',
        index: 7,
      ),
    ];
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisExtent: 110,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: shortcuts.length,
      itemBuilder: (context, index) {
        final item = shortcuts[index];
        return GestureDetector(
          onTap: () => onNavigate(item.index),
          child: Container(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(20),
            ),
            padding: const EdgeInsets.all(12),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(item.icon),
                const SizedBox(height: 8),
                LocalizedText(
                  ar: item.ar,
                  en: item.en,
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ShortcutItem {
  const _ShortcutItem({
    required this.icon,
    required this.ar,
    required this.en,
    required this.index,
  });

  final IconData icon;
  final String ar;
  final String en;
  final int index;
}
