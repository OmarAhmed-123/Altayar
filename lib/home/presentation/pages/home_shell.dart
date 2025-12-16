import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/core/localization/locale_provider.dart';
import 'package:altayar/core/networking/backend_health_provider.dart';
import 'package:altayar/features/accounting/presentation/pages/accounting_page.dart';
import 'package:altayar/features/ad_manager/presentation/pages/ads_manager_page.dart';
import 'package:altayar/features/ad_manager/presentation/providers/ad_provider.dart';
import 'package:altayar/features/ad_manager/presentation/widgets/ad_popup.dart';
import 'package:altayar/features/activities/presentation/pages/activities_page.dart';
import 'package:altayar/features/booking/presentation/pages/booking_dashboard_page.dart';
import 'package:altayar/features/chat/presentation/pages/communication_page.dart';
import 'package:altayar/features/content/presentation/pages/content_page.dart';
import 'package:altayar/features/content/presentation/pages/admin_blogs_page.dart';
import 'package:altayar/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:altayar/features/membership/presentation/pages/membership_dashboard_page.dart';
import 'package:altayar/features/packages/presentation/pages/packages_page.dart';
import 'package:altayar/features/reports/presentation/pages/reports_page.dart';
import 'package:altayar/features/reports/presentation/pages/user_report_page.dart';
import 'package:altayar/features/trip_maker/presentation/pages/trip_maker_page.dart';
import 'package:altayar/features/user_management/presentation/pages/user_management_page.dart';
import 'package:altayar/features/vouchers/presentation/pages/vouchers_page.dart';
import 'package:altayar/features/settings/presentation/pages/settings_page.dart';
import 'package:altayar/features/sales/presentation/pages/sales_page.dart';
import 'package:altayar/features/profile/presentation/pages/profile_page.dart';
import 'package:altayar/home/presentation/pages/customer_home_page.dart';
import 'package:altayar/home/presentation/pages/customer_more_page.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  bool _adPopupShown = false;
  VoidCallback? _adListener;
  late final List<_NavItem> _adminItems;
  late final List<_NavItem> _customerItems;
  late final List<int> _adminMainNavIndices;
  late final CustomerHomeDestinations _customerDestinations;
  static const List<int> _customerMainNavIndices = [0, 1, 2, 3, 4];
  bool _showQuickLauncher = false;
  static const int _adminChatIndex = 6;
  static const int _adminSettingsIndex = 14;
  int? _highlightedPackageId;

  @override
  void initState() {
    super.initState();
    _adminItems = [
      _NavItem(
        ar: 'لوحة التحكم',
        en: 'Dashboard',
        icon: Icons.dashboard_customize_outlined,
        builder: () => DashboardPage(onNavigate: _handleShortcutNavigation),
      ),
      _NavItem(
        ar: 'العضويات',
        en: 'Memberships',
        icon: Icons.workspace_premium_outlined,
        builder: () => const MembershipDashboardPage(),
      ),
      _NavItem(
        ar: 'الصلاحيات',
        en: 'RBAC',
        icon: Icons.admin_panel_settings_outlined,
        builder: () => const UserManagementPage(),
      ),
      _NavItem(
        ar: 'الحجوزات',
        en: 'Bookings',
        icon: Icons.event_available_outlined,
        builder: () => const BookingDashboardPage(),
      ),
      _NavItem(
        ar: 'النشاط',
        en: 'Activity',
        icon: Icons.history,
        builder: () => const ActivitiesPage(),
      ),
      _NavItem(
        ar: 'المحتوى',
        en: 'Content',
        icon: Icons.article_outlined,
        builder: () => const ContentPage(),
      ),
      _NavItem(
        ar: 'إدارة المدونات',
        en: 'Blog Management',
        icon: Icons.edit_note,
        builder: () => const AdminBlogsPage(),
      ),
      _NavItem(
        ar: 'التواصل',
        en: 'Chat',
        icon: Icons.forum_outlined,
        builder: () => const CommunicationPage(),
      ),
      _NavItem(
        ar: 'الإعلانات',
        en: 'Ads',
        icon: Icons.campaign_outlined,
        builder: () => const AdsManagerPage(),
      ),
      _NavItem(
        ar: 'القسائم',
        en: 'Vouchers',
        icon: Icons.card_giftcard_outlined,
        builder: () => const VouchersPage(),
      ),
      _NavItem(
        ar: 'المحفظة',
        en: 'Wallet',
        icon: Icons.account_balance_wallet_outlined,
        builder: () => const AccountingPage(),
      ),
      _NavItem(
        ar: 'التقارير',
        en: 'Reports',
        icon: Icons.receipt_long_outlined,
        builder: () => const ReportsPage(),
      ),
      _NavItem(
        ar: 'تقاريري',
        en: 'My Report',
        icon: Icons.analytics_outlined,
        builder: () => const UserReportPage(),
      ),
      _NavItem(
        ar: 'المبيعات',
        en: 'Sales',
        icon: Icons.storefront_outlined,
        builder: () => const SalesPage(),
      ),
      _NavItem(
        ar: 'الباقات',
        en: 'Packages',
        icon: Icons.card_travel,
        builder: () => const PackagesPage(),
      ),
      _NavItem(
        ar: 'صانع الرحلات',
        en: 'Trip Maker',
        icon: Icons.design_services_outlined,
        builder: () => const TripMakerPage(),
      ),
      _NavItem(
        ar: 'الإعدادات',
        en: 'Settings',
        icon: Icons.settings_suggest_outlined,
        builder: () => const SettingsPage(),
      ),
    ];
    _adminMainNavIndices = [
      0, // Dashboard
      3, // Bookings
      _adminChatIndex,
      12, // Packages
      _adminSettingsIndex,
    ];
    _customerDestinations = const CustomerHomeDestinations(
      offersIndex: 1,
      membershipIndex: 2,
      inboxIndex: 3,
      moreIndex: 4,
    );
    _customerItems = [
      _NavItem(
        ar: 'الرئيسية',
        en: 'Home',
        icon: Icons.home_outlined,
        builder: () => CustomerHomePage(
          destinations: _customerDestinations,
          onNavigate: _handleShortcutNavigation,
        ),
      ),
      _NavItem(
        ar: 'العروض',
        en: 'Offers',
        icon: Icons.local_offer_outlined,
        builder: () =>
            BookingDashboardPage(highlightPackageId: _highlightedPackageId),
      ),
      _NavItem(
        ar: 'ملفي',
        en: 'Profile',
        icon: Icons.person_outline,
        builder: () => const ProfilePage(),
      ),
      _NavItem(
        ar: 'المراسلات',
        en: 'Inbox',
        icon: Icons.forum_outlined,
        builder: () => const CommunicationPage(),
      ),
      _NavItem(
        ar: 'المزيد',
        en: 'More',
        icon: Icons.more_horiz,
        builder: () => const CustomerMorePage(),
      ),
    ];
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<AdProvider>();
      provider.loadAds();
      _adListener = () => _maybeShowAd(provider);
      provider.addListener(_adListener!);
      _maybeShowAd(provider);
      context.read<BackendHealthProvider>().check();
    });
  }

  @override
  void dispose() {
    final provider = context.read<AdProvider>();
    if (_adListener != null) {
      provider.removeListener(_adListener!);
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isCustomer =
        (auth.currentUser?.role ?? '').toLowerCase() == 'customer';
    final items = isCustomer ? _customerItems : _adminItems;
    final navIndices =
        isCustomer ? _customerMainNavIndices : _adminMainNavIndices;
    if (_index >= items.length) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() => _index = 0);
        }
      });
    }
    final localeProvider = context.watch<LocaleProvider>();
    final backendHealth = context.watch<BackendHealthProvider>();
    return Scaffold(
      body: Stack(
        children: [
          Column(
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: backendHealth.isHealthy == false
                    ? _BackendHealthBanner(provider: backendHealth)
                    : const SizedBox.shrink(),
              ),
              Expanded(
                child: IndexedStack(
                  index: _index,
                  children: items.map((item) => item.builder()).toList(),
                ),
              ),
            ],
          ),
          if (!isCustomer && _showQuickLauncher)
            _QuickLauncherPanel(
              items: items,
              selectedIndex: _index,
              onSelect: (value) {
                setState(() {
                  _index = value;
                  _showQuickLauncher = false;
                });
              },
              onClose: () => setState(() => _showQuickLauncher = false),
              onToggleLocale: () {
                localeProvider.toggleLocale();
                setState(() => _showQuickLauncher = false);
              },
              onLogout: () async {
                await context.read<AuthProvider>().logout();
                if (mounted) {
                  setState(() => _showQuickLauncher = false);
                }
              },
            ),
        ],
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(32),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Theme.of(context).colorScheme.surface.withAlpha(235),
                    Theme.of(context)
                        .colorScheme
                        .surfaceContainerHighest
                        .withAlpha(215),
                  ],
                ),
                borderRadius: BorderRadius.circular(32),
                border: Border.all(
                  color: Theme.of(context)
                      .colorScheme
                      .onSurface
                      .withAlpha((255 * .05).round()),
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 18,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: NavigationBarTheme(
                data: NavigationBarThemeData(
                  indicatorColor: Theme.of(context)
                      .colorScheme
                      .primary
                      .withAlpha((255 * .16).round()),
                  labelTextStyle: WidgetStateProperty.resolveWith((states) {
                    final base = Theme.of(context).textTheme.labelSmall;
                    if (states.contains(WidgetState.selected)) {
                      return base?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.primary,
                      );
                    }
                    return base?.copyWith(
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withAlpha((255 * .7).round()),
                    );
                  }),
                ),
                child: NavigationBar(
                  height: 76,
                  backgroundColor: Colors.transparent,
                  labelBehavior:
                      NavigationDestinationLabelBehavior.onlyShowSelected,
                  selectedIndex: _selectedMainIndex(navIndices),
                  onDestinationSelected: (value) => setState(
                    () => _index = navIndices[value],
                  ),
                  destinations: _buildDestinations(
                    context,
                    items,
                    navIndices,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      floatingActionButtonLocation:
          isCustomer ? null : FloatingActionButtonLocation.startFloat,
      floatingActionButton: _buildFab(isCustomer),
    );
  }

  Widget? _buildFab(bool isCustomer) {
    if (isCustomer) return null;
    if (_index == _adminChatIndex && !_showQuickLauncher) {
      return FloatingActionButton.small(
        heroTag: 'menuFab',
        onPressed: () => setState(() => _showQuickLauncher = true),
        child: const Icon(Icons.menu),
      );
    }
    return FloatingActionButton.extended(
      heroTag: 'menuFab',
      onPressed: () => setState(() => _showQuickLauncher = !_showQuickLauncher),
      icon: Icon(_showQuickLauncher ? Icons.close : Icons.menu),
      label: Text(_showQuickLauncher ? 'إغلاق' : 'القائمة'),
    );
  }

  List<NavigationDestination> _buildDestinations(
    BuildContext context,
    List<_NavItem> items,
    List<int> indices,
  ) {
    final isArabic = Localizations.localeOf(context).languageCode == 'ar';
    final auth = context.watch<AuthProvider>();
    final isCustomer =
        (auth.currentUser?.role ?? '').toLowerCase() == 'customer';
    return indices.map((itemIndex) {
      final item = items[itemIndex];
      // Use custom icon for Home (first item for customers)
      final isHome = itemIndex == 0 && isCustomer;
      return NavigationDestination(
        icon: isHome
            ? Image.asset(
                'lib/assets/images/icon.png',
                width: 24,
                height: 24,
                errorBuilder: (_, __, ___) => Icon(item.icon),
              )
            : Icon(item.icon),
        selectedIcon: isHome
            ? Image.asset(
                'lib/assets/images/icon.png',
                width: 24,
                height: 24,
                color: Theme.of(context).colorScheme.primary,
                errorBuilder: (_, __, ___) => Icon(
                  item.icon,
                  color: Theme.of(context).colorScheme.primary,
                ),
              )
            : Icon(
                item.icon,
                color: Theme.of(context).colorScheme.primary,
              ),
        label: isArabic ? item.ar : item.en,
      );
    }).toList();
  }

  int _selectedMainIndex(List<int> navIndices) {
    final current = navIndices.indexOf(_index);
    return current >= 0 ? current : 0;
  }

  void _handleShortcutNavigation(int index) {
    final auth = context.read<AuthProvider>();
    final isCustomer =
        (auth.currentUser?.role ?? '').toLowerCase() == 'customer';
    final items = isCustomer ? _customerItems : _adminItems;
    if (index >= 0 && index < items.length) {
      setState(() => _index = index);
    }
  }

  Future<void> _maybeShowAd(AdProvider provider) async {
    if (_adPopupShown) return;
    final ads = provider.activeAds;
    if (ads.isEmpty || !mounted) return;
    final auth = context.read<AuthProvider>();
    final isCustomer =
        (auth.currentUser?.role ?? '').toLowerCase() == 'customer';
    // لا تعرض الإعلانات للمسؤولين
    if (!isCustomer) {
      return;
    }
    _adPopupShown = true;
    await showAdPopup(
      context,
      ads,
      onNavigate: _handleShortcutNavigation,
      offersIndex: _customerDestinations.offersIndex,
    );
  }
}

class _BackendHealthBanner extends StatelessWidget {
  const _BackendHealthBanner({required this.provider});

  final BackendHealthProvider provider;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: Colors.red.withAlpha((255 * .08).round()),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          children: [
            const Icon(Icons.cloud_off, color: Colors.redAccent),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'تعذر الاتصال بالخادم',
                    style: theme.textTheme.titleSmall
                        ?.copyWith(color: Colors.red[800]),
                  ),
                  if (provider.message != null)
                    Text(
                      provider.message!,
                      style: theme.textTheme.bodySmall,
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            FilledButton.tonalIcon(
              onPressed: provider.isChecking ? null : () => provider.check(),
              icon: provider.isChecking
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.refresh),
              label: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem {
  const _NavItem({
    required this.ar,
    required this.en,
    required this.icon,
    required this.builder,
  });

  final String ar;
  final String en;
  final IconData icon;
  final Widget Function() builder;
}

class _QuickLauncherPanel extends StatelessWidget {
  const _QuickLauncherPanel({
    required this.items,
    required this.selectedIndex,
    required this.onSelect,
    required this.onClose,
    required this.onToggleLocale,
    required this.onLogout,
  });

  final List<_NavItem> items;
  final int selectedIndex;
  final ValueChanged<int> onSelect;
  final VoidCallback onClose;
  final VoidCallback onToggleLocale;
  final Future<void> Function() onLogout;

  @override
  Widget build(BuildContext context) {
    final isArabic = Localizations.localeOf(context).languageCode == 'ar';
    return Stack(
      children: [
        Positioned.fill(
          child: GestureDetector(
            onTap: onClose,
            child: Container(color: Colors.black54),
          ),
        ),
        Align(
          alignment: Alignment.centerLeft,
          child: SafeArea(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 320),
              child: Card(
                margin: const EdgeInsets.all(16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(28),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: ListView(
                    shrinkWrap: true,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 8,
                        ),
                        child: Text(
                          isArabic ? 'القائمة السريعة' : 'Quick Launcher',
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ),
                      const Divider(),
                      ...List.generate(items.length, (index) {
                        final item = items[index];
                        final selected = index == selectedIndex;
                        return ListTile(
                          leading: Icon(
                            item.icon,
                            color: selected
                                ? Theme.of(context).colorScheme.primary
                                : null,
                          ),
                          title: Text(isArabic ? item.ar : item.en),
                          selected: selected,
                          onTap: () => onSelect(index),
                        );
                      }),
                      const Divider(),
                      Builder(
                        builder: (context) => ListTile(
                          leading: const Icon(Icons.translate),
                          title: Text(
                            isArabic ? 'تغيير اللغة' : 'Switch Language',
                          ),
                          onTap: () {
                            onToggleLocale();
                            Navigator.of(context).pop();
                          },
                        ),
                      ),
                      ListTile(
                        leading: const Icon(Icons.logout),
                        title: Text(isArabic ? 'تسجيل الخروج' : 'Logout'),
                        onTap: () async {
                          await onLogout();
                          onClose();
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
