import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher_string.dart';

import 'package:altayar/core/localization/localized_text.dart';

class FrontendPages extends StatelessWidget {
  const FrontendPages({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: const [
        _HeroSection(),
        SizedBox(height: 24),
        _AboutSection(),
        SizedBox(height: 24),
        _MembershipLandingSection(),
        SizedBox(height: 24),
        _ContactSection(),
        SizedBox(height: 24),
        _PoliciesSection(),
      ],
    );
  }
}

class _HeroSection extends StatelessWidget {
  const _HeroSection();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.secondary,
          ],
        ),
        borderRadius: BorderRadius.circular(32),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          LocalizedText(
            ar: 'اكتشف العالم مع الطيار',
            en: 'Discover the world with Altayar',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          LocalizedText(
            ar: 'خطط سفر متكاملة، عضويات مميزة، وتجارب لا تُنسى.',
            en: 'Complete travel plans, premium memberships, and unforgettable experiences.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.white70,
                ),
          ),
        ],
      ),
    );
  }
}

class _AboutSection extends StatelessWidget {
  const _AboutSection();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LocalizedText(
              ar: 'من نحن',
              en: 'About Us',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            const LocalizedText(
              ar: 'نقدم حلول سفر مبتكرة لقطاعي الأفراد والشركات، مع تركيز على الولاء والتجارب الحصرية.',
              en: 'We provide innovative travel solutions for individuals and enterprises, focusing on loyalty and exclusive experiences.',
            ),
          ],
        ),
      ),
    );
  }
}

class _MembershipLandingSection extends StatelessWidget {
  const _MembershipLandingSection();

  @override
  Widget build(BuildContext context) {
    final tiers = [
      ('Silver', 'مزايا أساسية ونظام نقاط سريع'),
      ('Gold', 'دعم مخصص وكاش باك أعلى'),
      ('VIP', 'خدمات كونسييرج وفعاليات خاصة'),
    ];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LocalizedText(
              ar: 'عضويات الطيار',
              en: 'Altayar Memberships',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            ...tiers.map(
              (tier) => ListTile(
                title: Text(tier.$1),
                subtitle: LocalizedText(
                  ar: tier.$2,
                  en: tier.$2,
                ),
                leading: const Icon(Icons.workspace_premium),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContactSection extends StatefulWidget {
  const _ContactSection();

  @override
  State<_ContactSection> createState() => _ContactSectionState();
}

class _ContactSectionState extends State<_ContactSection> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _messageController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LocalizedText(
                ar: 'اتصل بنا',
                en: 'Contact Us',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'الاسم / Name',
                ),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'البريد الإلكتروني / Email',
                ),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _messageController,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'رسالتك / Message',
                ),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: _submit,
                icon: const Icon(Icons.send),
                label: const Text('إرسال / Send'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final uri =
        'mailto:hello@altayar.com?subject=Contact&body=${_messageController.text}';
    await launchUrlString(uri);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم إرسال الرسالة عبر البريد.')),
      );
    }
  }
}

class _PoliciesSection extends StatelessWidget {
  const _PoliciesSection();

  @override
  Widget build(BuildContext context) {
    final policies = [
      (
        'الشروط والأحكام',
        'يخضع استخدام التطبيق لشروط الحجز والدفع وسياسة استرداد الأموال.'
      ),
      (
        'سياسة الخصوصية',
        'نحترم بيانات العميل ونستخدمها فقط لأغراض تقديم الخدمات وتحسين التجربة.'
      ),
    ];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LocalizedText(
              ar: 'الشروط والسياسات',
              en: 'Terms & Policies',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            ...policies.map(
              (policy) => ExpansionTile(
                title: Text(policy.$1),
                children: [
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(policy.$2),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
