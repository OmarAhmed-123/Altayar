import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/widgets/animated_card.dart';
import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/widgets/gradient_card.dart';
import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/accounting/data/models/transaction_model.dart';
import 'package:altayar/features/accounting/presentation/providers/accounting_provider.dart';
import 'package:altayar/features/ad_manager/data/models/ad_campaign.dart';
import 'package:altayar/features/ad_manager/presentation/providers/ad_provider.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/membership/data/models/membership_card.dart';
import 'package:altayar/features/membership/presentation/providers/membership_card_provider.dart';
import 'package:altayar/features/packages/data/models/travel_package.dart';
import 'package:altayar/features/packages/presentation/providers/package_provider.dart';
import 'package:altayar/features/vouchers/data/models/voucher_model.dart';
import 'package:altayar/features/vouchers/presentation/providers/voucher_provider.dart';
import 'package:altayar/features/packages/presentation/widgets/package_detail_sheet.dart';
import 'package:altayar/features/accounting/presentation/pages/accounting_page.dart';
import 'package:altayar/features/vouchers/presentation/pages/vouchers_page.dart';
import 'package:altayar/features/membership/presentation/pages/membership_dashboard_page.dart';
import 'package:altayar/features/notifications/presentation/providers/notification_provider.dart';
import 'package:altayar/features/notifications/presentation/widgets/notification_center_sheet.dart';
import 'package:altayar/core/localization/locale_provider.dart';

class CustomerHomeDestinations {
  const CustomerHomeDestinations({
    required this.offersIndex,
    required this.membershipIndex,
    required this.inboxIndex,
    required this.moreIndex,
  });

  final int offersIndex;
  final int membershipIndex;
  final int inboxIndex;
  final int moreIndex;
}

class CustomerHomePage extends StatefulWidget {
  const CustomerHomePage({
    super.key,
    required this.destinations,
    this.onNavigate,
  });

  final CustomerHomeDestinations destinations;
  final void Function(int index)? onNavigate;

  @override
  State<CustomerHomePage> createState() => _CustomerHomePageState();
}

class _CustomerHomePageState extends State<CustomerHomePage> {
  final PageController _heroController = PageController(viewportFraction: .9);
  final NumberFormat _currency = NumberFormat.currency(
    symbol: '',
    decimalDigits: 0,
  );

  int _currentBanner = 0;
  bool _isRefreshing = false;
  Timer? _heroTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
      _startHeroAutoRotate();
    });
  }

  @override
  void dispose() {
    _heroTimer?.cancel();
    _heroController.dispose();
    super.dispose();
  }

  void _startHeroAutoRotate() {
    _heroTimer?.cancel();
    _heroTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (_heroController.hasClients && mounted) {
        final adProvider = context.read<AdProvider>();
        final ads = adProvider.activeAds;
        final items = ads.isEmpty ? 1 : ads.length;
        if (items > 1) {
          final nextIndex = (_currentBanner + 1) % items;
          _heroController.animateToPage(
            nextIndex,
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
          );
        }
      }
    });
  }

  Future<void> _loadData({bool refresh = false}) async {
    if (!mounted) return;
    setState(() => _isRefreshing = true);
    final futures = <Future<void>>[
      context.read<MembershipCardProvider>().loadCard(),
      context.read<AccountingProvider>().loadAll(refresh: refresh),
      context.read<VoucherProvider>().loadData(refresh: refresh),
      context.read<PackageProvider>().loadPackages(refresh: refresh),
      context.read<AdProvider>().loadAds(refresh: refresh),
    ];
    try {
      await Future.wait(futures);
    } catch (_) {
      // Swallow individual network errors; UI can rely on cached data.
    }
    if (mounted) {
      setState(() => _isRefreshing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final membershipCardProvider = context.watch<MembershipCardProvider>();
    final accountingProvider = context.watch<AccountingProvider>();
    final voucherProvider = context.watch<VoucherProvider>();
    final packageProvider = context.watch<PackageProvider>();
    final adProvider = context.watch<AdProvider>();

    final card = membershipCardProvider.card;
    final wallet = accountingProvider.wallet;
    final transactions = accountingProvider.transactions;
    final vouchers = voucherProvider.myVouchers;
    final packages = packageProvider.packages;
    final ads = adProvider.activeAds;

    final cashbackBalance =
        wallet?.cashbackBalance ?? card?.cashbackBalance ?? 0;
    final pointsBalance =
        (card?.pointsBalance ?? wallet?.pointsBalance ?? 0).toDouble();
    final target = _tierGoal(card?.membershipType);
    final remaining = (target - cashbackBalance).clamp(0, target).toDouble();
    final progress = target == 0
        ? 0.0
        : (cashbackBalance / target).clamp(0.0, 1.0).toDouble();
    final daysToRenew = _daysToRenew(card?.expiryDate);
    final dueAmount = _calculatePendingDue(transactions);

    final lastUpdated =
        wallet?.lastUpdated ?? card?.subscriptionDate ?? DateTime.now();

    return RefreshIndicator(
      onRefresh: () => _loadData(refresh: true),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.primary.withValues(alpha: 0.08),
              Colors.white,
              AppColors.secondary.withValues(alpha: 0.05),
              AppColors.primary.withValues(alpha: 0.03),
            ],
            stops: const [0.0, 0.3, 0.7, 1.0],
          ),
        ),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: _AppHeader(
                packages: packages,
                vouchers: vouchers,
                packageProvider: packageProvider,
                onNavigate: widget.onNavigate,
                destinations: widget.destinations,
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Section 1: Greeting - Light Blue Gradient
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary.withValues(alpha: 0.06),
                          AppColors.primary.withValues(alpha: 0.02),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: _GreetingHeader(
                        userName: auth.currentUser?.name ?? 'ضيفنا'),
                  ),
                  const SizedBox(height: 20),
                  // Section 2: Suggestions - Purple Gradient
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.secondary.withValues(alpha: 0.08),
                          AppColors.secondary.withValues(alpha: 0.03),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: _SuggestionsCarousel(
                      packages: packages.take(5).toList(),
                      packageProvider: packageProvider,
                      onPackageTap: (pkg) {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          builder: (_) => ChangeNotifierProvider.value(
                            value: packageProvider,
                            child: PackageDetailModal(
                              packageId: pkg.id,
                              initialPackage: pkg,
                              onExplore: widget.onNavigate != null
                                  ? () => widget.onNavigate
                                      ?.call(widget.destinations.offersIndex)
                                  : null,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Section 3: Hero Carousel - Orange Gradient
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.orange.withValues(alpha: 0.08),
                          Colors.orange.withValues(alpha: 0.03),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: _buildHeroCarousel(context, ads),
                  ),
                  const SizedBox(height: 20),
                  // Section 4: Membership Card - Gold Gradient
                  if (card != null)
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.amber.withValues(alpha: 0.1),
                            Colors.amber.withValues(alpha: 0.04),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      padding: const EdgeInsets.all(16),
                      child: GestureDetector(
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const MembershipDashboardPage(),
                          ),
                        ),
                        child: _MembershipCardSection(card: card),
                      ),
                    ),
                  const SizedBox(height: 16),
                  // Section 5: Cashback Balance - Green Gradient
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.success.withValues(alpha: 0.08),
                          AppColors.success.withValues(alpha: 0.03),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: GestureDetector(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const MembershipDashboardPage(),
                        ),
                      ),
                      child: _CashbackBalanceCard(
                        isLoading: membershipCardProvider.isLoading ||
                            accountingProvider.isLoading,
                        balance: cashbackBalance,
                        target: target,
                        remaining: remaining,
                        progress: progress,
                        daysToRenew: daysToRenew,
                        membershipType: card?.membershipType,
                        onManage: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const AccountingPage(),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Section 6: Quick Actions - Teal Gradient
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.teal.withValues(alpha: 0.08),
                          Colors.teal.withValues(alpha: 0.03),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: _QuickActionsGrid(
                      dueAmount: dueAmount,
                      dueText: dueAmount == 0
                          ? 'لا يوجد مستحقات'
                          : '${_currency.format(dueAmount)} EGP',
                      pointsBalance: pointsBalance,
                      onPayNow: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const AccountingPage(),
                        ),
                      ),
                      onPoints: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const AccountingPage(),
                        ),
                      ),
                      onOffers: () => widget.onNavigate
                          ?.call(widget.destinations.offersIndex),
                      onCoupons: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const VouchersPage(),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Section 7: Weekend Offers - Pink Gradient
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.pink.withValues(alpha: 0.08),
                          Colors.pink.withValues(alpha: 0.03),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: _WeekendOffersSection(
                      packages: packages,
                      packageProvider: packageProvider,
                      onSeeAll: () => widget.onNavigate
                          ?.call(widget.destinations.offersIndex),
                      onNavigate: widget.onNavigate,
                      destinations: widget.destinations,
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Section 8: Coupons - Indigo Gradient
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.indigo.withValues(alpha: 0.08),
                          Colors.indigo.withValues(alpha: 0.03),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: _CouponsSection(
                      vouchers: vouchers,
                      isLoading: voucherProvider.isLoading,
                      onSeeAll: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const VouchersPage(),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Align(
                    alignment: Alignment.center,
                    child: Text(
                      'آخر تحديث: ${DateFormat('HH:mm').format(lastUpdated)}',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: Colors.grey[600]),
                    ),
                  ),
                  if (_isRefreshing)
                    const Padding(
                      padding: EdgeInsets.only(top: 12),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroCarousel(BuildContext context, List<AdCampaign> ads) {
    final items = ads.isEmpty
        ? [
            AdCampaign(
              id: 0,
              title: 'Pay 2 Now - Get 3',
              description: 'عروض حصرية على رحلات نهاية الأسبوع',
              isActive: true,
              createdAt: DateTime.now(),
              imageUrl: null,
            ),
          ]
        : ads;
    final theme = Theme.of(context);
    return Column(
      children: [
        SizedBox(
          height: 180,
          child: PageView.builder(
            controller: _heroController,
            itemCount: items.length,
            onPageChanged: (index) => setState(() => _currentBanner = index),
            itemBuilder: (context, index) {
              final ad = items[index];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: GestureDetector(
                  onTap: () {
                    // Navigate to offers page when banner is tapped
                    widget.onNavigate?.call(widget.destinations.offersIndex);
                  },
                  child: _HeroBanner(ad: ad),
                ),
              );
            },
          ),
        ),
        if (items.length > 1) ...[
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              items.length,
              (index) => AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: _currentBanner == index ? 18 : 8,
                height: 6,
                decoration: BoxDecoration(
                  color: _currentBanner == index
                      ? theme.colorScheme.primary
                      : theme.colorScheme.primary.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  double _tierGoal(String? membershipType) {
    switch ((membershipType ?? '').toLowerCase()) {
      case 'silver':
        return 12000;
      case 'gold':
        return 20000;
      case 'vip':
        return 40000;
      default:
        return 15000;
    }
  }

  int? _daysToRenew(DateTime? expiry) {
    if (expiry == null) return null;
    final diff = expiry.difference(DateTime.now()).inDays;
    return diff.isNegative ? 0 : diff;
  }

  double _calculatePendingDue(List<TransactionModel> transactions) {
    return transactions
        .where(
          (tx) =>
              (tx.type == TransactionType.bookingPayment ||
                  tx.type == TransactionType.invoicePayment) &&
              tx.isPending,
        )
        .fold<double>(0, (sum, tx) => sum + tx.amount.abs());
  }
}

class _AppHeader extends StatelessWidget {
  const _AppHeader({
    required this.packages,
    required this.vouchers,
    required this.packageProvider,
    this.onNavigate,
    this.destinations,
  });

  final List<TravelPackage> packages;
  final List<VoucherModel> vouchers;
  final PackageProvider packageProvider;
  final void Function(int index)? onNavigate;
  final CustomerHomeDestinations? destinations;

  @override
  Widget build(BuildContext context) {
    final notificationProvider = context.watch<NotificationProvider>();
    return Container(
      height: 120,
      decoration: BoxDecoration(
        image: const DecorationImage(
          image: AssetImage('lib/assets/images/dsqd (3).png'),
          fit: BoxFit.cover,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.primary.withValues(alpha: 0.9),
              AppColors.primary.withValues(alpha: 0.7),
            ],
          ),
        ),
        padding: const EdgeInsets.fromLTRB(20, 50, 20, 16),
        child: Row(
          children: [
            Image.asset(
              'lib/assets/images/icon.png',
              width: 40,
              height: 40,
              errorBuilder: (_, __, ___) => const SizedBox.shrink(),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'ALTAYARVIP',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Text(
                    'HERE, THERE, AND EVERYWHERE',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.9),
                          fontSize: 10,
                        ),
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.search, color: Colors.white),
              onPressed: () => _showSearchDialog(context),
            ),
            Consumer<LocaleProvider>(
              builder: (context, localeProvider, _) {
                return IconButton(
                  icon: Icon(
                    localeProvider.isArabic ? Icons.language : Icons.translate,
                    color: Colors.white,
                  ),
                  tooltip: localeProvider.isArabic
                      ? 'Switch to English'
                      : 'التبديل إلى العربية',
                  onPressed: () {
                    localeProvider.toggleLocale();
                  },
                );
              },
            ),
            Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined,
                      color: Colors.white),
                  onPressed: () =>
                      _showNotifications(context, notificationProvider),
                ),
                if (notificationProvider.unreadCount > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 1.5),
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 18,
                        minHeight: 18,
                      ),
                      child: Text(
                        notificationProvider.unreadCount > 99
                            ? '99+'
                            : '${notificationProvider.unreadCount}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showNotifications(
    BuildContext context,
    NotificationProvider provider,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => ChangeNotifierProvider.value(
        value: provider,
        child: const NotificationCenterSheet(),
      ),
    );
  }

  void _showSearchDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => _SearchDialog(
        packages: packages,
        vouchers: vouchers,
        packageProvider: packageProvider,
        onNavigate: onNavigate,
        destinations: destinations,
      ),
    );
  }
}

class _SearchDialog extends StatefulWidget {
  const _SearchDialog({
    required this.packages,
    required this.vouchers,
    required this.packageProvider,
    this.onNavigate,
    this.destinations,
  });

  final List<TravelPackage> packages;
  final List<VoucherModel> vouchers;
  final PackageProvider packageProvider;
  final void Function(int index)? onNavigate;
  final CustomerHomeDestinations? destinations;

  @override
  State<_SearchDialog> createState() => _SearchDialogState();
}

class _SearchDialogState extends State<_SearchDialog> {
  final TextEditingController _searchController = TextEditingController();
  List<TravelPackage> _filteredPackages = [];
  List<VoucherModel> _filteredVouchers = [];
  bool _hasSearched = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _performSearch(String query) {
    if (query.trim().isEmpty) {
      setState(() {
        _filteredPackages = [];
        _filteredVouchers = [];
        _hasSearched = false;
      });
      return;
    }

    final lowerQuery = query.toLowerCase();
    setState(() {
      _filteredPackages = widget.packages
          .where((pkg) =>
              pkg.title.toLowerCase().contains(lowerQuery) ||
              pkg.description.toLowerCase().contains(lowerQuery) ||
              (pkg.destination?.toLowerCase().contains(lowerQuery) ?? false))
          .toList();
      _filteredVouchers = widget.vouchers
          .where((voucher) =>
              voucher.code.toLowerCase().contains(lowerQuery) ||
              (voucher.description?.toLowerCase().contains(lowerQuery) ??
                  false))
          .toList();
      _hasSearched = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.8,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      autofocus: true,
                      decoration: InputDecoration(
                        hintText: 'ابحث عن عروض أو كوبونات...',
                        prefixIcon: const Icon(Icons.search),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear),
                                onPressed: () {
                                  _searchController.clear();
                                  _performSearch('');
                                },
                              )
                            : null,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onChanged: (value) {
                        setState(() {});
                        _performSearch(value);
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            Flexible(
              child: _hasSearched
                  ? _filteredPackages.isEmpty && _filteredVouchers.isEmpty
                      ? const Padding(
                          padding: EdgeInsets.all(24),
                          child: Text(
                            'لا توجد نتائج للبحث',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey,
                            ),
                          ),
                        )
                      : ListView(
                          shrinkWrap: true,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          children: [
                            if (_filteredPackages.isNotEmpty) ...[
                              const Padding(
                                padding: EdgeInsets.symmetric(vertical: 8),
                                child: Text(
                                  'العروض',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              ..._filteredPackages.map((pkg) => ListTile(
                                    leading: pkg.images.isNotEmpty
                                        ? ClipRRect(
                                            borderRadius:
                                                BorderRadius.circular(8),
                                            child: Image.network(
                                              pkg.images.first,
                                              width: 50,
                                              height: 50,
                                              fit: BoxFit.cover,
                                              errorBuilder: (_, __, ___) =>
                                                  const Icon(Icons.card_travel),
                                            ),
                                          )
                                        : const Icon(Icons.card_travel),
                                    title: Text(pkg.title),
                                    subtitle: Text(
                                      '${pkg.price.toStringAsFixed(0)} EGP',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                    onTap: () {
                                      Navigator.pop(context);
                                      showModalBottomSheet(
                                        context: context,
                                        isScrollControlled: true,
                                        builder: (_) =>
                                            ChangeNotifierProvider.value(
                                          value: widget.packageProvider,
                                          child: PackageDetailModal(
                                            packageId: pkg.id,
                                            initialPackage: pkg,
                                            onExplore: widget.onNavigate !=
                                                        null &&
                                                    widget.destinations != null
                                                ? () => widget.onNavigate?.call(
                                                    widget.destinations!
                                                        .offersIndex)
                                                : null,
                                          ),
                                        ),
                                      );
                                    },
                                  )),
                            ],
                            if (_filteredVouchers.isNotEmpty) ...[
                              const Padding(
                                padding: EdgeInsets.symmetric(vertical: 8),
                                child: Text(
                                  'الكوبونات',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              ..._filteredVouchers.map((voucher) => ListTile(
                                    leading: Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        gradient: LinearGradient(
                                          colors: voucher.isExpired
                                              ? AppColors.errorGradient
                                              : AppColors.successGradient,
                                        ),
                                      ),
                                      child: const Icon(
                                        Icons.local_offer,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                    ),
                                    title: Text(voucher.code),
                                    subtitle: Text(
                                      voucher.description ?? 'خصم خاص',
                                    ),
                                    trailing: Text(
                                      voucher.isExpired ? 'منتهي' : 'متاح',
                                      style: TextStyle(
                                        color: voucher.isExpired
                                            ? AppColors.error
                                            : AppColors.success,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  )),
                            ],
                          ],
                        )
                  : const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }
}

class _GreetingHeader extends StatelessWidget {
  const _GreetingHeader({required this.userName});

  final String userName;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.currentUser;
    final profilePictureUrl = user?.profilePictureUrl;

    final firstName =
        userName.trim().isEmpty ? 'صديقنا' : userName.split(' ').first;
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: AppColors.primaryGradient,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            padding: const EdgeInsets.all(2),
            child: CircleAvatar(
              radius: 26,
              backgroundColor: Colors.white,
              child: profilePictureUrl != null && profilePictureUrl.isNotEmpty
                  ? ClipOval(
                      child: Image.network(
                        profilePictureUrl,
                        width: 52,
                        height: 52,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Icon(
                            Icons.person,
                            size: 26,
                            color: AppColors.primary,
                          );
                        },
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return SizedBox(
                            width: 26,
                            height: 26,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              value: loadingProgress.expectedTotalBytes != null
                                  ? loadingProgress.cumulativeBytesLoaded /
                                      loadingProgress.expectedTotalBytes!
                                  : null,
                            ),
                          );
                        },
                      ),
                    )
                  : Icon(
                      Icons.person,
                      size: 26,
                      color: AppColors.primary,
                    ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'أهلاً $firstName!',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.dark,
                      ),
                ),
                Text(
                  'استمتع بعروض ALTAYAR.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[700],
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

class _HeroBanner extends StatelessWidget {
  const _HeroBanner({required this.ad});

  final AdCampaign ad;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AnimatedCard(
      borderRadius: BorderRadius.circular(24),
      margin: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: AppColors.primaryGradient,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            image: ad.imageUrl != null
                ? DecorationImage(
                    image: NetworkImage(ad.imageUrl!),
                    fit: BoxFit.cover,
                    colorFilter: ColorFilter.mode(
                      Colors.black.withValues(alpha: 0.4),
                      BlendMode.darken,
                    ),
                  )
                : null,
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.3),
                    width: 1,
                  ),
                ),
                child: Text(
                  'عرض خاص',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Flexible(
                child: Text(
                  ad.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 22,
                    shadows: [
                      Shadow(
                        color: Colors.black.withValues(alpha: 0.3),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Flexible(
                child: Text(
                  ad.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: 0.95),
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MembershipCardSection extends StatelessWidget {
  const _MembershipCardSection({required this.card});

  final MembershipCard card;

  @override
  Widget build(BuildContext context) {
    return GradientCard(
      colors: [
        Colors.grey.shade300,
        Colors.grey.shade100,
        Colors.white,
      ],
      borderRadius: BorderRadius.circular(26),
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: AppColors.primaryGradient,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(
              Icons.workspace_premium_outlined,
              size: 28,
              color: Colors.white,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${card.membershipType} Membership',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.dark,
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  card.membershipNumber,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[700],
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.5),
            ),
            child: Icon(
              Icons.chevron_right,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class _CashbackBalanceCard extends StatelessWidget {
  const _CashbackBalanceCard({
    required this.isLoading,
    required this.balance,
    required this.target,
    required this.remaining,
    required this.progress,
    required this.daysToRenew,
    this.membershipType,
    required this.onManage,
  });

  final bool isLoading;
  final double balance;
  final double target;
  final double remaining;
  final double progress;
  final int? daysToRenew;
  final String? membershipType;
  final VoidCallback onManage;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final formatter = NumberFormat.currency(symbol: '', decimalDigits: 0);
    return GlassCard(
      borderRadius: BorderRadius.circular(28),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Cashback Balance',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.dark,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: AppColors.primaryGradient,
                  ),
                ),
                child: const Icon(
                  Icons.credit_card,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: formatter.format(remaining),
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
                TextSpan(
                  text: ' left of ${formatter.format(target)} USD',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[700],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Container(
              height: 12,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Stack(
                children: [
                  FractionallySizedBox(
                    widthFactor: progress,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: AppColors.primaryGradient,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Text(
                  membershipType != null && membershipType!.isNotEmpty
                      ? 'عضويتك: $membershipType'
                      : daysToRenew == null
                          ? 'لا توجد عضوية مفعّلة'
                          : '${daysToRenew!} يوم للتجديد',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[700],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              GradientButton(
                label: 'إدارة',
                onPressed: isLoading ? null : onManage,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickActionsGrid extends StatelessWidget {
  const _QuickActionsGrid({
    required this.dueAmount,
    required this.dueText,
    required this.pointsBalance,
    required this.onPayNow,
    required this.onPoints,
    required this.onOffers,
    required this.onCoupons,
  });

  final double dueAmount;
  final String dueText;
  final double pointsBalance;
  final VoidCallback onPayNow;
  final VoidCallback onPoints;
  final VoidCallback onOffers;
  final VoidCallback onCoupons;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 14,
      crossAxisSpacing: 14,
      childAspectRatio: 1.3,
      children: [
        _ActionCard(
          title: 'Payments',
          value: dueText,
          badge: dueAmount > 0 ? 'Active' : 'Clear',
          accent: Colors.green,
          icon: Icons.payments_outlined,
          onTap: onPayNow,
        ),
        _ActionCard(
          title: 'My Points',
          value: pointsBalance.toStringAsFixed(0),
          badge: 'Balance',
          accent: Colors.indigo,
          icon: Icons.stars_outlined,
          onTap: onPoints,
        ),
        _ActionCard(
          title: 'Weekend Offers',
          value: 'اكتشف الآن',
          badge: 'New',
          accent: Colors.teal,
          icon: Icons.card_travel,
          onTap: onOffers,
        ),
        _ActionCard(
          title: 'Coupons & Discounts',
          value: 'خصومات حصرية',
          badge: 'Hot',
          accent: Colors.orange,
          icon: Icons.local_offer_outlined,
          onTap: onCoupons,
        ),
      ],
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.title,
    required this.value,
    required this.badge,
    required this.accent,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String value;
  final String badge;
  final Color accent;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AnimatedCard(
      borderRadius: BorderRadius.circular(24),
      margin: EdgeInsets.zero,
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: LinearGradient(
            colors: [
              accent.withValues(alpha: 0.12),
              accent.withValues(alpha: 0.06),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(
            color: accent.withValues(alpha: 0.2),
            width: 1,
          ),
        ),
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: accent.withValues(alpha: 0.15),
                  ),
                  child: Icon(icon, color: accent, size: 20),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(30),
                    gradient: LinearGradient(
                      colors: [accent, accent.withValues(alpha: 0.8)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: accent.withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    badge,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const Spacer(),
            Text(
              title,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[700],
                    fontWeight: FontWeight.w500,
                  ),
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.dark,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WeekendOffersSection extends StatefulWidget {
  const _WeekendOffersSection({
    required this.packages,
    required this.packageProvider,
    required this.onSeeAll,
    this.onNavigate,
    this.destinations,
  });

  final List<TravelPackage> packages;
  final PackageProvider packageProvider;
  final VoidCallback onSeeAll;
  final void Function(int index)? onNavigate;
  final CustomerHomeDestinations? destinations;

  @override
  State<_WeekendOffersSection> createState() => _WeekendOffersSectionState();
}

class _WeekendOffersSectionState extends State<_WeekendOffersSection> {
  late PageController _pageController;
  Timer? _timer;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    final featured = widget.packages.take(10).toList();
    _pageController = PageController(viewportFraction: 0.85);
    if (featured.length > 1) {
      _startAutoRotate();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoRotate() {
    final featured = widget.packages.take(10).toList();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (_pageController.hasClients && featured.isNotEmpty) {
        final nextIndex = (_currentIndex + 1) % featured.length;
        _pageController.animateToPage(
          nextIndex,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.packages.isEmpty) {
      return _SectionFrame(
        title: 'عروض الإجازة',
        onSeeAll: widget.onSeeAll,
        child: const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Text('لا توجد عروض حالياً'),
          ),
        ),
      );
    }
    final featured = widget.packages.take(10).toList();
    return _SectionFrame(
      title: 'عروض الإجازة',
      onSeeAll: widget.onSeeAll,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: 220,
            child: featured.length > 1
                ? PageView.builder(
                    controller: _pageController,
                    onPageChanged: (index) {
                      setState(() => _currentIndex = index);
                    },
                    itemCount: featured.length,
                    itemBuilder: (context, index) {
                      final pkg = featured[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: _buildPackageCard(context, pkg),
                      );
                    },
                  )
                : featured.isEmpty
                    ? const SizedBox.shrink()
                    : _buildPackageCard(context, featured.first),
          ),
          if (featured.length > 1) ...[
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                featured.length,
                (index) => AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _currentIndex == index ? 20 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _currentIndex == index
                        ? AppColors.primary
                        : AppColors.primary.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPackageCard(BuildContext context, TravelPackage pkg) {
    final image = pkg.images.isNotEmpty ? pkg.images.first : null;
    return AnimatedCard(
      borderRadius: BorderRadius.circular(24),
      margin: EdgeInsets.zero,
      onTap: () {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          builder: (_) => ChangeNotifierProvider.value(
            value: widget.packageProvider,
            child: PackageDetailModal(
              packageId: pkg.id,
              initialPackage: pkg,
              onExplore: widget.onNavigate != null &&
                      widget.destinations != null
                  ? () =>
                      widget.onNavigate?.call(widget.destinations!.offersIndex)
                  : null,
            ),
          ),
        );
      },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: BoxDecoration(
            image: image != null
                ? DecorationImage(
                    image: NetworkImage(image),
                    fit: BoxFit.cover,
                    colorFilter: ColorFilter.mode(
                      Colors.black.withValues(alpha: 0.25),
                      BlendMode.darken,
                    ),
                  )
                : null,
            gradient: image == null
                ? LinearGradient(
                    colors: [
                      AppColors.primary.withValues(alpha: 0.9),
                      AppColors.secondary.withValues(alpha: 0.9),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.6),
                    ],
                  ),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.3),
                blurRadius: 15,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.4),
                      width: 1.5,
                    ),
                  ),
                  child: Text(
                    'عرض مميز',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                  ),
                ),
                const Spacer(),
                Flexible(
                  child: Text(
                    pkg.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      shadows: [
                        Shadow(
                          color: Colors.black.withValues(alpha: 0.5),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.95),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    '${pkg.price.toStringAsFixed(0)} EGP',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SuggestionsCarousel extends StatefulWidget {
  const _SuggestionsCarousel({
    required this.packages,
    required this.packageProvider,
    required this.onPackageTap,
  });

  final List<TravelPackage> packages;
  final PackageProvider packageProvider;
  final void Function(TravelPackage) onPackageTap;

  @override
  State<_SuggestionsCarousel> createState() => _SuggestionsCarouselState();
}

class _SuggestionsCarouselState extends State<_SuggestionsCarousel> {
  late PageController _pageController;
  Timer? _timer;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.85);
    if (widget.packages.length > 1) {
      _startAutoRotate();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoRotate() {
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (_pageController.hasClients && widget.packages.isNotEmpty) {
        final nextIndex = (_currentIndex + 1) % widget.packages.length;
        _pageController.animateToPage(
          nextIndex,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.packages.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Text(
            'مقترحات لك',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.dark,
                ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 200,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() => _currentIndex = index);
            },
            itemCount: widget.packages.length,
            itemBuilder: (context, index) {
              final pkg = widget.packages[index];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: AnimatedCard(
                  borderRadius: BorderRadius.circular(20),
                  onTap: () => widget.onPackageTap(pkg),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: pkg.images.isNotEmpty
                            ? Image.network(
                                pkg.images.first,
                                height: 200,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                loadingBuilder: (context, child, progress) {
                                  if (progress == null) return child;
                                  return Container(
                                    height: 200,
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: AppColors.primaryGradient,
                                      ),
                                    ),
                                    child: Center(
                                      child: CircularProgressIndicator(
                                        value: progress.expectedTotalBytes !=
                                                null
                                            ? progress.cumulativeBytesLoaded /
                                                progress.expectedTotalBytes!
                                            : null,
                                        color: Colors.white,
                                      ),
                                    ),
                                  );
                                },
                                errorBuilder: (_, __, ___) => Container(
                                  height: 200,
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: AppColors.primaryGradient,
                                    ),
                                  ),
                                  child: const Icon(
                                    Icons.flight_takeoff,
                                    size: 48,
                                    color: Colors.white,
                                  ),
                                ),
                              )
                            : Container(
                                height: 200,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: AppColors.primaryGradient,
                                  ),
                                ),
                                child: const Icon(
                                  Icons.flight_takeoff,
                                  size: 48,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withValues(alpha: 0.7),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        left: 0,
                        right: 0,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Flexible(
                                child: Text(
                                  pkg.title,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    shadows: [
                                      Shadow(
                                        color:
                                            Colors.black.withValues(alpha: 0.5),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${pkg.price.toStringAsFixed(0)} EGP',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleSmall
                                    ?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                  shadows: [
                                    Shadow(
                                      color:
                                          Colors.black.withValues(alpha: 0.5),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        if (widget.packages.length > 1) ...[
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              widget.packages.length,
              (index) => AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: _currentIndex == index ? 20 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: _currentIndex == index
                      ? AppColors.primary
                      : AppColors.primary.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _CouponsSection extends StatefulWidget {
  const _CouponsSection({
    required this.vouchers,
    required this.isLoading,
    required this.onSeeAll,
  });

  final List<VoucherModel> vouchers;
  final bool isLoading;
  final VoidCallback onSeeAll;

  @override
  State<_CouponsSection> createState() => _CouponsSectionState();
}

class _CouponsSectionState extends State<_CouponsSection> {
  late PageController _pageController;
  Timer? _timer;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    final displayedVouchers = widget.vouchers.take(5).toList();
    if (displayedVouchers.length > 1) {
      _pageController = PageController(viewportFraction: 0.9);
      _startAutoRotate();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoRotate() {
    final displayedVouchers = widget.vouchers.take(5).toList();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (_pageController.hasClients && displayedVouchers.isNotEmpty) {
        final nextIndex = (_currentIndex + 1) % displayedVouchers.length;
        _pageController.animateToPage(
          nextIndex,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return _SectionFrame(
      title: 'الخصومات والكوبونات',
      onSeeAll: widget.onSeeAll,
      child: widget.isLoading
          ? const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(child: CircularProgressIndicator()),
            )
          : widget.vouchers.isEmpty
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Text('لا توجد كوبونات نشطة'),
                )
              : SizedBox(
                  height: 140,
                  child: widget.vouchers.length > 1
                      ? PageView.builder(
                          controller: _pageController,
                          onPageChanged: (index) {
                            setState(() => _currentIndex = index);
                          },
                          itemCount: widget.vouchers.take(5).length,
                          itemBuilder: (context, index) {
                            final voucher = widget.vouchers[index];
                            return Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 8),
                              child: _buildCouponCard(context, voucher),
                            );
                          },
                        )
                      : widget.vouchers.isEmpty
                          ? const SizedBox.shrink()
                          : _buildCouponCard(context, widget.vouchers.first),
                ),
    );
  }

  Widget _buildCouponCard(BuildContext context, VoucherModel voucher) {
    return AnimatedCard(
      borderRadius: BorderRadius.circular(20),
      margin: EdgeInsets.zero,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            colors: voucher.isExpired
                ? [
                    Colors.grey.shade300,
                    Colors.grey.shade200,
                  ]
                : [
                    AppColors.success.withValues(alpha: 0.15),
                    AppColors.success.withValues(alpha: 0.05),
                  ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(
            color: voucher.isExpired
                ? Colors.grey.shade400
                : AppColors.success.withValues(alpha: 0.3),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: (voucher.isExpired ? Colors.grey : AppColors.success)
                  .withValues(alpha: 0.2),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: LinearGradient(
                  colors: voucher.isExpired
                      ? AppColors.errorGradient
                      : AppColors.successGradient,
                ),
                boxShadow: [
                  BoxShadow(
                    color: (voucher.isExpired
                            ? AppColors.error
                            : AppColors.success)
                        .withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.local_offer,
                color: Colors.white,
                size: 40,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Flexible(
                    child: Text(
                      voucher.code,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.dark,
                          ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Flexible(
                    child: Text(
                      voucher.description ?? 'خصم خاص بك',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[700],
                          ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: voucher.isExpired
                          ? AppColors.error.withValues(alpha: 0.1)
                          : AppColors.success.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      voucher.isExpired
                          ? 'منتهي'
                          : voucher.expiresAt != null
                              ? DateFormat('dd MMM').format(voucher.expiresAt!)
                              : 'متاح',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: voucher.isExpired
                                ? AppColors.error
                                : AppColors.success,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionFrame extends StatelessWidget {
  const _SectionFrame({
    required this.title,
    required this.child,
    required this.onSeeAll,
  });

  final String title;
  final Widget child;
  final VoidCallback onSeeAll;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            TextButton(
              onPressed: onSeeAll,
              child: const Text('See all'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        child,
      ],
    );
  }
}
