import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher_string.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';

import 'package:altayar/core/widgets/loading_indicator.dart';
import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/core/config/app_config.dart';
import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/membership/data/models/membership_plan.dart';
import 'package:altayar/features/membership/presentation/providers/membership_provider.dart';
import 'package:altayar/features/membership/presentation/widgets/membership_plan_card.dart';
import 'package:altayar/features/membership/presentation/pages/fawaterak_checkout_page.dart';
import 'package:altayar/features/chat/presentation/pages/communication_page.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/membership/presentation/pages/add_edit_membership_page.dart';
import 'package:altayar/features/membership/presentation/pages/membership_bookings_page.dart';

class PackagesPage extends StatefulWidget {
  const PackagesPage({super.key});

  @override
  State<PackagesPage> createState() => _PackagesPageState();
}

class _PackagesPageState extends State<PackagesPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // CRITICAL: Force refresh to get all active memberships from database
      context.read<MembershipProvider>().fetchPlans(refresh: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MembershipProvider>();
    final auth = context.watch<AuthProvider>();
    final isAdmin = _isAdmin(auth.currentUser?.role ?? '');

    // Debug: Log provider state
    print(
        '🔍 [PackagesPage] Status: ${provider.status}, Plans count: ${provider.plans.length}');

    return Scaffold(
      appBar: AppBar(
        leading: Navigator.of(context).canPop() ? const BackButton() : null,
        title: const Text('الباقات والعروض'),
        actions: [
          if (isAdmin)
            IconButton(
              icon: const Icon(Icons.add),
              tooltip: 'إضافة باقة جديدة',
              onPressed: () => _showAddMembershipDialog(context, provider),
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث',
            onPressed: () {
              print('🔄 [PackagesPage] Refresh button pressed');
              provider.fetchPlans(refresh: true);
            },
          ),
        ],
      ),
      body: provider.status == MembershipStatus.loading
          ? const LoadingIndicator(message: 'جاري تحميل الباقات')
          : RefreshIndicator(
              onRefresh: () async {
                print('🔄 [PackagesPage] Pull to refresh');
                await provider.fetchPlans(refresh: true);
              },
              child: _buildMembershipsList(provider, isAdmin),
            ),
    );
  }

  Widget _buildMembershipsList(MembershipProvider provider, bool isAdmin) {
    // Log provider state for debugging
    print('🔍 [PackagesPage] Building memberships list');
    print('🔍 [PackagesPage] Provider status: ${provider.status}');
    print('🔍 [PackagesPage] Provider plans count: ${provider.plans.length}');
    if (provider.errorMessage != null) {
      print('⚠️ [PackagesPage] Provider error: ${provider.errorMessage}');
    }

    if (provider.plans.isEmpty) {
      print('⚠️ [PackagesPage] No plans available - showing empty state');
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.workspace_premium_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'لا توجد باقات متاحة حالياً',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            if (provider.errorMessage != null) ...[
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  provider.errorMessage!,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.red,
                      ),
                ),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () {
                print('🔄 [PackagesPage] Retry button pressed');
                provider.fetchPlans(refresh: true);
              },
              icon: const Icon(Icons.refresh),
              label: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      );
    }

    // Show all active memberships (no filtering by tier)
    // Debug: Log all plans to see what we're getting
    print(
        '📋 [PackagesPage] Total plans from provider: ${provider.plans.length}');
    for (final plan in provider.plans) {
      print(
          '  📦 Plan: "${plan.name}" (ID: ${plan.id}, Tier: ${plan.tier}, Active: ${plan.isActive}, Price: ${plan.price})');
    }

    // CRITICAL FIX: Filter only by isActive - show ALL active memberships from database
    // The backend already returns only active plans, but we double-check here for safety
    // IMPORTANT: Do NOT filter by tier or any other criteria - show ALL active plans
    final filteredPlans = provider.plans.where((plan) {
      // Only filter by isActive - show all active plans regardless of tier or other properties
      if (!plan.isActive) {
        print(
            '⚠️ [PackagesPage] Plan "${plan.name}" (ID: ${plan.id}) is not active - excluding');
        return false;
      }
      print(
          '✅ [PackagesPage] Including active plan: "${plan.name}" (ID: ${plan.id}, Tier: ${plan.tier}, Price: ${plan.price})');
      return true;
    }).toList();

    print(
        '📊 [PackagesPage] After filtering: ${filteredPlans.length} active plans');
    if (filteredPlans.isEmpty && provider.plans.isNotEmpty) {
      print('⚠️ [PackagesPage] WARNING: All plans are inactive!');
    }
    for (final plan in filteredPlans) {
      print('  ✅ Displaying: ${plan.tier} - ${plan.name}');
    }

    // Sort by tier order (extended to include all possible tiers)
    final tierOrder = {
      'business': 1,
      'diamond': 2,
      'vip': 3,
      'platinum': 4,
      'gold': 5,
      'silver': 6,
      'bronze': 7,
      // Add more tiers as needed
    };
    filteredPlans.sort((a, b) {
      final tierA = a.tier.trim().toLowerCase();
      final tierB = b.tier.trim().toLowerCase();
      final orderA = tierOrder[tierA] ?? 999;
      final orderB = tierOrder[tierB] ?? 999;
      // If same order, sort by name
      if (orderA == orderB) {
        return a.name.compareTo(b.name);
      }
      return orderA.compareTo(orderB);
    });

    // If no plans found, show message with refresh option
    if (filteredPlans.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.workspace_premium_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'لا توجد باقات متاحة حالياً',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              provider.plans.isEmpty
                  ? 'لا توجد باقات في قاعدة البيانات'
                  : 'جميع الباقات غير نشطة حالياً',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[500],
                  ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => provider.fetchPlans(refresh: true),
              icon: const Icon(Icons.refresh),
              label: const Text('تحديث'),
            ),
          ],
        ),
      );
    }

    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primaryGradient.first.withOpacity(0.1),
                  AppColors.primaryGradient.last.withOpacity(0.05),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: AppColors.primaryGradient,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.workspace_premium,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'الباقات والعروض',
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.dark,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'اختر الباقة المناسبة لك واستمتع بمميزات حصرية',
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
                if (provider.errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.withAlpha((255 * .08).round()),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Colors.red.withOpacity(0.3),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline,
                            color: Colors.red[700], size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            provider.errorMessage!,
                            style: TextStyle(color: Colors.red[700]),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        // Use SliverFixedExtentList for better performance and to avoid layout issues
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                // Safety check: ensure index is valid
                if (index >= filteredPlans.length) {
                  return const SizedBox.shrink();
                }

                final plan = filteredPlans[index];
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
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: MembershipPlanCard(
                      plan: plan,
                      isSelected: provider.selectedPlan?.id == plan.id,
                      isAdmin: isAdmin,
                      onTap: () =>
                          _openMembershipDetails(context, plan, provider),
                      onEdit: isAdmin
                          ? () =>
                              _showEditMembershipDialog(context, plan, provider)
                          : null,
                      onDelete: isAdmin
                          ? () =>
                              _showDeleteConfirmation(context, plan, provider)
                          : null,
                      onViewBookings: isAdmin
                          ? () =>
                              _openMembershipBookings(context, plan, provider)
                          : null,
                      onViewCompletedBookings: isAdmin
                          ? () =>
                              _openCompletedBookings(context, plan, provider)
                          : null,
                    ),
                  ),
                );
              },
              childCount: filteredPlans.length,
            ),
          ),
        ),
      ],
    );
  }

  bool _isAdmin(String role) {
    final normalized = role.toLowerCase();
    return normalized.contains('super_admin') ||
        normalized.contains('admin') ||
        normalized.contains('accountant');
  }

  Future<void> _openMembershipDetails(
    BuildContext context,
    MembershipPlan plan,
    MembershipProvider provider,
  ) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => MembershipDetailPage(plan: plan),
      ),
    );
  }

  Future<void> _showAddMembershipDialog(
    BuildContext context,
    MembershipProvider provider,
  ) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AddEditMembershipPage(
          onSave: (data) async {
            final newPlan = await provider.createMembership(data);
            if (newPlan != null && context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('تم إضافة الباقة بنجاح'),
                  backgroundColor: Colors.green,
                ),
              );
              provider.fetchPlans(refresh: true);
              Navigator.of(context).pop();
            } else if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(provider.errorMessage ?? 'فشل إضافة الباقة'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
        ),
      ),
    );
  }

  Future<void> _showEditMembershipDialog(
    BuildContext context,
    MembershipPlan plan,
    MembershipProvider provider,
  ) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AddEditMembershipPage(
          plan: plan,
          onSave: (data) async {
            // Use updatePlanValues with proper parameters
            final updated = await provider.updatePlanValues(
              plan,
              price: data['price'] != null
                  ? (data['price'] is double
                      ? data['price'] as double
                      : double.tryParse(data['price'].toString()) ?? plan.price)
                  : null,
              points: data['points'] != null
                  ? (data['points'] is int
                      ? data['points'] as int
                      : int.tryParse(data['points'].toString()) ?? plan.points)
                  : null,
              pointMultiplier: data['point_multiplier'] != null
                  ? (data['point_multiplier'] is double
                      ? data['point_multiplier'] as double
                      : double.tryParse(data['point_multiplier'].toString()) ??
                          plan.pointMultiplier)
                  : null,
              cashbackRate: data['cashback_rate'] != null
                  ? (data['cashback_rate'] is double
                      ? data['cashback_rate'] as double
                      : double.tryParse(data['cashback_rate'].toString()) ??
                          plan.cashbackRate)
                  : null,
              welcomePoints: data['welcome_points'] != null
                  ? (data['welcome_points'] is int
                      ? data['welcome_points'] as int
                      : int.tryParse(data['welcome_points'].toString()) ??
                          plan.welcomePoints)
                  : null,
              welcomeCashback: data['welcome_cashback'] != null
                  ? (data['welcome_cashback'] is double
                      ? data['welcome_cashback'] as double
                      : double.tryParse(data['welcome_cashback'].toString()) ??
                          plan.welcomeCashback)
                  : null,
            );
            if (updated != null && context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('تم تحديث الباقة بنجاح'),
                  backgroundColor: Colors.green,
                ),
              );
              provider.fetchPlans(refresh: true);
              Navigator.of(context).pop();
            } else if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(provider.errorMessage ?? 'فشل تحديث الباقة'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
        ),
      ),
    );
  }

  Future<void> _showDeleteConfirmation(
    BuildContext context,
    MembershipPlan plan,
    MembershipProvider provider,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تأكيد الحذف'),
        content: Text('هل أنت متأكد من حذف الباقة "${plan.name}"؟'),
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
      final success = await provider.deleteMembership(plan.id);
      if (success && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم حذف الباقة بنجاح'),
            backgroundColor: Colors.green,
          ),
        );
        provider.fetchPlans(refresh: true);
      } else if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.errorMessage ?? 'فشل حذف الباقة'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _openMembershipBookings(
    BuildContext context,
    MembershipPlan plan,
    MembershipProvider provider,
  ) async {
    final bookings = await provider.getMembershipBookings(plan.id);
    if (context.mounted && bookings != null) {
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => MembershipBookingsPage(
            membershipId: plan.id,
            membershipName: plan.name,
            bookingsData: bookings,
          ),
        ),
      );
    } else if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage ?? 'فشل تحميل الحجوزات'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _openCompletedBookings(
    BuildContext context,
    MembershipPlan plan,
    MembershipProvider provider,
  ) async {
    final bookings = await provider.getMembershipBookings(plan.id);
    if (context.mounted && bookings != null) {
      final completedBookings =
          bookings['completedBookings'] as List<dynamic>? ?? [];
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => MembershipBookingsPage(
            membershipId: plan.id,
            membershipName: plan.name,
            bookingsData: {
              ...bookings,
              'bookings': completedBookings,
            },
            showOnlyCompleted: true,
          ),
        ),
      );
    } else if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage ?? 'فشل تحميل الحجوزات'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

class MembershipDetailPage extends StatefulWidget {
  const MembershipDetailPage({super.key, required this.plan});

  final MembershipPlan plan;

  @override
  State<MembershipDetailPage> createState() => _MembershipDetailPageState();
}

class _MembershipDetailPageState extends State<MembershipDetailPage> {
  bool _isLoadingPdf = false;
  String? _pdfUrl;
  String? _pdfDownloadUrl;
  bool _isLoadingPayment = false;
  bool _isDownloadingPdf = false;
  double _downloadProgress = 0.0;

  @override
  void initState() {
    super.initState();
    _loadPdfUrl();
  }

  Future<void> _loadPdfUrl() async {
    print(
        '🔄 [MembershipDetail] Starting to load PDF URL for plan ID: ${widget.plan.id}');
    print('📋 [MembershipDetail] Plan PDF URLs:');
    print('  - pdfUrl: ${widget.plan.pdfUrl}');
    print('  - pdfViewUrl: ${widget.plan.pdfViewUrl}');
    print('  - pdfDownloadUrl: ${widget.plan.pdfDownloadUrl}');

    setState(() => _isLoadingPdf = true);
    try {
      // Get API client for auth token
      final apiClient = context.read<ApiClient>();
      final authToken = apiClient.authToken;
      print('🔑 [MembershipDetail] Auth token available: ${authToken != null}');

      // Always construct URL using API endpoint for reliability
      // The backend will handle finding the correct PDF file
      final baseUrl = AppConfig.resolvedBaseUrl();
      print('🌐 [MembershipDetail] Base URL: $baseUrl');

      // Remove /api if present and clean up trailing slashes
      String cleanBaseUrl =
          baseUrl.replaceAll('/api', '').replaceAll(RegExp(r'/+$'), '');
      // Ensure we have a proper base URL
      if (!cleanBaseUrl.startsWith('http')) {
        // If baseUrl doesn't start with http, try to construct it properly
        cleanBaseUrl = baseUrl;
      }
      print('🧹 [MembershipDetail] Cleaned base URL: $cleanBaseUrl');

      // Use the API endpoint for PDF viewing/downloading
      // This ensures we always have a valid URL that matches the backend
      String viewUrl =
          '$cleanBaseUrl/api/memberships/${widget.plan.id}/pdf/view';
      String downloadUrl =
          '$cleanBaseUrl/api/memberships/${widget.plan.id}/pdf/download';

      print('🔗 [MembershipDetail] Initial URLs:');
      print('  - View URL: $viewUrl');
      print('  - Download URL: $downloadUrl');

      // If plan has absolute URLs from API, prefer them
      if (widget.plan.pdfViewUrl != null &&
          widget.plan.pdfViewUrl!.startsWith('http')) {
        viewUrl = widget.plan.pdfViewUrl!;
        print('✅ [MembershipDetail] Using plan.pdfViewUrl: $viewUrl');
      } else if (widget.plan.pdfUrl != null &&
          widget.plan.pdfUrl!.startsWith('http')) {
        viewUrl = widget.plan.pdfUrl!;
        print('✅ [MembershipDetail] Using plan.pdfUrl for view: $viewUrl');
      } else {
        print(
            'ℹ️ [MembershipDetail] No absolute URL in plan, using constructed URL: $viewUrl');
      }

      if (widget.plan.pdfDownloadUrl != null &&
          widget.plan.pdfDownloadUrl!.startsWith('http')) {
        downloadUrl = widget.plan.pdfDownloadUrl!;
        print('✅ [MembershipDetail] Using plan.pdfDownloadUrl: $downloadUrl');
      } else if (widget.plan.pdfUrl != null &&
          widget.plan.pdfUrl!.startsWith('http')) {
        downloadUrl = widget.plan.pdfUrl!;
        print(
            '✅ [MembershipDetail] Using plan.pdfUrl for download: $downloadUrl');
      } else {
        print(
            'ℹ️ [MembershipDetail] No absolute download URL in plan, using constructed URL: $downloadUrl');
      }

      // Add authentication token if available
      if (authToken != null) {
        try {
          final viewUri = Uri.parse(viewUrl);
          if (!viewUri.queryParameters.containsKey('token')) {
            viewUrl = viewUri.replace(queryParameters: {
              ...viewUri.queryParameters,
              'token': authToken,
            }).toString();
            print('🔐 [MembershipDetail] Added token to view URL');
          }

          final downloadUri = Uri.parse(downloadUrl);
          if (!downloadUri.queryParameters.containsKey('token')) {
            downloadUrl = downloadUri.replace(queryParameters: {
              ...downloadUri.queryParameters,
              'token': authToken,
            }).toString();
            print('🔐 [MembershipDetail] Added token to download URL');
          }
        } catch (e) {
          print('⚠️ [MembershipDetail] Error parsing URI: $e');
        }
      }

      // CRITICAL: Always set PDF URLs, even if they might not work
      // This ensures the PDF viewer section is always shown
      _pdfUrl = viewUrl;
      _pdfDownloadUrl = downloadUrl;

      print('✅ [MembershipDetail] PDF URLs set successfully:');
      print('  - View URL: $_pdfUrl');
      print('  - Download URL: $_pdfDownloadUrl');
    } catch (e, stackTrace) {
      // Log error but still set URLs to show the viewer section
      print('❌ [MembershipDetail] Error loading PDF URL: $e');
      print('❌ [MembershipDetail] Stack trace: $stackTrace');

      // Even on error, try to construct basic URLs
      try {
        final baseUrl = AppConfig.resolvedBaseUrl();
        final cleanBaseUrl =
            baseUrl.replaceAll('/api', '').replaceAll(RegExp(r'/+$'), '');
        _pdfUrl = '$cleanBaseUrl/api/memberships/${widget.plan.id}/pdf/view';
        _pdfDownloadUrl =
            '$cleanBaseUrl/api/memberships/${widget.plan.id}/pdf/download';
        print('⚠️ [MembershipDetail] Set fallback URLs after error');
      } catch (fallbackError) {
        print(
            '❌ [MembershipDetail] Failed to set fallback URLs: $fallbackError');
        // Still set URLs to null so UI can handle it
        _pdfUrl = null;
        _pdfDownloadUrl = null;
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingPdf = false;
        });
        print(
            '✅ [MembershipDetail] PDF loading state updated. _pdfUrl is ${_pdfUrl != null ? "set" : "null"}');
      }
    }
  }

  Color get tierColor {
    switch (widget.plan.tier.toLowerCase()) {
      case 'silver':
        return const Color(0xFFC0C0C0);
      case 'gold':
        return const Color(0xFFFFD700);
      case 'platinum':
        return const Color(0xFFE5E4E2);
      case 'vip':
        return const Color(0xFFB76E79);
      case 'diamond':
        return const Color(0xFFB9F2FF);
      case 'business':
        return AppColors.primary;
      default:
        return const Color(0xFFC0C0C0);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('تفاصيل ${widget.plan.name}'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Membership Header Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    tierColor.withValues(alpha: 0.2),
                    tierColor.withValues(alpha: 0.1),
                    Colors.white,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: tierColor, width: 2),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          tierColor,
                          tierColor.withValues(alpha: 0.8),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      widget.plan.tier.toUpperCase(),
                      style: theme.textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    widget.plan.name,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: tierColor,
                    ),
                  ),
                  if (widget.plan.description != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      widget.plan.description!,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[700],
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: AppColors.primaryGradient,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'السعر',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.white70,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${widget.plan.price.toStringAsFixed(0)} EGP',
                          style: theme.textTheme.headlineMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Benefits Section
            Text(
              'المميزات',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.dark,
              ),
            ),
            const SizedBox(height: 12),
            ...widget.plan.benefits.map((benefit) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: tierColor, size: 24),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          benefit,
                          style: theme.textTheme.bodyLarge,
                        ),
                      ),
                    ],
                  ),
                )),
            const SizedBox(height: 24),

            // Details Grid
            Row(
              children: [
                Expanded(
                  child: _DetailCard(
                    icon: Icons.calendar_today,
                    label: 'المدة',
                    value: '${widget.plan.durationDays ~/ 30} شهر',
                    color: tierColor,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _DetailCard(
                    icon: Icons.stars,
                    label: 'النقاط',
                    value: '${widget.plan.points}',
                    color: tierColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _DetailCard(
                    icon: Icons.trending_up,
                    label: 'مضاعف النقاط',
                    value: '${widget.plan.pointMultiplier}x',
                    color: tierColor,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _DetailCard(
                    icon: Icons.percent,
                    label: 'نسبة الكاش باك',
                    value: '${widget.plan.cashbackRate}%',
                    color: tierColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // PDF Viewer Section
            // CRITICAL FIX: Always show PDF section with option to open in external browser
            ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'ملف العضوية',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.dark,
                    ),
                  ),
                  // Button to open PDF in external browser (Chrome)
                  if (_pdfUrl != null && _pdfUrl!.isNotEmpty)
                    IconButton(
                      onPressed: () => _openPdfInBrowser(_pdfUrl!),
                      icon: const Icon(Icons.open_in_browser),
                      tooltip: 'فتح في المتصفح',
                      color: AppColors.primary,
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                height: 400,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: _isLoadingPdf
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            CircularProgressIndicator(),
                            SizedBox(height: 16),
                            Text('جاري تحميل ملف PDF...'),
                          ],
                        ),
                      )
                    : _pdfUrl != null && _pdfUrl!.isNotEmpty
                        ? Stack(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: _PdfViewer(
                                  pdfUrl: _pdfUrl!,
                                  onOpenInBrowser: () =>
                                      _openPdfInBrowser(_pdfUrl!),
                                ),
                              ),
                              // Floating button to open in browser (always visible)
                              Positioned(
                                top: 8,
                                right: 8,
                                child: Material(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  elevation: 4,
                                  child: InkWell(
                                    onTap: () => _openPdfInBrowser(_pdfUrl!),
                                    borderRadius: BorderRadius.circular(20),
                                    child: Container(
                                      padding: const EdgeInsets.all(8),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.open_in_browser,
                                            size: 18,
                                            color: AppColors.primary,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            'فتح في المتصفح',
                                            style: theme.textTheme.bodySmall
                                                ?.copyWith(
                                              color: AppColors.primary,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          )
                        : Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.picture_as_pdf,
                                  size: 64,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'لا يوجد ملف PDF متاح حالياً',
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    color: Colors.grey[600],
                                    fontWeight: FontWeight.w500,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'سيتم إنشاء ملف PDF تلقائياً عند الاشتراك',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: Colors.grey[500],
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 16),
                                OutlinedButton.icon(
                                  onPressed: () {
                                    print(
                                        '🔄 [MembershipDetail] Retry loading PDF');
                                    _loadPdfUrl();
                                  },
                                  icon: const Icon(Icons.refresh),
                                  label: const Text('إعادة المحاولة'),
                                ),
                              ],
                            ),
                          ),
              ),
              const SizedBox(height: 12),
            ],

            // Action Buttons
            const SizedBox(height: 24),
            GradientButton(
              label: 'الدفع عبر فواتيرك',
              icon: Icons.payment,
              onPressed: _isLoadingPayment ? null : _handlePayment,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            const SizedBox(height: 12),
            // Show download button if PDF is available (from plan or loaded)
            if (widget.plan.pdfDownloadUrl != null ||
                widget.plan.pdfUrl != null ||
                _pdfDownloadUrl != null)
              Stack(
                alignment: Alignment.center,
                children: [
                  OutlinedButton.icon(
                    onPressed: _isDownloadingPdf ? null : _downloadPdf,
                    icon: _isDownloadingPdf
                        ? SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(tierColor),
                            ),
                          )
                        : const Icon(Icons.download),
                    label: Text(
                      _isDownloadingPdf
                          ? 'جاري التحميل... ${(_downloadProgress * 100).toInt()}%'
                          : 'تنزيل ملف PDF',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        vertical: 16,
                        horizontal: 24,
                      ),
                      side: BorderSide(
                        color: _isDownloadingPdf
                            ? tierColor.withOpacity(0.5)
                            : tierColor,
                        width: 2.5,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _navigateToMessages,
              icon: const Icon(Icons.chat),
              label: const Text('الاستفسار'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: AppColors.primary, width: 2),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Future<void> _handlePayment() async {
    setState(() => _isLoadingPayment = true);
    try {
      final provider = context.read<MembershipProvider>();
      final session = await provider.createPaymentSession(widget.plan);

      if (!mounted) return;

      if (session == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              provider.errorMessage ?? 'فشل إنشاء رابط الدفع',
            ),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      final shouldVerify = await FawaterakCheckoutPage.open(
        context,
        session.paymentUrl,
      );

      if (!mounted) return;

      if (shouldVerify) {
        final verified = await provider.verifyPaymentAndActivate();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                verified
                    ? 'تم الدفع بنجاح! تم تفعيل العضوية: ${widget.plan.name}'
                    : 'فشل التحقق من الدفع. يرجى المحاولة مرة أخرى.',
              ),
              backgroundColor: verified ? Colors.green : Colors.orange,
              duration: const Duration(seconds: 4),
            ),
          );
          if (verified) {
            Navigator.of(context).pop();
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('حدث خطأ: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingPayment = false);
      }
    }
  }

  Future<void> _downloadPdf() async {
    if (_isDownloadingPdf) return;

    // Get download URL from loaded URL or plan
    final downloadUrl =
        _pdfDownloadUrl ?? widget.plan.pdfDownloadUrl ?? widget.plan.pdfUrl;

    if (downloadUrl == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('لا يوجد رابط تحميل متاح لهذه العضوية'),
            backgroundColor: Colors.orange,
          ),
        );
      }
      return;
    }

    setState(() {
      _isDownloadingPdf = true;
      _downloadProgress = 0.0;
    });

    try {
      // Get the API client to access auth token if needed
      final apiClient = context.read<ApiClient>();
      final authToken = apiClient.authToken;

      // Build the download URL with authentication if available
      String finalDownloadUrl = downloadUrl;
      final uri = Uri.parse(finalDownloadUrl);

      // Add authentication token if available
      if (authToken != null && !uri.queryParameters.containsKey('token')) {
        finalDownloadUrl = uri.replace(
          queryParameters: {
            ...uri.queryParameters,
            'token': authToken,
            'download': '1',
          },
        ).toString();
      } else if (!uri.queryParameters.containsKey('download')) {
        // Ensure download parameter is present
        finalDownloadUrl = uri.replace(
          queryParameters: {
            ...uri.queryParameters,
            'download': '1',
          },
        ).toString();
      }

      // Show initial message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
                SizedBox(width: 12),
                Text('جاري تحميل ملف PDF...'),
              ],
            ),
            backgroundColor: Colors.blue,
            duration: Duration(seconds: 2),
          ),
        );
      }

      // Create HTTP request with headers
      final headers = <String, String>{
        'Accept': 'application/pdf',
        'Content-Type': 'application/pdf',
      };

      if (authToken != null) {
        headers['Authorization'] = 'Bearer $authToken';
      }

      final request = http.Request('GET', Uri.parse(finalDownloadUrl));
      request.headers.addAll(headers);

      final streamedResponse = await http.Client().send(request);

      if (streamedResponse.statusCode != 200) {
        throw Exception(
          'فشل تحميل الملف. كود الخطأ: ${streamedResponse.statusCode}',
        );
      }

      // Get file size for progress tracking
      final contentLength = streamedResponse.contentLength;
      final bytes = <int>[];

      // Download with progress tracking
      await for (final chunk in streamedResponse.stream) {
        bytes.addAll(chunk);
        if (contentLength != null && mounted) {
          setState(() {
            _downloadProgress = bytes.length / contentLength;
          });
        }
      }

      // Save file directly to Downloads folder (Android) or Documents (iOS)
      if (mounted && bytes.isNotEmpty) {
        try {
          // Get downloads directory (Android) or documents directory (iOS)
          Directory downloadsDir;
          if (Platform.isAndroid) {
            // For Android, try to get external storage downloads directory
            final externalDir = await getExternalStorageDirectory();
            if (externalDir != null) {
              // Navigate to Downloads folder
              downloadsDir =
                  Directory('${externalDir.path.split('Android')[0]}Download');
              if (!await downloadsDir.exists()) {
                downloadsDir = Directory(
                    '${externalDir.path.split('Android')[0]}Downloads');
                if (!await downloadsDir.exists()) {
                  // Fallback to app documents directory
                  downloadsDir = await getApplicationDocumentsDirectory();
                }
              }
            } else {
              downloadsDir = await getApplicationDocumentsDirectory();
            }
          } else {
            // For iOS, use documents directory
            downloadsDir = await getApplicationDocumentsDirectory();
          }

          // Create downloads directory if it doesn't exist
          if (!await downloadsDir.exists()) {
            await downloadsDir.create(recursive: true);
          }

          // Generate safe filename
          final fileName =
              '${widget.plan.name.replaceAll(' ', '_').replaceAll(RegExp(r'[^\w\s-]'), '')}_membership.pdf';
          final file = File('${downloadsDir.path}/$fileName');

          // Write file
          await file.writeAsBytes(bytes);

          if (mounted) {
            setState(() {
              _isDownloadingPdf = false;
              _downloadProgress = 0.0;
            });

            // Automatically open the file after download
            try {
              final result = await OpenFile.open(file.path);
              if (result.type != ResultType.done) {
                // If open_file fails, show message
                if (mounted) {
                  final message = result.message.isNotEmpty
                      ? result.message
                      : 'تم حفظ الملف في: ${file.path}';
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(message),
                      backgroundColor: Colors.orange,
                      duration: const Duration(seconds: 3),
                    ),
                  );
                }
              }
            } catch (openError) {
              // If open_file is not available or fails, try url_launcher
              try {
                final fileUri = Uri.file(file.path);
                if (await canLaunchUrl(fileUri)) {
                  await launchUrl(
                    fileUri,
                    mode: LaunchMode.externalApplication,
                  );
                }
              } catch (e) {
                // Ignore errors
              }
            }

            // Show success message
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Row(
                    children: [
                      const Icon(Icons.check_circle,
                          color: Colors.white, size: 24),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          Platform.isAndroid
                              ? 'تم حفظ الملف في مجلد التحميل وفتحه تلقائياً'
                              : 'تم حفظ الملف وفتحه تلقائياً',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  backgroundColor: Colors.green,
                  duration: const Duration(seconds: 3),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          }
        } catch (saveError) {
          if (mounted) {
            setState(() {
              _isDownloadingPdf = false;
              _downloadProgress = 0.0;
            });
          }
          throw Exception('فشل حفظ الملف: $saveError');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isDownloadingPdf = false;
          _downloadProgress = 0.0;
        });

        // Show error message with retry option
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'فشل تحميل ملف PDF: ${e.toString().replaceAll('Exception: ', '').replaceAll('Error: ', '')}',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: 'إعادة المحاولة',
              textColor: Colors.white,
              onPressed: () => _downloadPdf(),
            ),
          ),
        );
      }
    }
  }

  void _navigateToMessages() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const CommunicationPage(),
      ),
    );
  }

  Future<void> _openPdfInBrowser(String pdfUrl) async {
    print('🌐 [MembershipDetail] Opening PDF in external browser: $pdfUrl');
    try {
      Uri uri;
      try {
        uri = Uri.parse(pdfUrl);
      } catch (e) {
        print('❌ [MembershipDetail] Invalid URL format: $pdfUrl');
        throw Exception('رابط PDF غير صحيح');
      }

      // Add auth token if available
      final apiClient = context.read<ApiClient>();
      final authToken = apiClient.authToken;

      Uri finalUri = uri;
      if (authToken != null && !uri.queryParameters.containsKey('token')) {
        finalUri = uri.replace(queryParameters: {
          ...uri.queryParameters,
          'token': authToken,
        });
        print('🔐 [MembershipDetail] Added token to URL');
      }

      print('🔗 [MembershipDetail] Final URL: ${finalUri.toString()}');

      // CRITICAL FIX: Use launchUrl with Uri directly instead of canLaunchUrlString
      // canLaunchUrlString may return false for URLs with tokens, but launchUrl will work
      try {
        final launched = await launchUrl(
          finalUri,
          mode: LaunchMode.externalApplication,
        );

        if (launched) {
          print(
              '✅ [MembershipDetail] PDF opened successfully in external browser');

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.white),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text('تم فتح ملف PDF في المتصفح'),
                    ),
                  ],
                ),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 2),
              ),
            );
          }
        } else {
          // If launchUrl returns false, try with launchUrlString as fallback
          print(
              '⚠️ [MembershipDetail] launchUrl returned false, trying launchUrlString...');
          final launchedString = await launchUrlString(
            finalUri.toString(),
            mode: LaunchMode.externalApplication,
          );

          if (launchedString) {
            print('✅ [MembershipDetail] PDF opened using launchUrlString');
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Row(
                    children: [
                      Icon(Icons.check_circle, color: Colors.white),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text('تم فتح ملف PDF في المتصفح'),
                      ),
                    ],
                  ),
                  backgroundColor: Colors.green,
                  duration: Duration(seconds: 2),
                ),
              );
            }
          } else {
            throw Exception('فشل فتح الرابط في المتصفح');
          }
        }
      } catch (launchError) {
        print('❌ [MembershipDetail] Error launching URL: $launchError');
        // Try one more time with launchUrlString as last resort
        try {
          await launchUrlString(
            finalUri.toString(),
            mode: LaunchMode.externalApplication,
          );
          print(
              '✅ [MembershipDetail] PDF opened using launchUrlString (fallback)');
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.white),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text('تم فتح ملف PDF في المتصفح'),
                    ),
                  ],
                ),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 2),
              ),
            );
          }
        } catch (fallbackError) {
          print('❌ [MembershipDetail] Fallback also failed: $fallbackError');
          rethrow;
        }
      }
    } catch (e, stackTrace) {
      print('❌ [MembershipDetail] Error opening PDF in browser: $e');
      print('❌ [MembershipDetail] Stack trace: $stackTrace');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'فشل فتح ملف PDF في المتصفح. يرجى المحاولة مرة أخرى.',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }
}

class _DetailCard extends StatelessWidget {
  const _DetailCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 8),
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
      ),
    );
  }
}

class _PdfViewer extends StatefulWidget {
  const _PdfViewer({
    required this.pdfUrl,
    this.onOpenInBrowser,
  });

  final String pdfUrl;
  final VoidCallback? onOpenInBrowser;

  @override
  State<_PdfViewer> createState() => _PdfViewerState();
}

class _PdfViewerState extends State<_PdfViewer> {
  late final WebViewController _controller;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initializeController();
  }

  void _initializeController() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            if (mounted) {
              // Use Future.microtask to avoid setState during build
              Future.microtask(() {
                if (mounted) {
                  setState(() {
                    _isLoading = true;
                    _errorMessage = null;
                  });
                }
              });
            }
          },
          onPageFinished: (url) {
            if (mounted) {
              // Use Future.microtask to avoid setState during build
              Future.microtask(() {
                if (mounted) {
                  setState(() {
                    _isLoading = false;
                  });
                }
              });
            }
          },
          onWebResourceError: (error) {
            if (mounted) {
              // Use Future.microtask to avoid setState during build
              Future.microtask(() {
                if (mounted) {
                  setState(() {
                    _isLoading = false;
                    _errorMessage = 'فشل تحميل ملف PDF: ${error.description}';
                  });
                }
              });
            }
          },
          onHttpError: (response) {
            if (mounted) {
              final statusCode = response.response?.statusCode ?? 0;
              String errorMsg;
              if (statusCode == 401) {
                errorMsg = 'خطأ في المصادقة. يرجى تسجيل الدخول مرة أخرى';
              } else if (statusCode == 404) {
                errorMsg = 'ملف PDF غير موجود';
              } else if (statusCode == 403) {
                errorMsg = 'ليس لديك صلاحية للوصول إلى هذا الملف';
              } else {
                errorMsg = 'خطأ في تحميل الملف: $statusCode';
              }
              // Use Future.microtask to avoid setState during build
              Future.microtask(() {
                if (mounted) {
                  setState(() {
                    _isLoading = false;
                    _errorMessage = errorMsg;
                  });
                }
              });
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            // Allow navigation to PDF URLs and same origin
            if (request.url.endsWith('.pdf') ||
                request.url.contains('/pdf/') ||
                request.url.contains('application/pdf') ||
                request.url.startsWith('http://') ||
                request.url.startsWith('https://')) {
              return NavigationDecision.navigate;
            }
            // Block other navigation
            return NavigationDecision.prevent;
          },
        ),
      );

    // Load PDF after frame is built - use addPostFrameCallback with delay
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future.delayed(const Duration(milliseconds: 100), () {
        if (mounted) {
          _loadPdf();
        }
      });
    });
  }

  Future<void> _loadPdf() async {
    if (!mounted) return;

    print('🔄 [PDF Viewer] Starting to load PDF: ${widget.pdfUrl}');

    try {
      // Get auth token if available
      final apiClient = context.read<ApiClient>();
      final authToken = apiClient.authToken;
      print('🔑 [PDF Viewer] Auth token available: ${authToken != null}');

      String pdfUrl = widget.pdfUrl;
      print('🔗 [PDF Viewer] Original PDF URL: $pdfUrl');

      Uri uri;
      try {
        uri = Uri.parse(pdfUrl);
      } catch (e) {
        print('❌ [PDF Viewer] Invalid URL format: $pdfUrl');
        throw Exception('رابط PDF غير صحيح');
      }

      // Add token if available and not already present
      if (authToken != null && !uri.queryParameters.containsKey('token')) {
        pdfUrl = uri.replace(queryParameters: {
          ...uri.queryParameters,
          'token': authToken,
        }).toString();
        print('🔐 [PDF Viewer] Added token to URL');
      }

      // Try multiple approaches for PDF viewing
      // Approach 1: Use iframe with data URL (most reliable for authenticated PDFs)
      // First, try to load PDF as data URL by fetching it
      try {
        print('📥 [PDF Viewer] Attempting to fetch PDF as data URL...');
        // Build headers with authentication
        final headers = <String, String>{
          'Accept': 'application/pdf',
        };

        // Add token to both query params and headers for maximum compatibility
        if (authToken != null) {
          headers['Authorization'] = 'Bearer $authToken';
          print('🔐 [PDF Viewer] Added Authorization header');
        }

        final response = await http
            .get(
              Uri.parse(pdfUrl),
              headers: headers,
            )
            .timeout(const Duration(seconds: 30));

        print('📊 [PDF Viewer] Response status: ${response.statusCode}');
        print(
            '📊 [PDF Viewer] Response content length: ${response.bodyBytes.length}');

        if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
          print(
              '✅ [PDF Viewer] PDF fetched successfully, converting to base64...');
          // Convert PDF bytes to base64 data URL
          final base64Pdf = Uri.dataFromBytes(
            response.bodyBytes,
            mimeType: 'application/pdf',
          ).toString();

          print('📄 [PDF Viewer] Loading PDF as data URL in WebView...');
          // Load PDF as data URL in WebView
          await _controller.loadRequest(Uri.parse(base64Pdf));

          if (mounted) {
            Future.microtask(() {
              if (mounted) {
                setState(() {
                  _isLoading = false;
                });
                print('✅ [PDF Viewer] PDF loaded successfully in WebView');
              }
            });
          }
          return;
        } else if (response.statusCode == 401) {
          // Handle 401 error specifically
          print('❌ [PDF Viewer] Authentication error (401)');
          throw Exception('خطأ في المصادقة. يرجى تسجيل الدخول مرة أخرى');
        } else if (response.statusCode == 404) {
          print('❌ [PDF Viewer] PDF not found (404)');
          throw Exception('ملف PDF غير موجود');
        } else {
          print(
              '❌ [PDF Viewer] Failed to fetch PDF. Status: ${response.statusCode}');
          throw Exception('فشل تحميل الملف. كود الخطأ: ${response.statusCode}');
        }
      } catch (fetchError) {
        // If fetching fails, fall back to direct URL loading
        print('⚠️ [PDF Viewer] Failed to fetch PDF as data URL: $fetchError');

        // If it's a 401 or 404 error, don't try fallback - show error immediately
        if (fetchError.toString().contains('401') ||
            fetchError.toString().contains('404') ||
            fetchError.toString().contains('المصادقة') ||
            fetchError.toString().contains('غير موجود')) {
          if (mounted) {
            Future.microtask(() {
              if (mounted) {
                setState(() {
                  _isLoading = false;
                  _errorMessage =
                      fetchError.toString().replaceAll('Exception: ', '');
                });
              }
            });
          }
          return;
        }
      }

      // Approach 2: Load PDF directly with headers (fallback)
      print('🔄 [PDF Viewer] Falling back to direct URL loading...');
      final headers = <String, String>{
        'Accept': 'application/pdf',
      };

      if (authToken != null) {
        headers['Authorization'] = 'Bearer $authToken';
      }

      print('📄 [PDF Viewer] Loading PDF directly from URL: $pdfUrl');
      // Load the PDF directly
      await _controller.loadRequest(
        Uri.parse(pdfUrl),
        headers: headers,
      );
      print('✅ [PDF Viewer] PDF load request sent to WebView');
    } catch (e, stackTrace) {
      print('❌ [PDF Viewer] Error loading PDF: $e');
      print('❌ [PDF Viewer] Stack trace: $stackTrace');
      if (mounted) {
        // Use Future.microtask to avoid setState during build
        Future.microtask(() {
          if (mounted) {
            setState(() {
              _isLoading = false;
              _errorMessage =
                  'فشل تحميل ملف PDF: ${e.toString().replaceAll('Exception: ', '')}';
            });
          }
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Check error first to avoid rendering issues
    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red[300],
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                _errorMessage!,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.red[700],
                    ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 24),
            // Option to open in browser if WebView fails
            if (widget.onOpenInBrowser != null) ...[
              FilledButton.icon(
                onPressed: widget.onOpenInBrowser,
                icon: const Icon(Icons.open_in_browser),
                label: const Text('فتح في المتصفح'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
            OutlinedButton.icon(
              onPressed: () {
                // Use Future.microtask to avoid setState during build
                Future.microtask(() {
                  if (mounted) {
                    setState(() {
                      _errorMessage = null;
                      _isLoading = true;
                    });
                    _loadPdf();
                  }
                });
              },
              icon: const Icon(Icons.refresh),
              label: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      );
    }

    return Stack(
      children: [
        WebViewWidget(controller: _controller),
        if (_isLoading)
          Container(
            color: Colors.white,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text(
                    'جاري تحميل ملف PDF...',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
