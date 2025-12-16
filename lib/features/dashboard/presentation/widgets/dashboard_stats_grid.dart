import 'package:flutter/material.dart';

import 'package:altayar/core/widgets/animated_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/dashboard/data/models/dashboard_stats.dart';
import 'package:altayar/features/user_management/presentation/pages/add_user_page.dart';
import 'package:altayar/features/reports/presentation/pages/revenue_analytics_page.dart';

class DashboardStatsGrid extends StatelessWidget {
  const DashboardStatsGrid({
    super.key,
    required this.stats,
    this.onStatTap,
  });

  final DashboardStats stats;
  final void Function(int routeIndex)? onStatTap;

  @override
  Widget build(BuildContext context) {
    final items = [
      _StatItem(
        label: 'المستخدمون',
        value: stats.totalUsers.toString(),
        icon: Icons.people_alt,
      ),
      _StatItem(
        label: 'الإيراد الشهري',
        value: '${stats.monthlyRevenue.toStringAsFixed(0)} EGP',
        icon: Icons.paid,
      ),
      _StatItem(
        label: 'العضويات النشطة',
        value: stats.activeMemberships.toString(),
        icon: Icons.workspace_premium,
      ),
      _StatItem(
        label: 'حجوزات معلّقة',
        value: stats.pendingBookings.toString(),
        icon: Icons.pending_actions,
      ),
    ];
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisExtent: 140, // Increased height to prevent overflow
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) => _StatCard(
        item: items[index],
        onTap: onStatTap != null
            ? () =>
                _StatCard._showStatDetails(context, items[index], onStatTap!)
            : null,
      ),
    );
  }
}

class _StatItem {
  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.item, this.onTap});

  final _StatItem item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final gradients = [
      AppColors.primaryGradient,
      AppColors.successGradient,
      AppColors.warningGradient,
      AppColors.errorGradient,
    ];
    final gradientIndex = [
      Icons.people_alt,
      Icons.paid,
      Icons.workspace_premium,
      Icons.pending_actions,
    ].indexOf(item.icon);

    final gradient = gradientIndex >= 0 && gradientIndex < gradients.length
        ? gradients[gradientIndex]
        : AppColors.primaryGradient;

    return AnimatedCard(
      borderRadius: BorderRadius.circular(24),
      margin: EdgeInsets.zero,
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: gradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: gradient.first.withValues(alpha: 0.4),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon container - fixed size
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.25),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.3),
                  width: 1.5,
                ),
              ),
              child: Icon(item.icon, color: Colors.white, size: 20),
            ),
            const SizedBox(height: 8),
            // Value text - flexible with proper overflow handling
            Flexible(
              child: Text(
                item.value,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                  height: 1.1,
                  shadows: [
                    Shadow(
                      color: Colors.black.withValues(alpha: 0.5),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                softWrap: false,
              ),
            ),
            const SizedBox(height: 4),
            // Label text - flexible with proper overflow handling
            Flexible(
              child: Text(
                item.label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                  height: 1.2,
                  shadows: [
                    Shadow(
                      color: Colors.black.withValues(alpha: 0.4),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  static void _showStatDetails(
    BuildContext context,
    _StatItem item,
    void Function(int) onNavigate,
  ) {
    final actions = _getStatActions(item.icon);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _StatDetailsSheet(
        item: item,
        actions: actions,
        onNavigate: onNavigate,
      ),
    );
  }

  static List<_StatAction> _getStatActions(IconData icon) {
    switch (icon) {
      case Icons.people_alt:
        return [
          const _StatAction(
            icon: Icons.person_add,
            label: 'إضافة مستخدم جديد',
            route: 2, // User Management
            isAddUser: true,
          ),
          const _StatAction(
            icon: Icons.people_outline,
            label: 'عرض جميع المستخدمين',
            route: 2,
          ),
          const _StatAction(
            icon: Icons.analytics,
            label: 'إحصائيات المستخدمين',
            route: 10, // Reports
            isRevenueAnalytics: true,
          ),
        ];
      case Icons.paid:
        return [
          const _StatAction(
            icon: Icons.receipt_long,
            label: 'عرض التقارير المالية',
            route: 10,
          ),
          const _StatAction(
            icon: Icons.trending_up,
            label: 'تحليل الإيرادات',
            route: 10,
            isRevenueAnalysis: true,
          ),
          const _StatAction(
            icon: Icons.account_balance_wallet,
            label: 'المحاسبة والمحفظة',
            route: 4, // Accounting
          ),
        ];
      case Icons.workspace_premium:
        return [
          const _StatAction(
            icon: Icons.workspace_premium_outlined,
            label: 'إدارة العضويات',
            route: 1,
          ),
          const _StatAction(
            icon: Icons.add_card,
            label: 'إنشاء عضوية جديدة',
            route: 1,
          ),
          const _StatAction(
            icon: Icons.analytics,
            label: 'إحصائيات العضويات',
            route: 10,
          ),
        ];
      case Icons.pending_actions:
        return [
          const _StatAction(
            icon: Icons.event_available_outlined,
            label: 'عرض جميع الحجوزات',
            route: 3,
          ),
          const _StatAction(
            icon: Icons.pending,
            label: 'الحجوزات المعلقة',
            route: 3,
          ),
          const _StatAction(
            icon: Icons.check_circle,
            label: 'إدارة الحجوزات',
            route: 3,
          ),
        ];
      default:
        return [];
    }
  }
}

class _StatAction {
  const _StatAction({
    required this.icon,
    required this.label,
    required this.route,
    this.isAddUser = false,
    this.isRevenueAnalysis = false,
    this.isRevenueAnalytics = false,
  });

  final IconData icon;
  final String label;
  final int route;
  final bool isAddUser;
  final bool isRevenueAnalysis;
  final bool isRevenueAnalytics;
}

class _StatDetailsSheet extends StatelessWidget {
  const _StatDetailsSheet({
    required this.item,
    required this.actions,
    required this.onNavigate,
  });

  final _StatItem item;
  final List<_StatAction> actions;
  final void Function(int) onNavigate;

  @override
  Widget build(BuildContext context) {
    final gradients = [
      AppColors.primaryGradient,
      AppColors.successGradient,
      AppColors.warningGradient,
      AppColors.errorGradient,
    ];
    final gradientIndex = [
      Icons.people_alt,
      Icons.paid,
      Icons.workspace_premium,
      Icons.pending_actions,
    ].indexOf(item.icon);

    final gradient = gradientIndex >= 0 && gradientIndex < gradients.length
        ? gradients[gradientIndex]
        : AppColors.primaryGradient;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            gradient.first.withValues(alpha: 0.1),
            gradient.last.withValues(alpha: 0.05),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[400],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(colors: gradient),
                        ),
                        child: Icon(item.icon, color: Colors.white, size: 28),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.label,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.dark,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              item.value,
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: gradient.first,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'الإجراءات المتاحة',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppColors.dark,
                        ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
            Expanded(
              child: ListView.separated(
                controller: scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 24),
                itemCount: actions.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final action = actions[index];
                  return AnimatedCard(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () {
                      Navigator.pop(context);
                      if (action.isAddUser) {
                        // Navigate to user management first, then open add user page
                        onNavigate(action.route);
                        // Wait a bit for navigation, then open add user page
                        Future.delayed(const Duration(milliseconds: 300), () {
                          if (context.mounted) {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => const AddUserPage(),
                              ),
                            );
                          }
                        });
                      } else if (action.isRevenueAnalysis ||
                          action.isRevenueAnalytics) {
                        // Navigate to revenue analytics page
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const RevenueAnalyticsPage(),
                          ),
                        );
                      } else {
                        onNavigate(action.route);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            gradient.first.withValues(alpha: 0.1),
                            gradient.last.withValues(alpha: 0.05),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: gradient.first.withValues(alpha: 0.2),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(colors: gradient),
                            ),
                            child: Icon(
                              action.icon,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(
                              action.label,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.dark,
                                  ),
                            ),
                          ),
                          Icon(
                            Icons.arrow_forward_ios,
                            size: 16,
                            color: gradient.first,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
