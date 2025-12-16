import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher_string.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:altayar/core/utils/url_builder.dart';
import 'package:altayar/core/widgets/loading_indicator.dart';
import 'package:altayar/core/widgets/state_message.dart';
import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/membership/data/models/membership_card.dart';
import 'package:altayar/features/membership/data/models/referral_summary.dart';
import 'package:altayar/features/membership/presentation/providers/membership_card_provider.dart';
import 'package:altayar/features/membership/presentation/providers/membership_provider.dart';
import 'package:altayar/features/membership/presentation/providers/referral_provider.dart';
import 'package:altayar/features/membership/presentation/widgets/loyalty_metrics_section.dart';
import 'package:altayar/features/membership/presentation/widgets/membership_card_widget.dart';
import 'package:altayar/features/membership/presentation/widgets/membership_checkout_sheet.dart';
import 'package:altayar/features/membership/presentation/widgets/membership_plan_card.dart';
import 'package:altayar/features/membership/presentation/widgets/membership_pdf_viewer_sheet.dart';
import 'package:altayar/features/membership/presentation/widgets/referral_card.dart';
import 'package:altayar/features/accounting/presentation/providers/accounting_provider.dart';
import 'package:altayar/features/membership/presentation/providers/membership_analytics_provider.dart';
import 'package:altayar/features/membership/data/models/membership_plan.dart';
import 'package:altayar/features/membership/presentation/pages/membership_bookings_page.dart';
import 'package:altayar/features/membership/presentation/pages/add_edit_membership_page.dart';

class MembershipDashboardPage extends StatefulWidget {
  const MembershipDashboardPage({super.key});

  @override
  State<MembershipDashboardPage> createState() =>
      _MembershipDashboardPageState();
}

class _MembershipDashboardPageState extends State<MembershipDashboardPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final membershipProvider = context.read<MembershipProvider>();
      final cardProvider = context.read<MembershipCardProvider>();
      final referralProvider = context.read<ReferralProvider>();
      final accountingProvider = context.read<AccountingProvider>();
      final analyticsProvider = context.read<MembershipAnalyticsProvider>();

      membershipProvider.fetchPlans();
      cardProvider.loadCard();
      referralProvider.loadSummary();
      accountingProvider.loadAll();
      analyticsProvider.loadAnalytics();
    });
  }

  static void _showPlanDetails(
    BuildContext context,
    MembershipPlan plan,
    MembershipProvider provider,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(24),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SingleChildScrollView(
            controller: scrollController,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: AppColors.primaryGradient,
                        ),
                        borderRadius: BorderRadius.all(Radius.circular(16)),
                      ),
                      child: const Icon(
                        Icons.workspace_premium,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            plan.name,
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          Text(
                            'باقة ${plan.tier}',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: Colors.grey[600],
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                _InfoRow(
                  icon: Icons.calendar_today,
                  label: 'المدة',
                  value: '${plan.durationDays ~/ 30} شهر',
                ),
                const SizedBox(height: 12),
                _InfoRow(
                  icon: Icons.stars,
                  label: 'النقاط الترحيبية',
                  value: '${plan.points} نقطة',
                ),
                const SizedBox(height: 12),
                _InfoRow(
                  icon: Icons.account_balance_wallet,
                  label: 'الكاش باك الترحيبي',
                  value: '${plan.welcomeCashback.toStringAsFixed(0)} EGP',
                ),
                const SizedBox(height: 12),
                _InfoRow(
                  icon: Icons.trending_up,
                  label: 'مضاعف النقاط',
                  value: '${plan.pointMultiplier}x',
                ),
                const Divider(height: 32),
                // PDF Review and Download Buttons
                if (plan.pdfViewUrl != null || plan.pdfUrl != null) ...[
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => MembershipPdfViewerSheet(
                            plan: plan,
                            onSubscribe: () {
                              Navigator.pop(context);
                              provider.selectPlan(plan);
                              // Call static _showPaymentDialog from _PlansSectionState
                              _PlansSectionState._showPaymentDialog(
                                  context, provider);
                            },
                          ),
                        );
                      },
                      icon: const Icon(Icons.picture_as_pdf),
                      label: const Text('مراجعة ملف PDF'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 16,
                        ),
                        side: const BorderSide(
                            color: AppColors.primary, width: 2),
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.all(Radius.circular(12)),
                        ),
                      ),
                    ),
                  ),
                  // Download PDF Button
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final pdfUrl = plan.pdfDownloadUrl ??
                            plan.pdfUrl ??
                            plan.pdfViewUrl;
                        if (pdfUrl != null) {
                          try {
                            final uri = Uri.parse(pdfUrl);
                            if (await canLaunchUrl(uri)) {
                              await launchUrl(
                                uri,
                                mode: LaunchMode.externalApplication,
                              );
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('جاري تحميل ملف PDF...'),
                                    backgroundColor: Colors.blue,
                                  ),
                                );
                              }
                            }
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('فشل تحميل ملف PDF: $e'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                            }
                          }
                        } else {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                    'لا يوجد رابط تحميل PDF متاح لهذه الباقة.'),
                                backgroundColor: Colors.orange,
                              ),
                            );
                          }
                        }
                      },
                      icon: const Icon(Icons.download),
                      label: const Text('تنزيل ملف PDF'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 16,
                        ),
                        side: const BorderSide(
                            color: AppColors.secondary, width: 2),
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.all(Radius.circular(12)),
                        ),
                      ),
                    ),
                  ),
                ],
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'السعر الإجمالي',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      '${plan.price.toStringAsFixed(2)} EGP',
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                GradientButton(
                  label: 'الدفع عبر فواتيرك',
                  icon: Icons.payments,
                  isBusy: provider.isSubscribing,
                  onPressed: () {
                    Navigator.pop(context);
                    provider.selectPlan(plan);
                    // Call static _showPaymentDialog from _PlansSectionState
                    _PlansSectionState._showPaymentDialog(context, provider);
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.watch<AuthProvider>();
    final isAdmin = (auth.currentUser?.isSuperAdmin ?? false) ||
        (auth.currentUser?.role == 'admin');
    final authToken = auth.currentUser?.token;
    return Scaffold(
      appBar: AppBar(
        title: const Text('نظام العضويات والولاء'),
        actions: [
          IconButton(
            onPressed: () {
              final membershipProvider = context.read<MembershipProvider>();
              final cardProvider = context.read<MembershipCardProvider>();
              final referralProvider = context.read<ReferralProvider>();
              membershipProvider.fetchPlans(refresh: true);
              cardProvider.loadCard();
              referralProvider.loadSummary();
            },
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          final membershipProvider = context.read<MembershipProvider>();
          final cardProvider = context.read<MembershipCardProvider>();
          final referralProvider = context.read<ReferralProvider>();
          await Future.wait([
            membershipProvider.fetchPlans(refresh: true),
            cardProvider.loadCard(),
            referralProvider.loadSummary(),
          ]);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          children: [
            _CardSection(theme: theme, authToken: authToken),
            const SizedBox(height: 16),
            Builder(
              builder: (context) => _TierStrip(
                onPlanSelected: (ctx, plan, provider) {
                  // Call _showPlanDetails from _MembershipDashboardPageState
                  _MembershipDashboardPageState._showPlanDetails(
                      ctx, plan, provider);
                },
              ),
            ),
            const SizedBox(height: 20),
            _PlansSection(theme: theme, isAdmin: isAdmin),
            const SizedBox(height: 20),
            _ReferralSection(theme: theme),
          ],
        ),
      ),
    );
  }
}

class _CardSection extends StatelessWidget {
  const _CardSection({required this.theme, required this.authToken});

  final ThemeData theme;
  final String? authToken;

  @override
  Widget build(BuildContext context) {
    return Consumer<MembershipCardProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const LoadingIndicator(message: 'جاري تجهيز بطاقة الولاء');
        }
        if (provider.errorMessage != null) {
          return StateMessage(
            icon: Icons.error_outline,
            title: 'تعذّر تحميل البطاقة',
            subtitle: provider.errorMessage,
            action: FilledButton(
              onPressed: provider.loadCard,
              child: const Text('إعادة المحاولة'),
            ),
          );
        }
        final MembershipCard? card = provider.card;
        if (card == null || !card.hasMembership) {
          return GlassCard(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: AppColors.primaryGradient,
                    ),
                  ),
                  child: const Icon(
                    Icons.workspace_premium_outlined,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'لم تقم بالاشتراك بعد',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.dark,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'انضم الآن لأي باقة لتفعيل بطاقة العضوية الرقمية والحصول على مميزات حصرية.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[700],
                  ),
                ),
              ],
            ),
          );
        }
        return Column(
          children: [
            MembershipCardWidget(
              card: card,
              onDownloadPdf: authToken == null
                  ? null
                  : () => _openSecureUrl(
                        '/api/files/membership-card',
                        authToken!,
                      ),
            ),
            const SizedBox(height: 16),
            Consumer<MembershipAnalyticsProvider>(
              builder: (context, analyticsProvider, _) {
                return LoyaltyMetricsSection(
                  pointsBalance: card.pointsBalance,
                  cashback: card.cashbackBalance,
                  chartData: analyticsProvider.chartData,
                );
              },
            ),
          ],
        );
      },
    );
  }

  Future<void> _openSecureUrl(String path, String token) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final secured = UrlBuilder.resolveMedia(
      '$path?token=${Uri.encodeComponent(token)}&download=1&t=$timestamp',
    );
    await launchUrlString(secured, mode: LaunchMode.externalApplication);
  }
}

class _PlansSection extends StatefulWidget {
  const _PlansSection({required this.theme, required this.isAdmin});

  final ThemeData theme;
  final bool isAdmin;

  @override
  State<_PlansSection> createState() => _PlansSectionState();
}

class _PlansSectionState extends State<_PlansSection> {
  @override
  Widget build(BuildContext context) {
    return Consumer<MembershipProvider>(
      builder: (context, provider, _) {
        if (provider.status == MembershipStatus.loading) {
          return const LoadingIndicator(message: 'جاري تحميل الباقات');
        }
        if (provider.status == MembershipStatus.error) {
          return StateMessage(
            icon: Icons.cloud_off,
            title: 'لا يمكن تحميل الباقات',
            subtitle: provider.errorMessage,
            action: FilledButton(
              onPressed: provider.fetchPlans,
              child: const Text('إعادة المحاولة'),
            ),
          );
        }
        if (provider.plans.isEmpty) {
          return StateMessage(
            icon: Icons.workspace_premium_outlined,
            title: 'لا توجد باقات متاحة حالياً',
            subtitle: 'تواصل مع الدعم لإضافة باقات العضوية.',
            action: FilledButton(
              onPressed: provider.fetchPlans,
              child: const Text('تحديث'),
            ),
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('اختر الباقة المناسبة لك',
                style: widget.theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            // Display all membership plans in a scrollable grid
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: MediaQuery.of(context).size.width > 600 ? 2 : 1,
                childAspectRatio: 0.75,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: provider.plans.length,
              itemBuilder: (context, index) {
                final plan = provider.plans[index];
                return TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0.0, end: 1.0),
                  duration: Duration(milliseconds: 300 + (index * 100)),
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
                  child: MembershipPlanCard(
                    plan: plan,
                    isAdmin: widget.isAdmin,
                    isSelected: provider.selectedPlan == plan,
                    onTap: () => provider.selectPlan(plan),
                    onEdit: widget.isAdmin
                        ? () => _PlansSectionState._showEditDialog(
                              context,
                              plan,
                              provider,
                            )
                        : null,
                    onDelete: widget.isAdmin
                        ? () => _PlansSectionState._showDeleteDialog(
                              context,
                              plan,
                              provider,
                            )
                        : null,
                    onViewBookings: widget.isAdmin
                        ? () => _PlansSectionState._openBookings(
                              context,
                              plan,
                              provider,
                              widget.isAdmin,
                            )
                        : null,
                    onViewCompletedBookings: widget.isAdmin
                        ? () => _PlansSectionState._openCompletedBookings(
                              context,
                              plan,
                              provider,
                              widget.isAdmin,
                            )
                        : null,
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            Align(
              child: GradientButton(
                label: 'الدفع وتفعيل العضوية',
                icon: Icons.payments,
                isBusy: provider.isSubscribing,
                onPressed: provider.selectedPlan == null
                    ? null
                    : () => _showPaymentDialog(context, provider),
              ),
            ),
          ],
        );
      },
    );
  }

  static Future<void> _showEditDialog(
    BuildContext context,
    MembershipPlan plan,
    MembershipProvider provider,
  ) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AddEditMembershipPage(
          plan: plan,
          onSave: (data) async {
            try {
              await provider.fetchPlans(refresh: true);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('تم تحديث العضوية بنجاح'),
                    backgroundColor: Colors.green,
                  ),
                );
                Navigator.of(context).pop();
              }
            } catch (e) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('فشل تحديث العضوية: $e'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            }
          },
        ),
      ),
    );
  }

  static Future<void> _showDeleteDialog(
    BuildContext context,
    MembershipPlan plan,
    MembershipProvider provider,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تأكيد الحذف'),
        content: Text('هل أنت متأكد من حذف العضوية "${plan.name}"؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('حذف'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      try {
        await provider.deleteMembership(plan.id);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم حذف العضوية بنجاح'),
              backgroundColor: Colors.green,
            ),
          );
          await provider.fetchPlans(refresh: true);
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('فشل حذف العضوية: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  static Future<void> _openBookings(
    BuildContext context,
    MembershipPlan plan,
    MembershipProvider provider,
    bool isAdmin,
  ) async {
    try {
      final bookings = await provider.getMembershipBookings(plan.id);
      if (context.mounted && bookings != null) {
        await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => MembershipBookingsPage(
              membershipId: plan.id,
              membershipName: plan.name,
              bookingsData: bookings,
              isAdmin: isAdmin,
            ),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل تحميل الحجوزات: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  static Future<void> _openCompletedBookings(
    BuildContext context,
    MembershipPlan plan,
    MembershipProvider provider,
    bool isAdmin,
  ) async {
    try {
      final bookings =
          await provider.getMembershipBookings(plan.id, completedOnly: true);
      if (context.mounted && bookings != null) {
        await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => MembershipBookingsPage(
              membershipId: plan.id,
              membershipName: plan.name,
              bookingsData: bookings,
              showOnlyCompleted: true,
              isAdmin: isAdmin,
            ),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل تحميل الحجوزات: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  static void _showPaymentDialog(
      BuildContext context, MembershipProvider provider) {
    final plan = provider.selectedPlan!;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(24),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: AppColors.primaryGradient,
                      ),
                      borderRadius: BorderRadius.all(Radius.circular(16)),
                    ),
                    child: const Icon(
                      Icons.workspace_premium,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          plan.name,
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                        Text(
                          'باقة ${plan.tier}',
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Colors.grey[600],
                                  ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _InfoRow(
                icon: Icons.calendar_today,
                label: 'المدة',
                value: '${plan.durationDays ~/ 30} شهر',
              ),
              const SizedBox(height: 12),
              _InfoRow(
                icon: Icons.stars,
                label: 'النقاط الترحيبية',
                value: '${plan.points} نقطة',
              ),
              const SizedBox(height: 12),
              _InfoRow(
                icon: Icons.account_balance_wallet,
                label: 'الكاش باك الترحيبي',
                value: '${plan.welcomeCashback.toStringAsFixed(0)} EGP',
              ),
              const SizedBox(height: 12),
              _InfoRow(
                icon: Icons.trending_up,
                label: 'مضاعف النقاط',
                value: '${plan.pointMultiplier}x',
              ),
              const Divider(height: 32),
              // PDF Review Button
              if (plan.pdfViewUrl != null || plan.pdfUrl != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => MembershipPdfViewerSheet(
                          plan: plan,
                          onSubscribe: () =>
                              _showPaymentDialog(context, provider),
                        ),
                      );
                    },
                    icon: const Icon(Icons.picture_as_pdf),
                    label: const Text('مراجعة ملف PDF'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 16,
                      ),
                      side:
                          const BorderSide(color: AppColors.primary, width: 2),
                      shape: const RoundedRectangleBorder(
                        borderRadius: BorderRadius.all(Radius.circular(12)),
                      ),
                    ),
                  ),
                ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'السعر الإجمالي',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Text(
                    '${plan.price.toStringAsFixed(2)} EGP',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              GradientButton(
                label: 'الدفع عبر Fawaterak',
                icon: Icons.payment,
                isBusy: provider.isSubscribing,
                onPressed: () async {
                  Navigator.pop(context);
                  final result = await showModalBottomSheet<bool>(
                    context: context,
                    isScrollControlled: true,
                    builder: (_) => ChangeNotifierProvider.value(
                      value: provider,
                      child: MembershipCheckoutSheet(plan: plan),
                    ),
                  );
                  if (result == true && context.mounted) {
                    // Refresh all data after successful payment
                    await Future.wait([
                      context.read<MembershipCardProvider>().loadCard(),
                      context.read<AccountingProvider>().loadAll(refresh: true),
                      context
                          .read<MembershipAnalyticsProvider>()
                          .loadAnalytics(),
                    ]);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('تم تفعيل العضوية بنجاح! 🎉'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    }
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 12),
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const Spacer(),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.dark,
              ),
        ),
      ],
    );
  }
}

class _TierStrip extends StatelessWidget {
  const _TierStrip({required this.onPlanSelected});

  final void Function(BuildContext, MembershipPlan, MembershipProvider)
      onPlanSelected;

  // Tier order for sorting (if tier exists in plans)
  static const tierOrder = {
    'business': 1,
    'diamond': 2,
    'vip': 3,
    'platinum': 4,
    'gold': 5,
    'silver': 6,
    'bronze': 7,
  };

  @override
  Widget build(BuildContext context) {
    return Consumer<MembershipProvider>(
      builder: (context, provider, _) {
        // Get all unique tiers from available plans dynamically
        final availableTiers = provider.plans
            .map((plan) => plan.tier.trim())
            .where((tier) => tier.isNotEmpty)
            .toSet()
            .toList();

        // Sort tiers by predefined order
        availableTiers.sort((a, b) {
          final orderA = tierOrder[a.toLowerCase()] ?? 999;
          final orderB = tierOrder[b.toLowerCase()] ?? 999;
          if (orderA == orderB) {
            return a.compareTo(b);
          }
          return orderA.compareTo(orderB);
        });

        if (availableTiers.isEmpty) {
          return const SizedBox.shrink();
        }

        return Wrap(
          spacing: 10,
          runSpacing: 10,
          children: availableTiers
              .map(
                (tier) => InkWell(
                  onTap: () {
                    // Find plan by tier - CRITICAL FIX: Ensure we get the correct plan
                    MembershipPlan? plan;
                    try {
                      plan = provider.plans.firstWhere(
                        (p) =>
                            p.tier.trim().toLowerCase() == tier.toLowerCase(),
                      );
                    } catch (e) {
                      // If plan not found, try to find by name
                      try {
                        plan = provider.plans.firstWhere(
                          (p) => p.name.toLowerCase() == tier.toLowerCase(),
                        );
                      } catch (e2) {
                        // If still not found, use first plan as fallback
                        if (provider.plans.isNotEmpty) {
                          plan = provider.plans.first;
                        }
                      }
                    }

                    if (plan != null) {
                      // Show plan details for the CORRECT plan
                      onPlanSelected(context, plan, provider);
                    } else {
                      // Show error if no plans available
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('لا توجد باقات متاحة حالياً'),
                          backgroundColor: Colors.orange,
                        ),
                      );
                    }
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: AppColors.primaryGradient,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.workspace_premium,
                          size: 18,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          tier,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )
              .toList(),
        );
      },
    );
  }
}

class _ReferralSection extends StatelessWidget {
  const _ReferralSection({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Consumer<ReferralProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const LoadingIndicator(message: 'جاري إحضار تقرير الإحالات');
        }
        if (provider.errorMessage != null || provider.summary == null) {
          return StateMessage(
            icon: Icons.support_agent,
            title: 'لا تتوفر بيانات الإحالة',
            subtitle: provider.errorMessage ??
                'يمكنك البدء فور تفعيل عضويتك الأساسية',
            action: FilledButton(
              onPressed: provider.loadSummary,
              child: const Text('تحديث'),
            ),
          );
        }
        final ReferralSummary summary = provider.summary!;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('إحالاتك', style: theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            ReferralCard(
              summary: summary,
              isInviting: provider.isInviting,
              onInvite: (email) async {
                final response = await provider.inviteFriend(email);
                // After inviting, reload summary to update numbers
                if (context.mounted) {
                  // Check if user is already registered
                  if (response != null &&
                      response['data'] != null &&
                      response['data']['isRegistered'] == true) {
                    final userData =
                        response['data']['user'] as Map<String, dynamic>?;
                    if (userData != null) {
                      // Show dialog with user details
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('المستخدم مسجل بالفعل'),
                          content: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('الاسم: ${userData['name'] ?? 'غير متوفر'}'),
                              const SizedBox(height: 8),
                              Text(
                                  'البريد الإلكتروني: ${userData['email'] ?? email}'),
                              const SizedBox(height: 16),
                              const Text(
                                'هذا المستخدم مسجل بالفعل في التطبيق. يمكنك مشاركة التطبيق معه مباشرة.',
                                style:
                                    TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('حسناً'),
                            ),
                          ],
                        ),
                      );
                    }
                  } else {
                    // Reload summary only if it's a new invite
                    await provider.loadSummary();
                  }

                  // Show success or error message
                  if (context.mounted) {
                    if (provider.successMessage != null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(provider.successMessage!),
                          backgroundColor: Colors.green,
                        ),
                      );
                    } else if (provider.errorMessage != null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(provider.errorMessage!),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  }
                }
              },
            ),
          ],
        );
      },
    );
  }
}
