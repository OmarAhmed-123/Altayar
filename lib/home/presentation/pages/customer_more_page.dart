import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/auth/data/models/auth_user.dart';
import 'package:altayar/features/packages/presentation/pages/packages_page.dart';
import 'package:altayar/features/vouchers/presentation/pages/vouchers_page.dart';
import 'package:altayar/features/membership/presentation/pages/membership_dashboard_page.dart';
import 'package:altayar/features/accounting/presentation/pages/accounting_page.dart';
import 'package:altayar/features/activities/presentation/pages/activities_page.dart';
import 'package:altayar/features/content/presentation/pages/content_page.dart';
import 'package:altayar/features/chat/presentation/pages/communication_page.dart';
import 'package:altayar/features/booking/presentation/pages/booking_dashboard_page.dart';
import 'package:altayar/features/reports/presentation/pages/user_report_page.dart';
import 'package:altayar/features/trip_maker/presentation/pages/trip_maker_page.dart';
import 'package:altayar/features/settings/presentation/pages/settings_page.dart';
import 'package:altayar/features/profile/presentation/pages/profile_page.dart';

class CustomerMorePage extends StatelessWidget {
  const CustomerMorePage({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    final menuItems = [
      _MoreMenuItem(
        title: 'الباقات والعروض',
        icon: Icons.card_travel,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const PackagesPage()),
        ),
      ),
      _MoreMenuItem(
        title: 'القسائم والخصومات',
        icon: Icons.local_offer,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const VouchersPage()),
        ),
      ),
      _MoreMenuItem(
        title: 'العضويات والولاء',
        icon: Icons.workspace_premium,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const MembershipDashboardPage()),
        ),
      ),
      _MoreMenuItem(
        title: 'المحاسبة والمحفظة',
        icon: Icons.account_balance_wallet,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const AccountingPage()),
        ),
      ),
      _MoreMenuItem(
        title: 'سجل الأنشطة',
        icon: Icons.history,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const ActivitiesPage()),
        ),
      ),
      _MoreMenuItem(
        title: 'المحتوى والريلز',
        icon: Icons.video_library,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const ContentPage()),
        ),
      ),
      _MoreMenuItem(
        title: 'التواصل والدعم',
        icon: Icons.support_agent,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const CommunicationPage()),
        ),
      ),
      _MoreMenuItem(
        title: 'الحجوزات',
        icon: Icons.event_available,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const BookingDashboardPage()),
        ),
      ),
      _MoreMenuItem(
        title: 'التقارير الشخصية',
        icon: Icons.assessment,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const UserReportPage()),
        ),
      ),
      _MoreMenuItem(
        title: 'صانع الرحلات',
        icon: Icons.map,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const TripMakerPage()),
        ),
      ),
      _MoreMenuItem(
        title: 'الإعدادات',
        icon: Icons.settings,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const SettingsPage()),
        ),
      ),
    ];

    final user = auth.currentUser;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: AppColors.primaryGradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Custom AppBar
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  children: [
                    Text(
                      'المزيد',
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        shadows: [
                          Shadow(
                            color: Colors.black.withValues(alpha: 0.2),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // Content
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    // Profile Card
                    if (user != null) ...[
                      TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0.0, end: 1.0),
                        duration: const Duration(milliseconds: 500),
                        curve: Curves.easeOutCubic,
                        builder: (context, value, child) {
                          return Transform.scale(
                            scale: 0.9 + (value * 0.1),
                            child: Opacity(
                              opacity: value,
                              child: child,
                            ),
                          );
                        },
                        child: _ProfileCard(user: user),
                      ),
                      const SizedBox(height: 24),
                    ],
                    // Menu Items - Vertical List
                    ...menuItems.asMap().entries.map((entry) {
                      final index = entry.key;
                      final item = entry.value;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: TweenAnimationBuilder<double>(
                          tween: Tween(begin: 0.0, end: 1.0),
                          duration: Duration(milliseconds: 350 + (index * 40)),
                          curve: Curves.easeOutCubic,
                          builder: (context, value, child) {
                            return Transform.translate(
                              offset: Offset(0, 25 * (1 - value)),
                              child: Opacity(
                                opacity: value,
                                child: child,
                              ),
                            );
                          },
                          child: _MoreMenuCard(
                            item: item,
                            index: index,
                          ),
                        ),
                      );
                    }).toList(),
                    const SizedBox(height: 20),
                    // Logout Button
                    TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0.0, end: 1.0),
                      duration:
                          Duration(milliseconds: 350 + (menuItems.length * 40)),
                      curve: Curves.easeOutCubic,
                      builder: (context, value, child) {
                        return Transform.translate(
                          offset: Offset(0, 25 * (1 - value)),
                          child: Opacity(
                            opacity: value,
                            child: child,
                          ),
                        );
                      },
                      child: _LogoutButton(auth: auth),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MoreMenuItem {
  const _MoreMenuItem({
    required this.title,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final IconData icon;
  final VoidCallback onTap;
}

/// Profile card widget displaying user information
class _ProfileCard extends StatelessWidget {
  const _ProfileCard({required this.user});

  final AuthUser user;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.3),
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ProfilePage()),
          ),
          borderRadius: BorderRadius.circular(24),
          splashColor: Colors.white.withValues(alpha: 0.2),
          highlightColor: Colors.white.withValues(alpha: 0.1),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.25),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.4),
                          width: 3,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.2),
                            blurRadius: 15,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: user.profilePictureUrl != null &&
                                user.profilePictureUrl!.isNotEmpty
                            ? Image.network(
                                user.profilePictureUrl!,
                                width: 70,
                                height: 70,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    width: 70,
                                    height: 70,
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: LinearGradient(
                                        colors: [
                                          Colors.white.withValues(alpha: 0.3),
                                          Colors.white.withValues(alpha: 0.1),
                                        ],
                                      ),
                                    ),
                                    child: const Icon(
                                      Icons.person,
                                      color: Colors.white,
                                      size: 38,
                                    ),
                                  );
                                },
                                loadingBuilder:
                                    (context, child, loadingProgress) {
                                  if (loadingProgress == null) return child;
                                  return Container(
                                    width: 70,
                                    height: 70,
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: LinearGradient(
                                        colors: [
                                          Colors.white.withValues(alpha: 0.3),
                                          Colors.white.withValues(alpha: 0.1),
                                        ],
                                      ),
                                    ),
                                    child: const CircularProgressIndicator(
                                      strokeWidth: 3,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Colors.white,
                                      ),
                                    ),
                                  );
                                },
                              )
                            : Container(
                                width: 70,
                                height: 70,
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: LinearGradient(
                                    colors: [
                                      Colors.white.withValues(alpha: 0.3),
                                      Colors.white.withValues(alpha: 0.1),
                                    ],
                                  ),
                                ),
                                child: const Icon(
                                  Icons.person,
                                  color: Colors.white,
                                  size: 38,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(width: 18),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user.name.isNotEmpty ? user.name : 'مستخدم',
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 22,
                              shadows: [
                                Shadow(
                                  color: Colors.black.withValues(alpha: 0.3),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            user.email,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                              color: Colors.white.withValues(alpha: 0.95),
                              fontSize: 15,
                              shadows: [
                                Shadow(
                                  color: Colors.black.withValues(alpha: 0.2),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.2),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.3),
                          width: 1.5,
                        ),
                      ),
                      child: Icon(
                        Icons.arrow_forward_ios,
                        color: Colors.white.withValues(alpha: 0.9),
                        size: 16,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.3),
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _ProfileInfoItem(
                          icon: Icons.stars,
                          label: 'النقاط',
                          value: '${user.points}',
                        ),
                      ),
                      Container(
                        width: 1.5,
                        height: 40,
                        color: Colors.white.withValues(alpha: 0.4),
                      ),
                      Expanded(
                        child: _ProfileInfoItem(
                          icon: Icons.account_balance_wallet,
                          label: 'الرصيد',
                          value: '${user.cashback.toStringAsFixed(2)}',
                        ),
                      ),
                      if (user.membershipId != null) ...[
                        Container(
                          width: 1.5,
                          height: 40,
                          color: Colors.white.withValues(alpha: 0.4),
                        ),
                        Expanded(
                          child: _ProfileInfoItem(
                            icon: Icons.workspace_premium,
                            label: 'العضوية',
                            value: 'نشطة',
                          ),
                        ),
                      ],
                    ],
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

/// Profile info item widget
class _ProfileInfoItem extends StatelessWidget {
  const _ProfileInfoItem({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white.withValues(alpha: 0.2),
          ),
          child: Icon(
            icon,
            color: Colors.white,
            size: 22,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
            shadows: [
              Shadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Colors.white.withValues(alpha: 0.95),
            fontSize: 13,
            shadows: [
              Shadow(
                color: Colors.black.withValues(alpha: 0.15),
                blurRadius: 3,
                offset: const Offset(0, 1),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Card widget for menu items with modern design
class _MoreMenuCard extends StatefulWidget {
  const _MoreMenuCard({
    required this.item,
    required this.index,
  });

  final _MoreMenuItem item;
  final int index;

  @override
  State<_MoreMenuCard> createState() => _MoreMenuCardState();
}

class _MoreMenuCardState extends State<_MoreMenuCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.96).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    setState(() => _isPressed = true);
    _controller.forward();
  }

  void _handleTapUp(TapUpDetails details) {
    setState(() => _isPressed = false);
    _controller.reverse();
  }

  void _handleTapCancel() {
    setState(() => _isPressed = false);
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: widget.item.onTap,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          height: 85,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.18),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.35),
              width: 2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: _isPressed ? 0.1 : 0.15),
                blurRadius: _isPressed ? 12 : 20,
                offset: Offset(0, _isPressed ? 4 : 8),
                spreadRadius: _isPressed ? 0 : 1,
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: widget.item.onTap,
              borderRadius: BorderRadius.circular(20),
              splashColor: Colors.white.withValues(alpha: 0.3),
              highlightColor: Colors.white.withValues(alpha: 0.15),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 22,
                  vertical: 14,
                ),
                child: Row(
                  children: [
                    // Icon container with animation
                    TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0.0, end: 1.0),
                      duration:
                          Duration(milliseconds: 450 + (widget.index * 35)),
                      curve: Curves.elasticOut,
                      builder: (context, value, child) {
                        return Transform.scale(
                          scale: value,
                          child: Transform.rotate(
                            angle: (1 - value) * 0.4,
                            child: child,
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.3),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.4),
                            width: 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.1),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Icon(
                          widget.item.icon,
                          color: Colors.white,
                          size: 26,
                        ),
                      ),
                    ),
                    const SizedBox(width: 18),
                    // Text with proper overflow handling
                    Expanded(
                      child: Text(
                        widget.item.title,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 17,
                          height: 1.3,
                          shadows: [
                            Shadow(
                              color: Colors.black.withValues(alpha: 0.3),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.2),
                      ),
                      child: Icon(
                        Icons.arrow_forward_ios,
                        color: Colors.white.withValues(alpha: 0.9),
                        size: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Logout button widget
class _LogoutButton extends StatefulWidget {
  const _LogoutButton({required this.auth});

  final AuthProvider auth;

  @override
  State<_LogoutButton> createState() => _LogoutButtonState();
}

class _LogoutButtonState extends State<_LogoutButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isPressed = false;
  bool _isLoggingOut = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.96).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    if (_isLoggingOut) return;
    setState(() => _isPressed = true);
    _controller.forward();
  }

  void _handleTapUp(TapUpDetails details) {
    if (_isLoggingOut) return;
    setState(() => _isPressed = false);
    _controller.reverse();
  }

  void _handleTapCancel() {
    if (_isLoggingOut) return;
    setState(() => _isPressed = false);
    _controller.reverse();
  }

  Future<void> _handleLogout() async {
    if (_isLoggingOut) return;

    // Show confirmation dialog
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('تأكيد تسجيل الخروج'),
        content: const Text('هل أنت متأكد من رغبتك في تسجيل الخروج؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('تسجيل الخروج'),
          ),
        ],
      ),
    );

    if (shouldLogout != true || !mounted) return;

    setState(() => _isLoggingOut = true);

    try {
      await widget.auth.logout();
      // Navigation will happen automatically via Consumer2 in main.dart
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم تسجيل الخروج بنجاح'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        setState(() => _isLoggingOut = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('حدث خطأ أثناء تسجيل الخروج: ${error.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: _handleLogout,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          height: 85,
          decoration: BoxDecoration(
            color: Colors.red.withValues(alpha: 0.25),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Colors.red.withValues(alpha: 0.5),
              width: 2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.red.withValues(alpha: _isPressed ? 0.2 : 0.3),
                blurRadius: _isPressed ? 12 : 20,
                offset: Offset(0, _isPressed ? 4 : 8),
                spreadRadius: _isPressed ? 0 : 1,
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: _handleLogout,
              borderRadius: BorderRadius.circular(20),
              splashColor: Colors.red.withValues(alpha: 0.3),
              highlightColor: Colors.red.withValues(alpha: 0.15),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 22,
                  vertical: 14,
                ),
                child: Row(
                  children: [
                    // Icon container
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.red.withValues(alpha: 0.4),
                        border: Border.all(
                          color: Colors.red.withValues(alpha: 0.6),
                          width: 2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: _isLoggingOut
                          ? const SizedBox(
                              width: 26,
                              height: 26,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                            )
                          : const Icon(
                              Icons.logout,
                              color: Colors.white,
                              size: 26,
                            ),
                    ),
                    const SizedBox(width: 18),
                    // Text
                    Expanded(
                      child: Text(
                        _isLoggingOut ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 17,
                          height: 1.3,
                          shadows: [
                            Shadow(
                              color: Colors.black.withValues(alpha: 0.3),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (!_isLoggingOut)
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.red.withValues(alpha: 0.3),
                        ),
                        child: const Icon(
                          Icons.arrow_forward_ios,
                          color: Colors.white,
                          size: 14,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
