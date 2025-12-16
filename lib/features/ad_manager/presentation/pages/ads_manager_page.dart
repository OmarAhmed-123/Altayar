import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/ad_manager/presentation/providers/ad_provider.dart';
import 'package:altayar/features/ad_manager/presentation/widgets/ad_card.dart';
import 'package:altayar/features/ad_manager/presentation/widgets/ad_form.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';

class AdsManagerPage extends StatefulWidget {
  const AdsManagerPage({super.key});

  @override
  State<AdsManagerPage> createState() => _AdsManagerPageState();
}

class _AdsManagerPageState extends State<AdsManagerPage>
    with SingleTickerProviderStateMixin {
  File? _pickedImage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AdProvider>().loadAds();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final adProvider = context.watch<AdProvider>();
    final isAuthorized = _isAuthorized(auth.currentUser?.role ?? '');
    if (!isAuthorized) {
      return const Scaffold(
        body: Center(
          child: Text('هذه الصفحة متاحة فقط للإدارة والتسويق.'),
        ),
      );
    }
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('إدارة الإعلانات'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'الإعلانات الحالية'),
              Tab(text: 'إنشاء إعلان'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _AdsListTab(provider: adProvider),
            AdForm(
              onPickImage: _pickImage,
              selectedImage: _pickedImage,
              onSubmit: (payload) async {
                final success = await adProvider.createAd(
                  title: payload.title,
                  description: payload.description,
                  linkUrl: payload.linkUrl,
                  startDate: payload.startDate,
                  endDate: payload.endDate,
                  isActive: payload.isActive,
                  image: _pickedImage,
                );
                if (!context.mounted) return;
                final messenger = ScaffoldMessenger.of(context);
                if (success) {
                  messenger.showSnackBar(
                    const SnackBar(content: Text('تم إنشاء الإعلان.')),
                  );
                  setState(() => _pickedImage = null);
                  DefaultTabController.of(context).animateTo(0);
                } else if (adProvider.errorMessage != null) {
                  messenger.showSnackBar(
                    SnackBar(content: Text(adProvider.errorMessage!)),
                  );
                }
              },
              isSaving: adProvider.isSaving,
            ),
          ],
        ),
      ),
    );
  }

  bool _isAuthorized(String role) {
    final normalized = role.toLowerCase().replaceAll(' ', '_');
    return normalized == 'super_admin' ||
        normalized == 'admin' ||
        normalized == 'sales' ||
        normalized == 'marketing';
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      setState(() => _pickedImage = File(picked.path));
    }
  }
}

class _AdsListTab extends StatelessWidget {
  const _AdsListTab({required this.provider});

  final AdProvider provider;

  @override
  Widget build(BuildContext context) {
    if (provider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    return Column(
      children: [
        if (provider.errorMessage != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: _ErrorBanner(message: provider.errorMessage!),
          ),
        Expanded(
          child: provider.ads.isEmpty
              ? const Center(child: Text('لا توجد إعلانات حتى الآن.'))
              : RefreshIndicator(
                  onRefresh: () => provider.loadAds(refresh: true),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: provider.ads.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final ad = provider.ads[index];
                      return AdCard(
                        ad: ad,
                        onToggleActive: () => provider.toggleAdStatus(ad),
                        onDelete: () => provider.deleteAd(ad.id),
                        onSend: () async {
                          final message = await provider.sendAd(ad.id);
                          if (!context.mounted) return;
                          final fallback = provider.errorMessage ??
                              'تعذّر إرسال الإعلان، حاول مجدداً.';
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(message ?? fallback),
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: AppColors.errorGradient,
                ),
              ),
              child: const Icon(
                Icons.error_outline,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(
                  color: AppColors.error,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
