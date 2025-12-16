import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/widgets/animated_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/packages/data/models/travel_package.dart';
import 'package:altayar/features/packages/presentation/providers/package_favorites_provider.dart';
import 'package:altayar/features/packages/presentation/utils/package_media_helper.dart';
import 'package:altayar/features/booking/presentation/providers/booking_provider.dart';
import 'package:altayar/features/booking/data/models/booking.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';

class PackageCard extends StatelessWidget {
  const PackageCard({
    super.key,
    required this.travelPackage,
    this.onTap,
    this.isHighlighted = false,
    this.onDelete,
    this.onEdit,
    this.onViewBookings,
    this.onViewCompletedBookings,
    this.isAdmin = false,
  });

  final TravelPackage travelPackage;
  final VoidCallback? onTap;
  final bool isHighlighted;
  final VoidCallback? onDelete;
  final VoidCallback? onEdit;
  final VoidCallback? onViewBookings;
  final VoidCallback? onViewCompletedBookings;
  final bool isAdmin;

  bool _isPackageBooked(BuildContext context) {
    try {
      final bookingProvider = context.read<BookingProvider>();
      final authProvider = context.read<AuthProvider>();
      final userId = authProvider.currentUser?.id;
      if (userId == null) return false;

      final myBookings = bookingProvider.myBookings;
      return myBookings.any(
        (booking) =>
            booking.packageId == travelPackage.id &&
            (booking.status == BookingStatus.paid ||
                booking.status == BookingStatus.confirmed ||
                booking.status == BookingStatus.completed),
      );
    } catch (_) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final image = resolvePackageHeroImage(travelPackage);
    final isBooked = _isPackageBooked(context);
    return AnimatedCard(
      borderRadius: BorderRadius.circular(20),
      margin: EdgeInsets.zero,
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: isHighlighted
              ? Border.all(
                  color: AppColors.primary,
                  width: 3,
                )
              : isBooked
                  ? Border.all(
                      color: AppColors.success,
                      width: 2,
                    )
                  : null,
          boxShadow: [
            BoxShadow(
              color: isHighlighted
                  ? AppColors.primary.withValues(alpha: 0.5)
                  : isBooked
                      ? AppColors.success.withValues(alpha: 0.3)
                      : AppColors.primary.withValues(alpha: 0.15),
              blurRadius: isHighlighted ? 20 : 15,
              offset: Offset(0, isHighlighted ? 10 : 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(20),
                  ),
                  child: CachedNetworkImage(
                    imageUrl: image,
                    height: 160,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => _PackageImagePlaceholder(
                      icon: Icons.flight_takeoff,
                      color: theme.colorScheme.primary,
                    ),
                    errorWidget: (_, __, ___) => _PackageImagePlaceholder(
                      icon: Icons.photo,
                      color: theme.colorScheme.secondary,
                    ),
                  ),
                ),
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.3),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(20),
                    ),
                  ),
                  height: 160,
                ),
                if (isHighlighted)
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: AppColors.primaryGradient,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.5),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.star,
                            color: Colors.white,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          const Text(
                            'مميز',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                if (isBooked && !isHighlighted)
                  Positioned(
                    top: isHighlighted ? 50 : 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: AppColors.successGradient,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.success.withValues(alpha: 0.4),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.check_circle,
                            color: Colors.white,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          const Text(
                            'محجوزة',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                if (travelPackage.isExclusive)
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: AppColors.warningGradient,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.warning.withValues(alpha: 0.4),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Text(
                        'Exclusive',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ),
                // Admin action buttons
                if (isAdmin)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (onViewCompletedBookings != null)
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withValues(alpha: 0.9),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.1),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: IconButton(
                              onPressed: onViewCompletedBookings,
                              icon: const Icon(Icons.check_circle, color: Colors.green, size: 20),
                              tooltip: 'الحجوزات المكتملة',
                            ),
                          ),
                        if (onViewBookings != null)
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withValues(alpha: 0.9),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.1),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: IconButton(
                              onPressed: onViewBookings,
                              icon: const Icon(Icons.book, color: AppColors.primary, size: 20),
                              tooltip: 'الحجوزات المتعلقة',
                            ),
                          ),
                        if (onEdit != null)
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withValues(alpha: 0.9),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.1),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: IconButton(
                              onPressed: onEdit,
                              icon: const Icon(Icons.edit, color: Colors.blue, size: 20),
                              tooltip: 'تعديل الباقة',
                            ),
                          ),
                        if (onDelete != null)
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withValues(alpha: 0.9),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.1),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: IconButton(
                              onPressed: onDelete,
                              icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                              tooltip: 'حذف الباقة',
                            ),
                          ),
                      ],
                    ),
                  ),
                // Favorite button (for non-admin or always show)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Consumer<PackageFavoritesProvider>(
                    builder: (_, favs, __) => Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.9),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: IconButton(
                        onPressed: () => favs.toggle(travelPackage.id),
                        icon: Icon(
                          favs.isFavorite(travelPackage.id)
                              ? Icons.favorite
                              : Icons.favorite_border,
                          color: favs.isFavorite(travelPackage.id)
                              ? Colors.pinkAccent
                              : Colors.grey[600],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            Flexible(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      travelPackage.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.dark,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.location_on_outlined,
                          size: 16,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            travelPackage.destination ?? 'غير محدد',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.grey[700],
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(
                          Icons.timelapse,
                          size: 16,
                          color: AppColors.secondary,
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            '${travelPackage.durationDays} يوم / ${travelPackage.durationNights} ليلة',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.grey[700],
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(
                          Icons.event_seat,
                          size: 16,
                          color: travelPackage.remainingSeats <= 3
                              ? AppColors.error
                              : AppColors.success,
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            'تبقّى ${travelPackage.remainingSeats} مقعد',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: travelPackage.remainingSeats <= 3
                                  ? AppColors.error
                                  : AppColors.success,
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
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
                      child: Text(
                        '${travelPackage.price.toStringAsFixed(0)} EGP',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
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
  }
}

class _PackageImagePlaceholder extends StatelessWidget {
  const _PackageImagePlaceholder({
    required this.icon,
    required this.color,
  });

  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 160,
      color: color.withAlpha((255 * .08).round()),
      child: Icon(
        icon,
        size: 42,
        color: color.withAlpha((255 * .6).round()),
      ),
    );
  }
}
