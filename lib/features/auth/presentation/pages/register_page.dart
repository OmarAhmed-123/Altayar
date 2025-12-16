import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/auth/presentation/widgets/auth_page_layout.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key, required this.onLoginTap});

  final VoidCallback onLoginTap;

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _firstController = TextEditingController();
  final _lastController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscure = true;
  String _role = 'customer';

  static const Map<String, String> _roles = {
    'customer': 'عميل',
    'sales': 'مبيعات',
    'reservations': 'حجوزات',
    'agent': 'مندوب',
  };

  @override
  void dispose() {
    _firstController.dispose();
    _lastController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isBusy = auth.status == AuthStatus.loading;

    return AuthPageLayout(
      title: 'أنشئ حساب ALTAYAR',
      subtitle:
          'انضم إلى شبكة الولاء واكسب نقاطاً على كل حجز. يمكن لفريق المبيعات أيضاً إنشاء حساباتهم هنا.',
      footer: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('لديك حساب بالفعل؟'),
          TextButton(
            onPressed: () {
              context.read<AuthProvider>().clearError();
              widget.onLoginTap();
            },
            child: const Text('سجّل الدخول'),
          ),
        ],
      ),
      children: [
        if (auth.errorMessage != null)
          GlassCard(
            padding: const EdgeInsets.all(16),
            borderRadius: BorderRadius.circular(16),
            child: _ErrorBanner(
              message: auth.errorMessage!,
            ),
          ),
        AutofillGroup(
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _firstController,
                        decoration: const InputDecoration(
                          labelText: 'الاسم الأول',
                        ),
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.givenName],
                        validator: (value) =>
                            value == null || value.isEmpty ? 'مطلوب' : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _lastController,
                        decoration: const InputDecoration(
                          labelText: 'اسم العائلة',
                        ),
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.familyName],
                        validator: (value) =>
                            value == null || value.isEmpty ? 'مطلوب' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'البريد الإلكتروني',
                    prefixIcon: Icon(Icons.mail_outline),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.email],
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
                  controller: _phoneController,
                  decoration: const InputDecoration(
                    labelText: 'رقم الجوال (اختياري)',
                    prefixIcon: Icon(Icons.phone_outlined),
                  ),
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _role,
                  decoration: const InputDecoration(
                    labelText: 'نوع الحساب',
                    prefixIcon: Icon(Icons.badge_outlined),
                  ),
                  items: _roles.entries
                      .map(
                        (entry) => DropdownMenuItem(
                          value: entry.key,
                          child: Text(entry.value),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    if (value != null) setState(() => _role = value);
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
                          _obscure ? Icons.visibility : Icons.visibility_off),
                    ),
                  ),
                  textInputAction: TextInputAction.next,
                  validator: (value) {
                    if (value == null || value.length < 6) {
                      return 'يجب أن تكون كلمة المرور 6 أحرف على الأقل';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _confirmController,
                  obscureText: _obscure,
                  decoration: const InputDecoration(
                    labelText: 'تأكيد كلمة المرور',
                    prefixIcon: Icon(Icons.verified_user_outlined),
                  ),
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  validator: (value) {
                    if (value != _passwordController.text) {
                      return 'الكلمتان غير متطابقتين';
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        GradientButton(
          label: 'إنشاء الحساب',
          icon: Icons.rocket_launch_outlined,
          onPressed: isBusy ? null : _submit,
          isBusy: isBusy,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        ),
      ],
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final success = await auth.register(
      firstName: _firstController.text.trim(),
      lastName: _lastController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
      phone: _phoneController.text.trim().isEmpty
          ? null
          : _phoneController.text.trim(),
      role: _role,
    );
    if (!context.mounted || success) return;
    if (auth.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.errorMessage!)),
      );
    }
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

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
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: Colors.red[800]),
            ),
          ),
        ],
      ),
    );
  }
}
