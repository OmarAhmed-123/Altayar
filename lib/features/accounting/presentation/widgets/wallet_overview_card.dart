import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/accounting/data/models/wallet_summary.dart';

class WalletOverviewCard extends StatefulWidget {
  const WalletOverviewCard({super.key, required this.summary});

  final WalletSummary summary;

  @override
  State<WalletOverviewCard> createState() => _WalletOverviewCardState();
}

class _WalletOverviewCardState extends State<WalletOverviewCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeOut,
      ),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeOutCubic,
      ),
    );

    _animationController.forward();
  }

  @override
  void didUpdateWidget(WalletOverviewCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Animate when values change
    if (oldWidget.summary.pointsBalance != widget.summary.pointsBalance ||
        oldWidget.summary.cashbackBalance != widget.summary.cashbackBalance ||
        oldWidget.summary.lifetimePointsEarned !=
            widget.summary.lifetimePointsEarned ||
        oldWidget.summary.lifetimeCashbackEarned !=
            widget.summary.lifetimeCashbackEarned ||
        oldWidget.summary.totalSpend != widget.summary.totalSpend) {
      _animationController.reset();
      _animationController.forward();
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.primaryGradient.first.withValues(alpha: 0.1),
                AppColors.primaryGradient.last.withValues(alpha: 0.05),
              ],
            ),
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: AppColors.primaryGradient.first.withValues(alpha: 0.2),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: GlassCard(
            borderRadius: BorderRadius.circular(28),
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0.0, end: 1.0),
                      duration: const Duration(milliseconds: 600),
                      curve: Curves.elasticOut,
                      builder: (context, value, child) {
                        return Transform.scale(
                          scale: value,
                          child: Transform.rotate(
                            angle: (1 - value) * 0.5,
                            child: child,
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: AppColors.primaryGradient,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primaryGradient.first
                                  .withValues(alpha: 0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.account_balance_wallet,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'محفظتي',
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
                            'آخر تحديث: ${_formatDate(widget.summary.lastUpdated)}',
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: Colors.grey[600],
                                    ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Column(
                  children: [
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 1.1,
                      children: [
                        _AnimatedMetricCard(
                          title: 'رصيد النقاط',
                          value: _formatNumber(widget.summary.pointsBalance),
                          icon: Icons.stars,
                          gradient: [Colors.amber, Colors.orange],
                          index: 0,
                        ),
                        _AnimatedMetricCard(
                          title: 'رصيد الكاش باك',
                          value:
                              '${_formatNumber(widget.summary.cashbackBalance)} EGP',
                          icon: Icons.account_balance_wallet,
                          gradient: [Colors.teal, Colors.cyan],
                          index: 1,
                        ),
                        _AnimatedMetricCard(
                          title: 'نقاط مكتسبة',
                          value: _formatNumber(
                              widget.summary.lifetimePointsEarned),
                          icon: Icons.favorite,
                          gradient: [Colors.pinkAccent, Colors.purple],
                          index: 2,
                        ),
                        _AnimatedMetricCard(
                          title: 'كاش باك مكتسب',
                          value:
                              '${_formatNumber(widget.summary.lifetimeCashbackEarned)} EGP',
                          icon: Icons.payments,
                          gradient: [Colors.green, Colors.lightGreen],
                          index: 3,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _AnimatedMetricCard(
                      title: 'إجمالي الإنفاق',
                      value: '${_formatNumber(widget.summary.totalSpend)} EGP',
                      icon: Icons.shopping_bag,
                      gradient: [Colors.indigo, Colors.blue],
                      index: 4,
                      isFullWidth: true,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatNumber(num value) {
    final formatter = NumberFormat('#,###');
    if (value is double) {
      return formatter.format(value);
    }
    return formatter.format(value.toInt());
  }

  String _formatDate(DateTime date) {
    final formatter = DateFormat('yyyy-MM-dd HH:mm', 'ar');
    return formatter.format(date.toLocal());
  }
}

class _AnimatedMetricCard extends StatefulWidget {
  const _AnimatedMetricCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.gradient,
    required this.index,
    this.isFullWidth = false,
  });

  final String title;
  final String value;
  final IconData icon;
  final List<Color> gradient;
  final int index;
  final bool isFullWidth;

  @override
  State<_AnimatedMetricCard> createState() => _AnimatedMetricCardState();
}

class _AnimatedMetricCardState extends State<_AnimatedMetricCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 400 + (widget.index * 100)),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.elasticOut,
      ),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOut,
      ),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          width: widget.isFullWidth ? double.infinity : null,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                widget.gradient.first.withValues(alpha: 0.15),
                widget.gradient.last.withValues(alpha: 0.08),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: widget.gradient.first.withValues(alpha: 0.2),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: widget.gradient.first.withValues(alpha: 0.1),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(colors: widget.gradient),
                      boxShadow: [
                        BoxShadow(
                          color: widget.gradient.first.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Icon(
                      widget.icon,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.title,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[700],
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                  ),
                  const SizedBox(height: 8),
                  TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0.0, end: 1.0),
                    duration: const Duration(milliseconds: 600),
                    curve: Curves.easeOut,
                    builder: (context, value, child) {
                      return Opacity(
                        opacity: value,
                        child: Transform.translate(
                          offset: Offset(0, 10 * (1 - value)),
                          child: child,
                        ),
                      );
                    },
                    child: Text(
                      widget.value,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: widget.gradient.first,
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                            letterSpacing: 0.5,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
