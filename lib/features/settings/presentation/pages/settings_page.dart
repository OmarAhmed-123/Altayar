import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/settings/data/models/frontend_page.dart';
import 'package:altayar/features/settings/data/models/site_settings.dart';
import 'package:altayar/features/settings/presentation/providers/settings_provider.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<SettingsProvider>().loadAll();
        setState(() => _initialized = true);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final role = auth.currentUser?.role ?? '';
    final canEditGeneral = role == 'super_admin';
    final canEditPages = {
      'super_admin',
      'admin',
      'marketing',
    }.contains(role);

    // Allow all users to view, but only specific roles can edit
    final canView = true; // All authenticated users can view

    final tabs = <Tab>[
      const Tab(text: 'الإعدادات العامة'),
      const Tab(text: 'صفحات الواجهة'),
    ];

    return DefaultTabController(
      length: tabs.length,
      child: Scaffold(
        appBar: AppBar(
          leading: Navigator.of(context).canPop() ? const BackButton() : null,
          title: const Text('الإعدادات والواجهة'),
          bottom: TabBar(tabs: tabs),
          actions: [
            IconButton(
              tooltip: 'تحديث البيانات',
              onPressed: () =>
                  context.read<SettingsProvider>().loadAll(refresh: true),
              icon: const Icon(Icons.refresh),
            ),
          ],
        ),
        body: TabBarView(
          children: [
            _GeneralSettingsTab(canEdit: canEditGeneral, canView: canView),
            _FrontendPagesTab(canEdit: canEditPages, canView: canView),
          ],
        ),
        floatingActionButton:
            canEditPages ? _SettingsFab(initialized: _initialized) : null,
      ),
    );
  }
}

class _SettingsFab extends StatelessWidget {
  const _SettingsFab({required this.initialized});

  final bool initialized;

  @override
  Widget build(BuildContext context) {
    if (!initialized) return const SizedBox.shrink();
    final provider = context.watch<SettingsProvider>();
    if (provider.isLoadingPages) return const SizedBox.shrink();
    return FloatingActionButton.extended(
      onPressed: provider.isMutatingPage
          ? null
          : () => _PageEditorSheet.show(context, draft: FrontendPageDraft()),
      icon: const Icon(Icons.add),
      label: const Text('إضافة صفحة'),
    );
  }
}

class _GeneralSettingsTab extends StatefulWidget {
  const _GeneralSettingsTab({
    required this.canEdit,
    required this.canView,
  });

  final bool canEdit;
  final bool canView;

  @override
  State<_GeneralSettingsTab> createState() => _GeneralSettingsTabState();
}

class _GeneralSettingsTabState extends State<_GeneralSettingsTab> {
  final _formKey = GlobalKey<FormState>();
  final _siteNameController = TextEditingController();
  final _emailController = TextEditingController();
  String _currency = 'USD';
  bool _maintenance = false;
  String? _lastSignature;

  static const _currencies = [
    'USD',
    'EUR',
    'GBP',
    'AED',
    'SAR',
    'EGP',
  ];

  @override
  void dispose() {
    _siteNameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final provider = context.watch<SettingsProvider>();
    final settings = provider.generalSettings ?? SiteSettings.defaults();
    final signature = _signature(settings);
    if (_lastSignature != signature) {
      _siteNameController.text = settings.siteName;
      _emailController.text = settings.contactEmail;
      _currency = settings.currency;
      _maintenance = settings.maintenanceMode;
      _lastSignature = signature;
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SettingsProvider>();
    final isBusy = provider.isSavingGeneral || provider.isLoadingGeneral;

    if (!widget.canView) {
      return const _NoAccessView(
        message: 'ليست لديك الصلاحية لعرض هذه الصفحة.',
      );
    }

    return RefreshIndicator(
      onRefresh: () => provider.fetchGeneralSettings(forceRefresh: true),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        physics: const AlwaysScrollableScrollPhysics(),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'تفاصيل العلامة التجارية',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  if (!widget.canEdit)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.orange.withAlpha((255 * .15).round()),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.orange.withAlpha((255 * .3).round()),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.visibility_outlined,
                            size: 16,
                            color: Colors.orange[700],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'عرض فقط',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.orange[700],
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              if (!widget.canEdit) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.withAlpha((255 * .08).round()),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: Colors.blue.withAlpha((255 * .2).round()),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        size: 20,
                        color: Colors.blue[700],
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'أنت تتصفح البيانات في وضع القراءة فقط. لا يمكنك التعديل.',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.blue[900],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 12),
              TextFormField(
                controller: _siteNameController,
                enabled: widget.canEdit,
                readOnly: !widget.canEdit,
                decoration: InputDecoration(
                  labelText: 'اسم المنصة',
                  prefixIcon: const Icon(Icons.public),
                  filled: !widget.canEdit,
                  fillColor: !widget.canEdit
                      ? Colors.grey.withAlpha((255 * .05).round())
                      : null,
                ),
                validator: widget.canEdit
                    ? (value) =>
                        value == null || value.isEmpty ? 'الحقل مطلوب' : null
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                enabled: widget.canEdit,
                readOnly: !widget.canEdit,
                decoration: InputDecoration(
                  labelText: 'بريد التواصل',
                  prefixIcon: const Icon(Icons.email_outlined),
                  filled: !widget.canEdit,
                  fillColor: !widget.canEdit
                      ? Colors.grey.withAlpha((255 * .05).round())
                      : null,
                ),
                validator: widget.canEdit
                    ? (value) {
                        if (value == null || value.isEmpty) {
                          return 'الحقل مطلوب';
                        }
                        if (!value.contains('@')) {
                          return 'صيغة بريد غير صحيحة';
                        }
                        return null;
                      }
                    : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _currencies.contains(_currency) ? _currency : 'USD',
                decoration: InputDecoration(
                  labelText: 'العملة الرئيسية',
                  prefixIcon: const Icon(Icons.attach_money),
                  filled: !widget.canEdit,
                  fillColor: !widget.canEdit
                      ? Colors.grey.withAlpha((255 * .05).round())
                      : null,
                ),
                items: _currencies
                    .map((value) => DropdownMenuItem(
                          value: value,
                          child: Text(value),
                        ))
                    .toList(),
                onChanged: widget.canEdit
                    ? (value) {
                        if (value != null) setState(() => _currency = value);
                      }
                    : null,
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                value: _maintenance,
                onChanged: widget.canEdit
                    ? (value) => setState(() => _maintenance = value)
                    : null,
                title: const Text('وضع الصيانة'),
                subtitle: const Text('إيقاف الواجهة الأمامية مؤقتاً'),
              ),
              if (provider.generalError != null) ...[
                const SizedBox(height: 12),
                _ErrorBanner(provider.generalError!),
              ],
              if (widget.canEdit) ...[
                const SizedBox(height: 20),
                GradientButton(
                  label: 'حفظ الإعدادات',
                  icon: Icons.save_outlined,
                  onPressed: isBusy ? null : () => _save(context),
                  isBusy: isBusy,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 16,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _save(BuildContext context) async {
    if (!_formKey.currentState!.validate()) return;
    final provider = context.read<SettingsProvider>();
    final base = provider.generalSettings ?? SiteSettings.defaults();
    final draft = base.copyWith(
      siteName: _siteNameController.text.trim(),
      contactEmail: _emailController.text.trim(),
      currency: _currency,
      maintenanceMode: _maintenance,
    );
    final success = await provider.saveGeneral(draft);
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    if (success) {
      messenger.showSnackBar(
        const SnackBar(content: Text('تم حفظ الإعدادات بنجاح')),
      );
    } else if (provider.generalError != null) {
      messenger.showSnackBar(
        SnackBar(content: Text(provider.generalError!)),
      );
    }
  }

  String _signature(SiteSettings settings) =>
      '${settings.siteName}|${settings.contactEmail}|${settings.currency}|${settings.maintenanceMode}';
}

class _FrontendPagesTab extends StatelessWidget {
  const _FrontendPagesTab({
    required this.canEdit,
    required this.canView,
  });

  final bool canEdit;
  final bool canView;

  @override
  Widget build(BuildContext context) {
    if (!canView) {
      return const _NoAccessView(
        message: 'ليست لديك الصلاحية لعرض هذه الصفحة.',
      );
    }
    final provider = context.watch<SettingsProvider>();
    final children = <Widget>[
      if (provider.pagesError != null) ...[
        _ErrorBanner(provider.pagesError!),
        const SizedBox(height: 12),
      ],
    ];

    if (provider.isLoadingPages) {
      children.addAll(const [
        SizedBox(height: 120),
        Center(child: CircularProgressIndicator()),
      ]);
    } else if (provider.pages.isEmpty) {
      children.add(const Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: _EmptyState(),
      ));
    } else {
      for (final page in provider.pages) {
        children
          ..add(_PageCard(page: page, canEdit: canEdit))
          ..add(const SizedBox(height: 12));
      }
    }

    return RefreshIndicator(
      onRefresh: () => provider.fetchPages(forceRefresh: true),
      child: ListView(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        children: children,
      ),
    );
  }
}

class _PageCard extends StatelessWidget {
  const _PageCard({
    required this.page,
    required this.canEdit,
  });

  final FrontendPage page;
  final bool canEdit;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SettingsProvider>();
    final isDeleting = provider.isDeleting(page.id);
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    page.name,
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                Chip(
                  label: Text(page.isPublished ? 'منشور' : 'مسودة'),
                  backgroundColor: page.isPublished
                      ? Colors.green.withAlpha((255 * .15).round())
                      : Colors.grey.withAlpha((255 * .2).round()),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '/${page.slug}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 8),
            Text(
              page.content.length > 140
                  ? '${page.content.substring(0, 140)}...'
                  : page.content,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _InfoChip(
                  icon: Icons.category_outlined,
                  label: _describePageType(page.pageType),
                ),
                if (page.authorName != null)
                  _InfoChip(
                    icon: Icons.person_outline,
                    label: page.authorName!,
                  ),
                if (page.updatedAt != null)
                  _InfoChip(
                    icon: Icons.update,
                    label: 'آخر تحديث ${_formatDate(page.updatedAt!)}',
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                TextButton.icon(
                  onPressed: () => _PagePreviewDialog.show(context, page),
                  icon: const Icon(Icons.visibility_outlined),
                  label: const Text('معاينة'),
                ),
                const Spacer(),
                if (canEdit) ...[
                  IconButton(
                    tooltip: 'تعديل',
                    onPressed: () => _PageEditorSheet.show(
                      context,
                      draft: FrontendPageDraft.fromPage(page),
                    ),
                    icon: const Icon(Icons.edit_outlined),
                  ),
                  IconButton(
                    tooltip: 'حذف',
                    onPressed: isDeleting
                        ? null
                        : () => _confirmDelete(context, page.id),
                    icon: isDeleting
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.delete_outline, color: Colors.red),
                  ),
                ] else ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.orange.withAlpha((255 * .15).round()),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: Colors.orange.withAlpha((255 * .3).round()),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.visibility_outlined,
                          size: 16,
                          color: Colors.orange[700],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'عرض فقط',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.orange[700],
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, int id) async {
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('حذف الصفحة'),
            content: const Text('هل أنت متأكد من حذف هذه الصفحة؟'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('تراجع'),
              ),
              GradientButton(
                label: 'حذف',
                icon: Icons.delete,
                onPressed: () => Navigator.pop(context, true),
                colors: AppColors.errorGradient,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
              ),
            ],
          ),
        ) ??
        false;
    if (!confirmed) return;
    final provider = context.read<SettingsProvider>();
    final success = await provider.deletePage(id);
    if (!context.mounted) return;
    if (!success && provider.pagesError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.pagesError!)),
      );
    }
  }

  static String _describePageType(String type) {
    switch (type) {
      case 'front':
        return 'واجهة';
      case 'policy':
        return 'سياسة';
      default:
        return 'مخصصة';
    }
  }

  static String _formatDate(DateTime date) {
    final now = DateTime.now();
    if (now.difference(date).inDays < 1) {
      return 'اليوم';
    }
    return '${date.day}/${date.month}/${date.year}';
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 16),
      label: Text(label),
    );
  }
}

class _NoAccessView extends StatelessWidget {
  const _NoAccessView({
    this.message = 'ليست لديك الصلاحية لعرض هذه الصفحة.',
  });

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.lock_outline, size: 42, color: Colors.orange[400]),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.web_outlined, size: 48, color: Colors.blue[400]),
          const SizedBox(height: 12),
          const Text('لا توجد صفحات بعد'),
          const SizedBox(height: 8),
          Text(
            'ابدأ بإضافة صفحة لتعكس محتوى الواجهة الأمامية.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner(this.message);

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withAlpha((255 * .08).round()),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Colors.redAccent),
          const SizedBox(width: 8),
          Expanded(child: Text(message)),
        ],
      ),
    );
  }
}

class _PagePreviewDialog extends StatelessWidget {
  const _PagePreviewDialog({required this.page});

  final FrontendPage page;

  static Future<void> show(BuildContext context, FrontendPage page) {
    return showDialog<void>(
      context: context,
      builder: (context) => _PagePreviewDialog(page: page),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(page.name),
      content: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('المسار: /${page.slug}'),
            const SizedBox(height: 12),
            Text(page.content),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('إغلاق'),
        ),
      ],
    );
  }
}

class _PageEditorSheet extends StatefulWidget {
  const _PageEditorSheet({required this.draft});

  final FrontendPageDraft draft;

  static Future<void> show(
    BuildContext context, {
    required FrontendPageDraft draft,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: _PageEditorSheet(draft: draft),
      ),
    );
  }

  @override
  State<_PageEditorSheet> createState() => _PageEditorSheetState();
}

class _PageEditorSheetState extends State<_PageEditorSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _slugController;
  late final TextEditingController _contentController;
  late bool _isPublished;
  late String _pageType;

  static const _pageTypes = {
    'front': 'واجهة',
    'policy': 'سياسة',
    'custom': 'مخصصة',
  };

  @override
  void initState() {
    super.initState();
    final draft = widget.draft;
    _nameController = TextEditingController(text: draft.name);
    _slugController = TextEditingController(text: draft.slug);
    _contentController = TextEditingController(text: draft.content);
    _isPublished = draft.isPublished;
    _pageType = draft.pageType;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _slugController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SettingsProvider>();
    final isSaving = provider.isMutatingPage;
    final isEditing = widget.draft.id != null;

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 38,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.grey[400],
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            Text(
              isEditing ? 'تعديل الصفحة' : 'إضافة صفحة جديدة',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: 'الاسم',
                suffixIcon: IconButton(
                  tooltip: 'توليد المسار تلقائياً',
                  onPressed: () {
                    final slug = _slugify(_nameController.text);
                    if (slug.isNotEmpty) {
                      _slugController.text = slug;
                    }
                  },
                  icon: const Icon(Icons.auto_fix_high_outlined),
                ),
              ),
              validator: (value) =>
                  value == null || value.isEmpty ? 'الحقل مطلوب' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _slugController,
              decoration: const InputDecoration(
                labelText: 'المسار (slug)',
                prefixText: '/',
              ),
              validator: (value) {
                if (value == null || value.isEmpty) return 'الحقل مطلوب';
                final slug = _slugify(value);
                if (slug.isEmpty) return 'المسار غير صالح';
                return null;
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue:
                  _pageTypes.keys.contains(_pageType) ? _pageType : 'front',
              decoration: const InputDecoration(
                labelText: 'نوع الصفحة',
                prefixIcon: Icon(Icons.category_outlined),
              ),
              items: _pageTypes.entries
                  .map(
                    (entry) => DropdownMenuItem(
                      value: entry.key,
                      child: Text(entry.value),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                if (value != null) setState(() => _pageType = value);
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _contentController,
              maxLines: 6,
              decoration: const InputDecoration(
                labelText: 'المحتوى',
                alignLabelWithHint: true,
              ),
              validator: (value) =>
                  value == null || value.isEmpty ? 'الحقل مطلوب' : null,
            ),
            SwitchListTile(
              value: _isPublished,
              onChanged: (value) => setState(() => _isPublished = value),
              title: const Text('نشر الصفحة فوراً'),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: GradientButton(
                label: isEditing ? 'حفظ التعديلات' : 'إنشاء الصفحة',
                icon: Icons.save_outlined,
                onPressed: isSaving ? null : () => _save(context),
                isBusy: isSaving,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _save(BuildContext context) async {
    if (!_formKey.currentState!.validate()) return;
    final provider = context.read<SettingsProvider>();
    final draft = widget.draft
      ..name = _nameController.text.trim()
      ..slug = _slugify(_slugController.text.trim())
      ..content = _contentController.text.trim()
      ..pageType = _pageType
      ..isPublished = _isPublished;
    final success = await provider.savePage(draft);
    if (!mounted) return;
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    if (success) {
      navigator.pop();
      messenger.showSnackBar(
        const SnackBar(content: Text('تم حفظ الصفحة بنجاح')),
      );
    } else if (provider.pagesError != null) {
      messenger.showSnackBar(
        SnackBar(content: Text(provider.pagesError!)),
      );
    }
  }

  String _slugify(String value) {
    return value
        .toLowerCase()
        .trim()
        .replaceAll(RegExp(r'[^a-z0-9\u0621-\u064A\s-]'), '')
        .replaceAll(RegExp(r'\s+'), '-')
        .replaceAll(RegExp('-+'), '-');
  }
}
