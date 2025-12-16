import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/localization/locale_provider.dart';
import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/core/networking/backend_health_provider.dart';
import 'package:altayar/core/networking/server_config_provider.dart';
import 'package:altayar/core/theme/app_theme.dart';
import 'package:altayar/features/accounting/data/accounting_api.dart';
import 'package:altayar/features/accounting/data/accounting_repository.dart';
import 'package:altayar/features/accounting/presentation/providers/accounting_provider.dart';
import 'package:altayar/features/ad_manager/data/ad_api.dart';
import 'package:altayar/features/ad_manager/data/ad_repository.dart';
import 'package:altayar/features/ad_manager/presentation/providers/ad_provider.dart';
import 'package:altayar/features/dashboard/data/dashboard_api.dart';
import 'package:altayar/features/dashboard/data/dashboard_repository.dart';
import 'package:altayar/features/dashboard/presentation/providers/dashboard_provider.dart';
import 'package:altayar/features/auth/data/auth_api.dart';
import 'package:altayar/features/auth/data/auth_repository.dart';
import 'package:altayar/features/auth/presentation/pages/auth_screen.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/booking/data/booking_api.dart';
import 'package:altayar/features/booking/data/booking_repository.dart';
import 'package:altayar/features/booking/presentation/providers/booking_provider.dart';
import 'package:altayar/features/chat/data/chat_api.dart';
import 'package:altayar/features/chat/data/chat_repository.dart';
import 'package:altayar/features/chat/presentation/providers/chat_provider.dart';
import 'package:altayar/features/content/data/content_api.dart';
import 'package:altayar/features/content/data/content_repository.dart';
import 'package:altayar/features/content/presentation/providers/content_provider.dart';
import 'package:altayar/features/membership/data/membership_api.dart';
import 'package:altayar/features/membership/data/membership_repository.dart';
import 'package:altayar/features/membership/presentation/providers/membership_analytics_provider.dart';
import 'package:altayar/features/membership/presentation/providers/membership_card_provider.dart';
import 'package:altayar/features/membership/presentation/providers/membership_provider.dart';
import 'package:altayar/features/membership/presentation/providers/referral_provider.dart';
import 'package:altayar/features/notifications/data/notification_api.dart';
import 'package:altayar/features/notifications/data/notification_repository.dart';
import 'package:altayar/features/notifications/presentation/providers/notification_provider.dart';
import 'package:altayar/features/packages/data/package_api.dart';
import 'package:altayar/features/packages/data/package_repository.dart';
import 'package:altayar/features/packages/presentation/providers/package_favorites_provider.dart';
import 'package:altayar/features/packages/presentation/providers/package_provider.dart';
import 'package:altayar/features/reports/data/reports_api.dart';
import 'package:altayar/features/reports/data/reports_repository.dart';
import 'package:altayar/features/reports/presentation/providers/reports_provider.dart';
import 'package:altayar/features/reports/presentation/providers/user_report_provider.dart';
import 'package:altayar/features/reports/data/revenue_analytics_api.dart';
import 'package:altayar/features/reports/data/revenue_analytics_repository.dart';
import 'package:altayar/features/reports/presentation/providers/revenue_analytics_provider.dart';
import 'package:altayar/features/sales/data/sales_api.dart';
import 'package:altayar/features/sales/data/sales_repository.dart';
import 'package:altayar/features/sales/presentation/providers/sales_provider.dart';
import 'package:altayar/features/trip_maker/data/trip_api.dart';
import 'package:altayar/features/trip_maker/data/trip_repository.dart';
import 'package:altayar/features/trip_maker/presentation/providers/trip_maker_provider.dart';
import 'package:altayar/features/user_management/data/user_management_api.dart';
import 'package:altayar/features/user_management/data/user_management_repository.dart';
import 'package:altayar/features/user_management/presentation/providers/role_analytics_provider.dart';
import 'package:altayar/features/user_management/presentation/providers/user_management_provider.dart';
import 'package:altayar/features/vouchers/data/voucher_api.dart';
import 'package:altayar/features/vouchers/data/voucher_repository.dart';
import 'package:altayar/features/vouchers/presentation/providers/voucher_provider.dart';
import 'package:altayar/features/settings/data/settings_api.dart';
import 'package:altayar/features/settings/data/settings_repository.dart';
import 'package:altayar/features/settings/presentation/providers/settings_provider.dart';
import 'package:altayar/features/profile/data/profile_api.dart';
import 'package:altayar/features/profile/data/profile_repository.dart';
import 'package:altayar/features/profile/presentation/providers/profile_provider.dart';
import 'package:altayar/home/presentation/pages/home_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final apiClient = ApiClient();
  final serverConfig = ServerConfigProvider(apiClient);
  await serverConfig.initialize();
  runApp(AltayarApp(apiClient: apiClient, serverConfig: serverConfig));
}

class AltayarApp extends StatelessWidget {
  const AltayarApp({
    super.key,
    required this.apiClient,
    required this.serverConfig,
  });

  final ApiClient apiClient;
  final ServerConfigProvider serverConfig;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiClient>(
          create: (_) => apiClient,
          dispose: (_, client) => client.dispose(),
        ),
        ChangeNotifierProvider(create: (_) => serverConfig),
        ChangeNotifierProvider(create: (_) => LocaleProvider()),
        ProxyProvider<ApiClient, AuthRepository>(
          update: (_, client, __) => AuthRepository(AuthApi(client)),
        ),
        ProxyProvider<ApiClient, MembershipRepository>(
          update: (_, client, __) =>
              MembershipRepository(MembershipApi(client)),
        ),
        ProxyProvider<ApiClient, VoucherRepository>(
          update: (_, client, __) => VoucherRepository(VoucherApi(client)),
        ),
        ProxyProvider<ApiClient, PackageRepository>(
          update: (_, client, __) => PackageRepository(PackageApi(client)),
        ),
        ProxyProvider<ApiClient, UserManagementRepository>(
          update: (_, client, __) =>
              UserManagementRepository(UserManagementApi(client)),
        ),
        ProxyProvider<ApiClient, BookingRepository>(
          update: (_, client, __) => BookingRepository(BookingApi(client)),
        ),
        ProxyProvider<ApiClient, TripRepository>(
          update: (_, client, __) => TripRepository(TripApi(client)),
        ),
        ProxyProvider2<ApiClient, MembershipRepository, AccountingRepository>(
          update: (_, client, membershipRepo, __) =>
              AccountingRepository(AccountingApi(client), membershipRepo),
        ),
        ProxyProvider<ApiClient, ContentRepository>(
          update: (_, client, __) => ContentRepository(ContentApi(client)),
        ),
        ProxyProvider<ApiClient, AdRepository>(
          update: (_, client, __) => AdRepository(AdApi(client)),
        ),
        ProxyProvider<ApiClient, ChatRepository>(
          update: (_, client, __) => ChatRepository(ChatApi(client)),
        ),
        ProxyProvider<ApiClient, NotificationRepository>(
          update: (_, client, __) =>
              NotificationRepository(NotificationApi(client)),
        ),
        ProxyProvider<ApiClient, DashboardRepository>(
          update: (_, client, __) => DashboardRepository(DashboardApi(client)),
        ),
        ProxyProvider<ApiClient, ReportsRepository>(
          update: (_, client, __) => ReportsRepository(ReportsApi(client)),
        ),
        ProxyProvider<ApiClient, RevenueAnalyticsRepository>(
          update: (_, client, __) =>
              RevenueAnalyticsRepository(RevenueAnalyticsApi(client)),
        ),
        ProxyProvider<ApiClient, SettingsRepository>(
          update: (_, client, __) => SettingsRepository(SettingsApi(client)),
        ),
        ProxyProvider<ApiClient, ProfileRepository>(
          update: (_, client, __) => ProfileRepository(ProfileApi(client)),
        ),
        ChangeNotifierProxyProvider<ServerConfigProvider, AuthProvider>(
          create: (context) {
            final provider = AuthProvider(
              context.read<AuthRepository>(),
              context.read<ApiClient>(),
            )..initialize();
            provider.syncServerBase(
              context.read<ServerConfigProvider>().baseUrl,
            );
            return provider;
          },
          update: (context, serverConfigProvider, auth) {
            final provider = auth ??
                (AuthProvider(
                  context.read<AuthRepository>(),
                  context.read<ApiClient>(),
                )..initialize());
            provider.syncServerBase(serverConfigProvider.baseUrl);
            return provider;
          },
        ),
        ChangeNotifierProxyProvider<ServerConfigProvider,
            BackendHealthProvider>(
          create: (context) => BackendHealthProvider(context.read<ApiClient>()),
          update: (context, serverConfig, healthProvider) {
            final provider = healthProvider ??
                BackendHealthProvider(context.read<ApiClient>());
            if (serverConfig.isInitialized) {
              provider.syncWithBase(serverConfig.baseUrl);
            }
            return provider;
          },
        ),
        ChangeNotifierProvider(
          create: (context) =>
              MembershipProvider(context.read<MembershipRepository>()),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              MembershipCardProvider(context.read<MembershipRepository>()),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              ReferralProvider(context.read<MembershipRepository>()),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              MembershipAnalyticsProvider(context.read<MembershipRepository>()),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              ContentProvider(context.read<ContentRepository>()),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              DashboardProvider(context.read<DashboardRepository>()),
        ),
        ChangeNotifierProxyProvider<AuthProvider, ChatProvider>(
          create: (context) => ChatProvider(
            context.read<ChatRepository>(),
            context.read<AuthProvider>(),
          ),
          update: (context, auth, previous) {
            if (previous == null) {
              return ChatProvider(context.read<ChatRepository>(), auth);
            }
            previous.updateAuth(auth);
            return previous;
          },
        ),
        ChangeNotifierProxyProvider<AuthProvider, NotificationProvider>(
          create: (context) =>
              NotificationProvider(context.read<NotificationRepository>()),
          update: (context, auth, previous) {
            final provider = previous ??
                NotificationProvider(context.read<NotificationRepository>());
            provider.updateAuth(auth);
            return provider;
          },
        ),
        ChangeNotifierProvider(
          create: (context) =>
              ReportsProvider(context.read<ReportsRepository>()),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              UserReportProvider(context.read<ReportsRepository>()),
        ),
        ChangeNotifierProvider(
          create: (context) => RevenueAnalyticsProvider(
            context.read<RevenueAnalyticsRepository>(),
          ),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              AccountingProvider(context.read<AccountingRepository>()),
        ),
        ChangeNotifierProvider(
          create: (context) => AdProvider(context.read<AdRepository>()),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              UserManagementProvider(context.read<UserManagementRepository>()),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              BookingProvider(context.read<BookingRepository>()),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              PackageProvider(context.read<PackageRepository>()),
        ),
        ChangeNotifierProvider(
          create: (_) => PackageFavoritesProvider()..initialize(),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              TripMakerProvider(context.read<TripRepository>()),
        ),
        ChangeNotifierProvider(
          create: (context) => RoleAnalyticsProvider(
            context.read<UserManagementRepository>(),
            context.read<ApiClient>(),
          ),
        ),
        ChangeNotifierProvider(
          create: (context) => SalesProvider(
            SalesRepository(
              SalesApi(context.read<ApiClient>()),
              context.read<MembershipRepository>(),
            ),
          ),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              VoucherProvider(context.read<VoucherRepository>()),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              SettingsProvider(context.read<SettingsRepository>()),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              ProfileProvider(context.read<ProfileRepository>()),
        ),
      ],
      child: Consumer2<AuthProvider, LocaleProvider>(
        builder: (context, auth, locale, _) {
          Widget home;
          switch (auth.status) {
            case AuthStatus.unknown:
              home = const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
              break;
            case AuthStatus.loading:
              home =
                  auth.isAuthenticated ? const HomeShell() : const AuthScreen();
              break;
            case AuthStatus.unauthenticated:
              home = const AuthScreen();
              break;
            case AuthStatus.authenticated:
              home = const HomeShell();
              break;
          }
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            title: 'ALTAYAR Control Center',
            theme: AppTheme.light(),
            locale: locale.locale,
            supportedLocales: const [Locale('ar'), Locale('en')],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: home,
          );
        },
      ),
    );
  }
}
