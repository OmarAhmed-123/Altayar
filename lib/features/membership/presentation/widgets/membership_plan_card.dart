import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import 'package:altayar/core/widgets/animated_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/core/utils/currency_formatter.dart';
import 'package:altayar/features/membership/data/models/membership_plan.dart';
import 'package:altayar/features/membership/presentation/utils/membership_media_helper.dart';

class MembershipPlanCard extends StatelessWidget {
  const MembershipPlanCard({
    super.key,
    required this.plan,
    required this.isSelected,
    required this.onTap,
    this.onEdit,
    this.onDelete,
    this.onViewBookings,
    this.onViewCompletedBookings,
    this.isAdmin = false,
  });

  final MembershipPlan plan;
  final bool isSelected;
  final VoidCallback onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final VoidCallback? onViewBookings;
  final VoidCallback? onViewCompletedBookings;
  final bool isAdmin;

  Color get tierColor {
    switch (plan.tier.toLowerCase()) {
      case 'silver':
        return const Color(0xFFC0C0C0); // Silver
      case 'gold':
        return const Color(0xFFFFD700); // Gold
      case 'platinum':
        return const Color(0xFFE5E4E2); // Platinum
      case 'vip':
        return const Color(0xFFB76E79); // VIP (Rose Gold)
      case 'diamond':
        return const Color(0xFFB9F2FF); // Diamond (Light Blue)
      case 'business':
        return AppColors.primary; // Business (Primary Blue)
      case 'bronze':
        return const Color(0xFFCD7F32); // Bronze
      default:
        return const Color(0xFFC0C0C0); // Default Silver
    }
  }

  List<Color> get tierGradient {
    switch (plan.tier.toLowerCase()) {
      case 'silver':
        return [const Color(0xFFC0C0C0), const Color(0xFFA8A8A8)];
      case 'gold':
        return [const Color(0xFFFFD700), const Color(0xFFFFA500)];
      case 'platinum':
        return [const Color(0xFFE5E4E2), const Color(0xFFD3D3D3)];
      case 'vip':
        return [const Color(0xFFB76E79), const Color(0xFF8B4A5C)];
      case 'diamond':
        return [const Color(0xFFB9F2FF), const Color(0xFF87CEEB)];
      case 'business':
        return AppColors.primaryGradient;
      case 'bronze':
        return [const Color(0xFFCD7F32), const Color(0xFFA0522D)];
      default:
        return [const Color(0xFFC0C0C0), const Color(0xFFA8A8A8)];
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final mediaQuery = MediaQuery.of(context);
    final screenHeight = mediaQuery.size.height;
    final screenWidth = mediaQuery.size.width;

    // Calculate dynamic card dimensions based on screen size - MEDIUM SIZE
    final cardHeight =
        screenHeight * 0.50; // 50% of screen height (medium size)
    const minCardHeight = 400.0; // Medium minimum height
    const maxCardHeight = 520.0; // Medium maximum height
    final calculatedHeight = cardHeight.clamp(minCardHeight, maxCardHeight);

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return Transform.scale(
          scale: 0.95 + (value * 0.05),
          child: Opacity(
            opacity: value,
            child: AnimatedCard(
              borderRadius: BorderRadius.circular(28),
              margin: EdgeInsets.symmetric(
                horizontal: screenWidth * 0.05,
                vertical: 8,
              ),
              onTap: onTap,
              child: SizedBox(
                width: double.infinity,
                height: calculatedHeight,
                child: Container(
                  padding: EdgeInsets.all(screenWidth * 0.04), // Medium padding
                  decoration: BoxDecoration(
                    gradient: isSelected
                        ? LinearGradient(
                            colors: [
                              tierColor.withValues(alpha: 0.15),
                              tierColor.withValues(alpha: 0.05),
                              Colors.white,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            stops: const [0.0, 0.5, 1.0],
                          )
                        : LinearGradient(
                            colors: [
                              Colors.white,
                              Colors.grey.shade50,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(
                      color: isSelected ? tierColor : Colors.grey.shade300,
                      width: isSelected ? 3 : 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: isSelected
                            ? tierColor.withValues(alpha: 0.4)
                            : Colors.black.withValues(alpha: 0.08),
                        blurRadius: isSelected ? 25 : 15,
                        offset: Offset(0, isSelected ? 12 : 6),
                        spreadRadius: isSelected ? 2 : 0,
                      ),
                    ],
                  ),
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final imageUrl = resolveMembershipImage(plan);
                      return SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Header with admin action buttons
                              if (isAdmin)
                                Align(
                                  alignment: Alignment.topRight,
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      if (onViewCompletedBookings != null)
                                        IconButton(
                                          onPressed: onViewCompletedBookings,
                                          icon: const Icon(Icons.check_circle),
                                          color: Colors.green,
                                          tooltip: 'الحجوزات المكتملة',
                                          iconSize: 20,
                                        ),
                                      if (onViewBookings != null)
                                        IconButton(
                                          onPressed: onViewBookings,
                                          icon: const Icon(Icons.book),
                                          color: AppColors.primary,
                                          tooltip: 'الحجوزات المتعلقة',
                                          iconSize: 20,
                                        ),
                                      if (onEdit != null)
                                        IconButton(
                                          onPressed: onEdit,
                                          icon: const Icon(Icons.edit),
                                          color: Colors.blue,
                                          tooltip: 'تعديل الباقة',
                                          iconSize: 20,
                                        ),
                                      if (onDelete != null)
                                        IconButton(
                                          onPressed: onDelete,
                                          icon: const Icon(Icons.delete),
                                          color: Colors.red,
                                          tooltip: 'حذف الباقة',
                                          iconSize: 20,
                                        ),
                                    ],
                                  ),
                                ),
                              // Legacy edit button for non-admin
                              if (!isAdmin && onEdit != null)
                                Align(
                                  alignment: Alignment.topRight,
                                  child: IconButton(
                                    onPressed: onEdit,
                                    icon: Icon(Icons.tune, color: tierColor),
                                    tooltip: 'تعديل الباقة',
                                  ),
                                ),

                              // Tier badge with gradient
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: tierGradient,
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(
                                      color: tierColor.withValues(alpha: 0.4),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                      spreadRadius: 1,
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.workspace_premium,
                                      color: Colors.white,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 6),
                                    Flexible(
                                      child: Text(
                                        plan.tier.toUpperCase(),
                                        style: theme.textTheme.bodyMedium
                                            ?.copyWith(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 1.2,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: 12),

                              // Plan name and image row
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          plan.name,
                                          style: theme.textTheme.titleLarge
                                              ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                            color: tierColor,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        if (plan.description != null) ...[
                                          const SizedBox(height: 4),
                                          Text(
                                            plan.description!,
                                            style: theme.textTheme.bodySmall
                                                ?.copyWith(
                                              color: Colors.grey[700],
                                            ),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(14),
                                    child: CachedNetworkImage(
                                      imageUrl: imageUrl,
                                      height: 60,
                                      width: 60,
                                      fit: BoxFit.cover,
                                      placeholder: (_, __) => Container(
                                        height: 60,
                                        width: 60,
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            colors: [
                                              tierColor.withValues(alpha: 0.2),
                                              tierColor.withValues(alpha: 0.1),
                                            ],
                                          ),
                                          borderRadius:
                                              BorderRadius.circular(14),
                                        ),
                                        child: SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            valueColor:
                                                AlwaysStoppedAnimation<Color>(
                                                    tierColor),
                                          ),
                                        ),
                                      ),
                                      errorWidget: (_, __, ___) => Container(
                                        height: 60,
                                        width: 60,
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            colors: [
                                              tierColor.withValues(alpha: 0.2),
                                              tierColor.withValues(alpha: 0.1),
                                            ],
                                          ),
                                          borderRadius:
                                              BorderRadius.circular(14),
                                        ),
                                        child: Icon(
                                          Icons.workspace_premium,
                                          color: tierColor,
                                          size: 30,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 14),

                              // Price section
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: AppColors.primaryGradient,
                                  ),
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary
                                          .withValues(alpha: 0.3),
                                      blurRadius: 12,
                                      offset: const Offset(0, 6),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  children: [
                                    Text(
                                      'السعر',
                                      style:
                                          theme.textTheme.bodySmall?.copyWith(
                                        color: Colors.white70,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      CurrencyFormatter.format(plan.price),
                                      style: theme.textTheme.headlineSmall
                                          ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: 14),

                              // Details grid - Compact 3 columns
                              Row(
                                children: [
                                  Expanded(
                                    child: _DetailItem(
                                      icon: Icons.calendar_today,
                                      label: 'المدة',
                                      value: '${plan.durationDays ~/ 30} شهر',
                                      color: tierColor,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _DetailItem(
                                      icon: Icons.stars,
                                      label: 'النقاط',
                                      value: '${plan.points}',
                                      color: tierColor,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _DetailItem(
                                      icon: Icons.trending_up,
                                      label: 'المضاعف',
                                      value: '${plan.pointMultiplier}x',
                                      color: tierColor,
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 12),

                              // Benefits section
                              if (plan.benefits.isNotEmpty) ...[
                                Row(
                                  children: [
                                    Icon(
                                      Icons.star,
                                      color: tierColor,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'المميزات',
                                      style:
                                          theme.textTheme.titleSmall?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: tierColor,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                SizedBox(
                                  height: (plan.benefits.length > 4 ? 80 : 55)
                                      .toDouble(),
                                  child: SingleChildScrollView(
                                    physics: const BouncingScrollPhysics(),
                                    child: Wrap(
                                      spacing: 6,
                                      runSpacing: 6,
                                      children:
                                          plan.benefits.take(6).map((benefit) {
                                        return Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 10,
                                            vertical: 6,
                                          ),
                                          decoration: BoxDecoration(
                                            gradient: LinearGradient(
                                              colors: [
                                                tierColor.withValues(
                                                    alpha: 0.15),
                                                tierColor.withValues(
                                                    alpha: 0.08),
                                              ],
                                            ),
                                            borderRadius:
                                                BorderRadius.circular(10),
                                            border: Border.all(
                                              color: tierColor.withValues(
                                                  alpha: 0.3),
                                              width: 1,
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(
                                                Icons.check_circle,
                                                size: 14,
                                                color: tierColor,
                                              ),
                                              const SizedBox(width: 4),
                                              Text(
                                                benefit,
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: tierColor,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ),
                                        );
                                      }).toList(),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _DetailItem extends StatelessWidget {
  const _DetailItem({
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
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey[600],
                  fontSize: 10,
                ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
