import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/membership/data/models/referral_summary.dart';

class ReferralCard extends StatefulWidget {
  const ReferralCard({
    super.key,
    required this.summary,
    required this.onInvite,
    required this.isInviting,
  });

  final ReferralSummary summary;
  final Future<bool> Function(String email) onInvite;
  final bool isInviting;

  @override
  State<ReferralCard> createState() => _ReferralCardState();
}

class _ReferralCardState extends State<ReferralCard>
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
  void didUpdateWidget(ReferralCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Animate when values change
    if (oldWidget.summary.completedReferrals !=
            widget.summary.completedReferrals ||
        oldWidget.summary.pendingReferrals != widget.summary.pendingReferrals ||
        oldWidget.summary.earnedPoints != widget.summary.earnedPoints ||
        oldWidget.summary.earnedCashback != widget.summary.earnedCashback) {
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
                Colors.purple.withValues(alpha: 0.1),
                Colors.blue.withValues(alpha: 0.05),
              ],
            ),
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: Colors.purple.withValues(alpha: 0.2),
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
                          gradient: const LinearGradient(
                            colors: [Colors.purple, Colors.blue],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.purple.withValues(alpha: 0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.group_add,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        'نظام الدعوات',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppColors.dark,
                            ),
                      ),
                    ),
                    FilledButton.icon(
                      onPressed: widget.isInviting
                          ? null
                          : () => _showInviteDialog(context),
                      icon: widget.isInviting
                          ? const SizedBox(
                              height: 16,
                              width: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                            )
                          : const Icon(Icons.send, size: 18),
                      label: const Text('دعوة صديق'),
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.purple,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),
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
                      childAspectRatio: 1.2,
                      children: [
                        _AnimatedReferralMetric(
                          title: 'رمز الدعوة',
                          value: widget.summary.referralCode,
                          icon: Icons.vpn_key,
                          gradient: const [Colors.blue, Colors.cyan],
                          index: 0,
                        ),
                        _AnimatedReferralMetric(
                          title: 'الإحالات الناجحة',
                          value:
                              _formatNumber(widget.summary.completedReferrals),
                          icon: Icons.verified,
                          gradient: const [Colors.green, Colors.lightGreen],
                          index: 1,
                        ),
                        _AnimatedReferralMetric(
                          title: 'قيد الانتظار',
                          value: _formatNumber(widget.summary.pendingReferrals),
                          icon: Icons.hourglass_bottom,
                          gradient: const [Colors.orange, Colors.amber],
                          index: 2,
                        ),
                        _AnimatedReferralMetric(
                          title: 'النقاط المكتسبة',
                          value: _formatNumber(widget.summary.earnedPoints),
                          icon: Icons.stars,
                          gradient: const [Colors.amber, Colors.yellow],
                          index: 3,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _AnimatedReferralMetric(
                      title: 'الكاش باك المكتسب',
                      value:
                          '${_formatNumber(widget.summary.earnedCashback)} EGP',
                      icon: Icons.account_balance_wallet_outlined,
                      gradient: const [Colors.teal, Colors.cyan],
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

  Future<void> _showInviteDialog(BuildContext context) async {
    final controller = TextEditingController();
    final formKey = GlobalKey<FormState>();
    final result = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('دعوة صديق'),
        content: Form(
          key: formKey,
          child: TextFormField(
            controller: controller,
            decoration: const InputDecoration(
              labelText: 'البريد الإلكتروني',
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'ادخل البريد الإلكتروني';
              }
              if (!value.contains('@')) {
                return 'بريد غير صالح';
              }
              return null;
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () {
              if (formKey.currentState!.validate()) {
                Navigator.pop(dialogContext, true);
              }
            },
            child: const Text('إرسال'),
          ),
        ],
      ),
    );
    if (result == true && context.mounted) {
      final email = controller.text.trim();
      final success = await widget.onInvite(email);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success ? 'تم إرسال الدعوة بنجاح' : 'تعذر إرسال الدعوة',
          ),
          backgroundColor: success ? Colors.green : Colors.red,
        ),
      );
    }
    controller.dispose();
  }
}

class _AnimatedReferralMetric extends StatefulWidget {
  const _AnimatedReferralMetric({
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
  State<_AnimatedReferralMetric> createState() =>
      _AnimatedReferralMetricState();
}

class _AnimatedReferralMetricState extends State<_AnimatedReferralMetric>
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
