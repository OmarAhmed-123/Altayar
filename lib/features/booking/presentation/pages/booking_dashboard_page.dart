import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/widgets/loading_indicator.dart';
import 'package:altayar/features/packages/data/models/travel_package.dart';
import 'package:altayar/features/packages/presentation/providers/package_provider.dart';
import 'package:altayar/features/packages/presentation/widgets/package_card.dart';
import 'package:altayar/features/packages/presentation/widgets/package_detail_sheet.dart';
import 'package:altayar/features/packages/presentation/widgets/package_filter_sheet.dart';
import 'package:altayar/features/packages/presentation/providers/package_favorites_provider.dart';
import 'package:altayar/features/booking/presentation/providers/booking_provider.dart';
import 'package:altayar/features/booking/data/models/booking.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/packages/presentation/pages/add_edit_package_page.dart';
import 'package:altayar/features/packages/presentation/pages/package_bookings_page.dart';

class BookingDashboardPage extends StatefulWidget {
  const BookingDashboardPage({
    super.key,
    this.highlightPackageId,
  });

  final int? highlightPackageId;

  @override
  State<BookingDashboardPage> createState() => _BookingDashboardPageState();
}

class _BookingDashboardPageState extends State<BookingDashboardPage>
    with AutomaticKeepAliveClientMixin {
  int? _highlightedPackageId;

  @override
  void initState() {
    super.initState();
    _highlightedPackageId = widget.highlightPackageId;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PackageProvider>().loadPackages();
      // Load bookings to check paid status
      try {
        context.read<BookingProvider>().loadData();
      } catch (_) {
        // BookingProvider might not be available, ignore
      }
      // Scroll to highlighted package if exists
      if (_highlightedPackageId != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _scrollToHighlightedPackage();
        });
      }
    });
  }

  void _scrollToHighlightedPackage() {
    // This will be implemented with ScrollController if needed
    // For now, we'll just highlight it visually
  }

  bool _isAdmin(String role) {
    final normalized = role.toLowerCase();
    return normalized.contains('super_admin') ||
        normalized.contains('admin') ||
        normalized.contains('accountant');
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final provider = context.watch<PackageProvider>();
    final favoritesProvider = context.watch<PackageFavoritesProvider>();
    final bookingProvider = context.watch<BookingProvider>();
    final auth = context.watch<AuthProvider>();
    final isAdmin = _isAdmin(auth.currentUser?.role ?? '');

    // Get booked packages (paid, confirmed, or completed)
    final bookedPackageIds = bookingProvider.myBookings
        .where((booking) =>
            booking.packageId != null &&
            (booking.status == BookingStatus.paid ||
                booking.status == BookingStatus.confirmed ||
                booking.status == BookingStatus.completed))
        .map((booking) => booking.packageId!)
        .toSet();

    return Scaffold(
      appBar: AppBar(
        leading: Navigator.of(context).canPop() ? const BackButton() : null,
        title: const Text('الباقات والعروض'),
        actions: [
          if (isAdmin)
            IconButton(
              icon: const Icon(Icons.add),
              tooltip: 'إضافة باقة جديدة',
              onPressed: () => _showAddPackageDialog(context, provider),
            ),
          // Favorites icon
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.favorite_outline),
                tooltip: 'المفضلة',
                onPressed: () =>
                    _showFavorites(context, provider, favoritesProvider),
              ),
              if (favoritesProvider.favorites.isNotEmpty)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      favoritesProvider.favorites.length > 9
                          ? '9+'
                          : '${favoritesProvider.favorites.length}',
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
          // Booked packages icon
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.check_circle_outline),
                tooltip: 'حجوزاتي',
                onPressed: () => _showBookedPackages(
                    context, provider, bookingProvider, bookedPackageIds),
              ),
              if (bookedPackageIds.isNotEmpty)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      bookedPackageIds.length > 9
                          ? '9+'
                          : '${bookedPackageIds.length}',
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
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث',
            onPressed: () {
              provider.loadPackages(refresh: true);
              bookingProvider.loadData(refresh: true);
            },
          ),
        ],
      ),
      body: provider.isLoading
          ? const LoadingIndicator(message: 'جاري تحميل الباقات')
          : RefreshIndicator(
              onRefresh: () => provider.loadPackages(refresh: true),
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextField(
                            decoration: const InputDecoration(
                              hintText: 'ابحث عن وجهة أو باقة',
                              prefixIcon: Icon(Icons.search),
                            ),
                            onChanged: provider.setQuery,
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              FilterChip(
                                label: const Text('Exclusive'),
                                selected: provider.exclusiveOnly,
                                onSelected: (value) =>
                                    provider.toggleExclusive(value),
                              ),
                              const SizedBox(width: 8),
                              OutlinedButton.icon(
                                onPressed: () => showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  builder: (_) => ChangeNotifierProvider.value(
                                    value: provider,
                                    child: const PackageFilterSheet(),
                                  ),
                                ),
                                icon: const Icon(Icons.tune),
                                label: const Text('الفلاتر المتقدمة'),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          if (provider.errorMessage != null)
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color:
                                    Colors.red.withAlpha((255 * .08).round()),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(provider.errorMessage!),
                            ),
                        ],
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    sliver: SliverGrid(
                      delegate: SliverChildBuilderDelegate((context, index) {
                        final pkg = provider.filteredPackages.elementAt(index);
                        return PackageCard(
                          travelPackage: pkg,
                          isAdmin: isAdmin,
                          onTap: () => _openDetails(context, pkg),
                          isHighlighted: _highlightedPackageId == pkg.id,
                          onEdit: isAdmin
                              ? () =>
                                  _showEditPackageDialog(context, pkg, provider)
                              : null,
                          onDelete: isAdmin
                              ? () => _showDeleteConfirmation(
                                  context, pkg, provider)
                              : null,
                          onViewBookings: isAdmin
                              ? () =>
                                  _openPackageBookings(context, pkg, provider)
                              : null,
                          onViewCompletedBookings: isAdmin
                              ? () =>
                                  _openCompletedBookings(context, pkg, provider)
                              : null,
                        );
                      }, childCount: provider.filteredPackages.length),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.62,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 16,
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Future<void> _openDetails(BuildContext context, TravelPackage pkg) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => ChangeNotifierProvider.value(
        value: context.read<PackageProvider>(),
        child: PackageDetailModal(packageId: pkg.id, initialPackage: pkg),
      ),
    );
  }

  Future<void> _showAddPackageDialog(
    BuildContext context,
    PackageProvider provider,
  ) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AddEditPackagePage(
          onSave: (data) async {
            try {
              final newPackage = await provider.createPackage(data);
              if (newPackage != null && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('تم إضافة الباقة بنجاح'),
                    backgroundColor: Colors.green,
                  ),
                );
                await provider.loadPackages(refresh: true);
                if (context.mounted) {
                  Navigator.of(context).pop();
                }
              } else if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(provider.errorMessage ?? 'فشل إضافة الباقة'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            } catch (e) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('فشل إضافة الباقة: $e'),
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

  Future<void> _showEditPackageDialog(
    BuildContext context,
    TravelPackage pkg,
    PackageProvider provider,
  ) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AddEditPackagePage(
          package: pkg,
          onSave: (data) async {
            try {
              final updated = await provider.updatePackage(pkg.id, data);
              if (updated != null && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('تم تحديث الباقة بنجاح'),
                    backgroundColor: Colors.green,
                  ),
                );
                await provider.loadPackages(refresh: true);
                if (context.mounted) {
                  Navigator.of(context).pop();
                }
              } else if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(provider.errorMessage ?? 'فشل تحديث الباقة'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            } catch (e) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('فشل تحديث الباقة: $e'),
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

  Future<void> _showDeleteConfirmation(
    BuildContext context,
    TravelPackage pkg,
    PackageProvider provider,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تأكيد الحذف'),
        content: Text('هل أنت متأكد من حذف الباقة "${pkg.title}"؟'),
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
        final success = await provider.deletePackage(pkg.id);
        if (success && context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم حذف الباقة بنجاح'),
              backgroundColor: Colors.green,
            ),
          );
          await provider.loadPackages(refresh: true);
        } else if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(provider.errorMessage ?? 'فشل حذف الباقة'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('فشل حذف الباقة: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  Future<void> _openPackageBookings(
    BuildContext context,
    TravelPackage pkg,
    PackageProvider provider,
  ) async {
    final auth = context.read<AuthProvider>();
    final isAdmin = _isAdmin(auth.currentUser?.role ?? '');
    try {
      final bookings = await provider.getPackageBookings(pkg.id);
      if (context.mounted && bookings != null) {
        await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => PackageBookingsPage(
              packageId: pkg.id,
              packageName: pkg.title,
              bookingsData: bookings,
              isAdmin: isAdmin,
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

  Future<void> _openCompletedBookings(
    BuildContext context,
    TravelPackage pkg,
    PackageProvider provider,
  ) async {
    final auth = context.read<AuthProvider>();
    final isAdmin = _isAdmin(auth.currentUser?.role ?? '');
    try {
      final bookings = await provider.getPackageBookings(pkg.id);
      if (context.mounted && bookings != null) {
        final completedBookings =
            bookings['completedBookings'] as List<dynamic>? ?? [];
        await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => PackageBookingsPage(
              packageId: pkg.id,
              packageName: pkg.title,
              bookingsData: {
                ...bookings,
                'bookings': completedBookings,
              },
              showOnlyCompleted: true,
              isAdmin: isAdmin,
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

  void _showFavorites(
    BuildContext context,
    PackageProvider packageProvider,
    PackageFavoritesProvider favoritesProvider,
  ) {
    final favoriteIds = favoritesProvider.favorites;
    if (favoriteIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('لا توجد باقات في المفضلة'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    final favoritePackages = packageProvider.packages
        .where((pkg) => favoriteIds.contains(pkg.id))
        .toList();

    final auth = context.read<AuthProvider>();
    final isAdmin = _isAdmin(auth.currentUser?.role ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _FavoritesSheet(
        packages: favoritePackages,
        packageProvider: packageProvider,
        favoritesProvider: favoritesProvider,
        isAdmin: isAdmin,
      ),
    );
  }

  void _showBookedPackages(
    BuildContext context,
    PackageProvider packageProvider,
    BookingProvider bookingProvider,
    Set<int> bookedPackageIds,
  ) {
    if (bookedPackageIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('لا توجد باقات محجوزة'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    final bookedPackages = packageProvider.packages
        .where((pkg) => bookedPackageIds.contains(pkg.id))
        .toList();

    final auth = context.read<AuthProvider>();
    final isAdmin = _isAdmin(auth.currentUser?.role ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _BookedPackagesSheet(
        packages: bookedPackages,
        packageProvider: packageProvider,
        bookingProvider: bookingProvider,
        isAdmin: isAdmin,
      ),
    );
  }

  @override
  bool get wantKeepAlive => true;
}

class _FavoritesSheet extends StatelessWidget {
  const _FavoritesSheet({
    required this.packages,
    required this.packageProvider,
    required this.favoritesProvider,
    this.isAdmin = false,
  });

  final List<TravelPackage> packages;
  final PackageProvider packageProvider;
  final PackageFavoritesProvider favoritesProvider;
  final bool isAdmin;

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.pink.shade50,
                    Colors.pink.shade100,
                  ],
                ),
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.favorite, color: Colors.pink),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'المفضلة (${packages.length})',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            Expanded(
              child: packages.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.favorite_border,
                            size: 64,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'لا توجد باقات في المفضلة',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  color: Colors.grey[600],
                                ),
                          ),
                        ],
                      ),
                    )
                  : GridView.builder(
                      controller: scrollController,
                      padding: const EdgeInsets.all(16),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.62,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 16,
                      ),
                      itemCount: packages.length,
                      itemBuilder: (context, index) {
                        final pkg = packages[index];
                        return PackageCard(
                          travelPackage: pkg,
                          isAdmin: isAdmin,
                          onTap: () {
                            Navigator.pop(context);
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              builder: (_) => ChangeNotifierProvider.value(
                                value: packageProvider,
                                child: PackageDetailModal(
                                  packageId: pkg.id,
                                  initialPackage: pkg,
                                ),
                              ),
                            );
                          },
                          onEdit: isAdmin
                              ? () => _FavoritesSheet._showEditDialog(
                                    context,
                                    pkg,
                                    packageProvider,
                                  )
                              : null,
                          onDelete: isAdmin
                              ? () => _FavoritesSheet._showDeleteDialog(
                                    context,
                                    pkg,
                                    packageProvider,
                                  )
                              : null,
                          onViewBookings: isAdmin
                              ? () => _FavoritesSheet._openBookings(
                                    context,
                                    pkg,
                                    packageProvider,
                                  )
                              : null,
                          onViewCompletedBookings: isAdmin
                              ? () => _FavoritesSheet._openCompletedBookings(
                                    context,
                                    pkg,
                                    packageProvider,
                                  )
                              : null,
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  static Future<void> _showEditDialog(
    BuildContext context,
    TravelPackage pkg,
    PackageProvider provider,
  ) async {
    // Navigate to edit page - you'll need to import AddEditPackagePage
    // For now, just show a message
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('يرجى استخدام صفحة الباقات الرئيسية للتعديل'),
      ),
    );
  }

  static Future<void> _showDeleteDialog(
    BuildContext context,
    TravelPackage pkg,
    PackageProvider provider,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تأكيد الحذف'),
        content: Text('هل أنت متأكد من حذف الباقة "${pkg.title}"؟'),
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
        final success = await provider.deletePackage(pkg.id);
        if (success && context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم حذف الباقة بنجاح'),
              backgroundColor: Colors.green,
            ),
          );
          await provider.loadPackages(refresh: true);
        } else if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(provider.errorMessage ?? 'فشل حذف الباقة'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('فشل حذف الباقة: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  static Future<void> _openBookings(
    BuildContext context,
    TravelPackage pkg,
    PackageProvider provider,
  ) async {
    try {
      final bookings = await provider.getPackageBookings(pkg.id);
      if (context.mounted && bookings != null) {
        // Import PackageBookingsPage
        // await Navigator.of(context).push(...);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('يرجى استخدام صفحة الباقات الرئيسية لعرض الحجوزات'),
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
    TravelPackage pkg,
    PackageProvider provider,
  ) async {
    // Similar to _openBookings
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content:
            Text('يرجى استخدام صفحة الباقات الرئيسية لعرض الحجوزات المكتملة'),
      ),
    );
  }
}

class _BookedPackagesSheet extends StatelessWidget {
  const _BookedPackagesSheet({
    required this.packages,
    required this.packageProvider,
    required this.bookingProvider,
    this.isAdmin = false,
  });

  final List<TravelPackage> packages;
  final PackageProvider packageProvider;
  final BookingProvider bookingProvider;
  final bool isAdmin;

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.green.shade50,
                    Colors.green.shade100,
                  ],
                ),
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.green),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'حجوزاتي (${packages.length})',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            Expanded(
              child: packages.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.event_busy,
                            size: 64,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'لا توجد باقات محجوزة',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  color: Colors.grey[600],
                                ),
                          ),
                        ],
                      ),
                    )
                  : GridView.builder(
                      controller: scrollController,
                      padding: const EdgeInsets.all(16),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.62,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 16,
                      ),
                      itemCount: packages.length,
                      itemBuilder: (context, index) {
                        final pkg = packages[index];
                        return PackageCard(
                          travelPackage: pkg,
                          isAdmin: isAdmin,
                          onTap: () {
                            Navigator.pop(context);
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              builder: (_) => ChangeNotifierProvider.value(
                                value: packageProvider,
                                child: PackageDetailModal(
                                  packageId: pkg.id,
                                  initialPackage: pkg,
                                ),
                              ),
                            );
                          },
                          onEdit: isAdmin
                              ? () => _BookedPackagesSheet._showEditDialog(
                                    context,
                                    pkg,
                                    packageProvider,
                                  )
                              : null,
                          onDelete: isAdmin
                              ? () => _BookedPackagesSheet._showDeleteDialog(
                                    context,
                                    pkg,
                                    packageProvider,
                                  )
                              : null,
                          onViewBookings: isAdmin
                              ? () => _BookedPackagesSheet._openBookings(
                                    context,
                                    pkg,
                                    packageProvider,
                                  )
                              : null,
                          onViewCompletedBookings: isAdmin
                              ? () =>
                                  _BookedPackagesSheet._openCompletedBookings(
                                    context,
                                    pkg,
                                    packageProvider,
                                  )
                              : null,
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  static Future<void> _showEditDialog(
    BuildContext context,
    TravelPackage pkg,
    PackageProvider provider,
  ) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('يرجى استخدام صفحة الباقات الرئيسية للتعديل'),
      ),
    );
  }

  static Future<void> _showDeleteDialog(
    BuildContext context,
    TravelPackage pkg,
    PackageProvider provider,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تأكيد الحذف'),
        content: Text('هل أنت متأكد من حذف الباقة "${pkg.title}"؟'),
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
        final success = await provider.deletePackage(pkg.id);
        if (success && context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم حذف الباقة بنجاح'),
              backgroundColor: Colors.green,
            ),
          );
          await provider.loadPackages(refresh: true);
        } else if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(provider.errorMessage ?? 'فشل حذف الباقة'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('فشل حذف الباقة: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  static Future<void> _openBookings(
    BuildContext context,
    TravelPackage pkg,
    PackageProvider provider,
  ) async {
    try {
      final bookings = await provider.getPackageBookings(pkg.id);
      if (context.mounted && bookings != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('يرجى استخدام صفحة الباقات الرئيسية لعرض الحجوزات'),
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
    TravelPackage pkg,
    PackageProvider provider,
  ) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content:
            Text('يرجى استخدام صفحة الباقات الرئيسية لعرض الحجوزات المكتملة'),
      ),
    );
  }
}
