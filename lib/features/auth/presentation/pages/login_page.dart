import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/config/app_config.dart';
import 'package:altayar/core/networking/server_config_provider.dart';
import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/auth/presentation/widgets/auth_page_layout.dart';
import 'package:altayar/features/auth/presentation/widgets/auth_social_button.dart';
import 'package:altayar/features/auth/presentation/widgets/server_config_sheet.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.onRegisterTap});

  final VoidCallback onRegisterTap;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isBusy = auth.status == AuthStatus.loading;
    final errorMessage = auth.errorMessage;
    final showServerAction =
        errorMessage != null && _needsServerAction(errorMessage);

    return AuthPageLayout(
      title: 'مرحباً بعودتك 👋',
      subtitle:
          'سجّل دخولك لمتابعة الحجوزات والعضويات وإدارة العملاء في ALTAYAR.',
      footer: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('لا تمتلك حساباً بعد؟'),
              TextButton(
                onPressed: () {
                  context.read<AuthProvider>().clearError();
                  widget.onRegisterTap();
                },
                child: const Text('إنشاء حساب جديد'),
              ),
            ],
          ),
          const Divider(height: 32),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            alignment: WrapAlignment.center,
            children: [
              Tooltip(
                message: auth.canUseGoogleSignIn
                    ? 'التسجيل السريع عبر حساب Google'
                    : 'مُتاح عند تشغيل التطبيق على هاتف مدعوم وتفعيل Google OAuth.',
                child: AuthSocialButton(
                  icon: Icons.g_mobiledata_rounded,
                  label: 'التسجيل عبر Google',
                  onPressed: !auth.canUseGoogleSignIn || isBusy
                      ? null
                      : () => context.read<AuthProvider>().signInWithGoogle(),
                ),
              ),
              Tooltip(
                message: auth.canUseAppleSignIn
                    ? 'تسجيل الدخول باستخدام Apple ID'
                    : 'خيار مخصص لأجهزة Apple فقط.',
                child: AuthSocialButton(
                  icon: Icons.apple,
                  label: 'التسجيل عبر Apple',
                  onPressed: !auth.canUseAppleSignIn || isBusy
                      ? null
                      : () => context.read<AuthProvider>().signInWithApple(),
                ),
              ),
            ],
          ),
        ],
      ),
      children: [
        if (errorMessage != null)
          GlassCard(
            padding: const EdgeInsets.all(16),
            borderRadius: BorderRadius.circular(16),
            child: _ErrorBanner(
              message: errorMessage,
              actionLabel: showServerAction ? 'إعدادات الاتصال' : null,
              onAction: showServerAction ? _openServerSettings : null,
            ),
          ),
        AutofillGroup(
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                TextFormField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'البريد الإلكتروني',
                    prefixIcon: Icon(Icons.mail_outline),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [
                    AutofillHints.username,
                    AutofillHints.email,
                  ],
                  textInputAction: TextInputAction.next,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'أدخل البريد الإلكتروني';
                    }
                    if (!value.contains('@')) {
                      return 'صيغة بريد غير صحيحة';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscure,
                  decoration: InputDecoration(
                    labelText: 'كلمة المرور',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      onPressed: () => setState(() => _obscure = !_obscure),
                      icon: Icon(
                        _obscure ? Icons.visibility : Icons.visibility_off,
                      ),
                    ),
                  ),
                  autofillHints: const [AutofillHints.password],
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'أدخل كلمة المرور';
                    }
                    if (value.length < 6) {
                      return 'كلمة المرور يجب ألا تقل عن 6 أحرف';
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('تواصل مع الدعم لإعادة تعيين كلمة المرور.'),
                ),
              );
            },
            child: const Text('نسيت كلمة المرور؟'),
          ),
        ),
        const SizedBox(height: 8),
        GradientButton(
          label: 'تسجيل الدخول',
          icon: Icons.login,
          onPressed: isBusy ? null : _submit,
          isBusy: isBusy,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        ),
        if (AppConfig.hasDemoAdmin)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: TextButton.icon(
              onPressed: isBusy ? null : _loginAsDemoAdmin,
              icon: const Icon(Icons.admin_panel_settings_outlined),
              label: const Text('تسجيل دخول الأدمن الجاهز'),
            ),
          ),
        const SizedBox(height: 12),
        Consumer<ServerConfigProvider>(
          builder: (_, config, __) => Column(
            children: [
              Text(
                'الخادم الحالي: ${_formatBaseLabel(config.baseUrl)}',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              TextButton.icon(
                onPressed: isBusy ? null : _openServerSettings,
                icon: const Icon(Icons.settings_ethernet),
                label: const Text('إعدادات الاتصال'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final auth = context.read<AuthProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final success = await auth.login(email, password);
    if (!mounted || success) return;
    if (auth.errorMessage != null) {
      messenger.showSnackBar(SnackBar(content: Text(auth.errorMessage!)));
    }
  }

  Future<void> _loginAsDemoAdmin() async {
    final auth = context.read<AuthProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final success = await auth.login(
      AppConfig.demoAdminEmail,
      AppConfig.demoAdminPassword,
    );
    if (!mounted || success) return;
    final message = auth.errorMessage ?? 'تعذّر تسجيل الدخول بحساب الأدمن.';
    messenger.showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _openServerSettings() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => const ServerConfigSheet(),
    );
  }

  String _formatBaseLabel(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return url;
    final buffer = StringBuffer()
      ..write(uri.scheme)
      ..write('://')
      ..write(uri.host);
    if (uri.hasPort) {
      buffer.write(':${uri.port}');
    }
    return buffer.toString();
  }

  bool _needsServerAction(String message) {
    final lower = message.toLowerCase();
    return lower.contains('connection refused') ||
        lower.contains('socket') ||
        lower.contains('host') ||
        lower.contains('failed to connect');
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message, this.actionLabel, this.onAction});

  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.red.withAlpha((255 * .08).round()),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Colors.redAccent),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.red[800]),
            ),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(width: 8),
            TextButton(onPressed: onAction, child: Text(actionLabel!)),
          ],
        ],
      ),
    );
  }
}
