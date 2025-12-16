import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/features/auth/presentation/pages/login_page.dart';
import 'package:altayar/features/auth/presentation/pages/register_page.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  static const _loginRoute = '/login';
  static const _registerRoute = '/register';

  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  late final NavigatorObserver _navigatorObserver;
  bool _canPopInner = false;

  @override
  void initState() {
    super.initState();
    _navigatorObserver = _AuthFlowObserver(_handleStackChanged);
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_canPopInner,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        if (_canPopInner) {
          _navigatorKey.currentState?.pop();
        }
      },
      child: Navigator(
        key: _navigatorKey,
        initialRoute: _loginRoute,
        observers: [_navigatorObserver],
        onGenerateRoute: (settings) => _buildRoute(settings),
      ),
    );
  }

  PageRoute _buildRoute(RouteSettings settings) {
    late Widget page;
    switch (settings.name) {
      case _registerRoute:
        page = RegisterPage(onLoginTap: () => _navigateTo(_loginRoute));
        break;
      case _loginRoute:
      default:
        page = LoginPage(onRegisterTap: () => _navigateTo(_registerRoute));
    }
    return PageRouteBuilder(
      settings: settings,
      transitionDuration: const Duration(milliseconds: 250),
      transitionsBuilder: (_, animation, __, child) =>
          FadeTransition(opacity: animation, child: child),
      pageBuilder: (_, __, ___) => page,
    );
  }

  void _navigateTo(String route) {
    context.read<AuthProvider>().clearError();
    _navigatorKey.currentState?.pushReplacementNamed(route);
  }

  void _handleStackChanged() {
    final canPop = _navigatorKey.currentState?.canPop() ?? false;
    if (!mounted || canPop == _canPopInner) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      setState(() => _canPopInner = canPop);
    });
  }
}

class _AuthFlowObserver extends NavigatorObserver {
  _AuthFlowObserver(this.onChanged);

  final VoidCallback onChanged;

  void _notify() => onChanged();

  @override
  void didPop(Route route, Route? previousRoute) {
    _notify();
    super.didPop(route, previousRoute);
  }

  @override
  void didPush(Route route, Route? previousRoute) {
    _notify();
    super.didPush(route, previousRoute);
  }

  @override
  void didRemove(Route route, Route? previousRoute) {
    _notify();
    super.didRemove(route, previousRoute);
  }

  @override
  void didReplace({Route? newRoute, Route? oldRoute}) {
    _notify();
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
  }
}
