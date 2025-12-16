import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/user_management/data/models/manual_gift_payload.dart';
import 'package:altayar/features/user_management/presentation/providers/role_analytics_provider.dart';
import 'package:altayar/features/user_management/presentation/providers/user_management_provider.dart';
import 'package:altayar/features/user_management/presentation/widgets/employee_profile_card.dart';
import 'package:altayar/features/user_management/presentation/widgets/manual_gift_form.dart';
import 'package:altayar/features/user_management/presentation/widgets/live_monitoring_panel.dart';
import 'package:altayar/features/user_management/presentation/widgets/role_matrix_board.dart';
import 'package:altayar/features/user_management/presentation/widgets/user_card.dart';
import 'package:altayar/features/user_management/presentation/pages/add_user_page.dart';

class UserManagementPage extends StatefulWidget {
  const UserManagementPage({super.key});

  @override
  State<UserManagementPage> createState() => _UserManagementPageState();
}

class _UserManagementPageState extends State<UserManagementPage>
    with AutomaticKeepAliveClientMixin {
  int? _selectedUserId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<UserManagementProvider>().loadUsers();
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final theme = Theme.of(context);
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('إدارة المستخدمين والصلاحيات'),
          actions: [
            IconButton(
              icon: const Icon(Icons.person_add),
              tooltip: 'إضافة مستخدم جديد',
              onPressed: () async {
                final result = await Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const AddUserPage(),
                  ),
                );
                if (result == true && mounted) {
                  // Refresh users list
                  context.read<UserManagementProvider>().loadUsers();
                }
              },
            ),
          ],
          bottom: const TabBar(
            tabs: [
              Tab(text: 'المستخدمون'),
              Tab(text: 'الهدايا اليدوية'),
              Tab(text: 'ملف الموظف'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _UsersTab(theme: theme),
            _ManualGiftTab(
              onUserSelected: (id) => setState(() => _selectedUserId = id),
              selectedUserId: _selectedUserId,
            ),
            const _EmployeeTab(),
          ],
        ),
      ),
    );
  }

  @override
  bool get wantKeepAlive => true;
}

class _UsersTab extends StatelessWidget {
  const _UsersTab({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Consumer<UserManagementProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (provider.errorMessage != null) {
          return Center(child: Text(provider.errorMessage!));
        }
        final users = provider.users;
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              TextField(
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.search),
                  hintText: 'ابحث بالاسم أو البريد',
                ),
                onChanged: provider.setSearchQuery,
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 48,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _FilterChip(
                      label: 'الكل',
                      selected: provider.roleFilter == null,
                      onSelected: () => provider.setRoleFilter(null),
                    ),
                    for (final role in {
                      'super_admin',
                      'admin',
                      'hr',
                      'sales',
                      'support',
                      'agent',
                      'customer',
                    })
                      _FilterChip(
                        label: role.toUpperCase(),
                        selected: provider.roleFilter == role,
                        onSelected: () => provider.setRoleFilter(role),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: users.isEmpty
                    ? const Center(child: Text('لا يوجد مستخدمون مطابقون'))
                    : ListView.builder(
                        itemCount: users.length,
                        itemBuilder: (context, index) {
                          final user = users[index];
                          return UserCard(
                            user: user,
                            onRoleChange: (role) {
                              context
                                  .read<UserManagementProvider>()
                                  .updateUserRole(user, role);
                            },
                            onGiftTap: () => showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              builder: (_) => ChangeNotifierProvider.value(
                                value: context.read<UserManagementProvider>(),
                                child: ManualGiftForm(userId: user.id),
                              ),
                            ),
                            onDelete: () => _showDeleteDialog(context, user),
                            onBan: () => _showBanDialog(context, user),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ManualGiftTab extends StatefulWidget {
  const _ManualGiftTab({
    required this.onUserSelected,
    required this.selectedUserId,
  });

  final ValueChanged<int?> onUserSelected;
  final int? selectedUserId;

  @override
  State<_ManualGiftTab> createState() => _ManualGiftTabState();
}

class _ManualGiftTabState extends State<_ManualGiftTab> {
  final _formKey = GlobalKey<FormState>();
  final _pointsController = TextEditingController();
  final _cashbackController = TextEditingController();
  final _voucherController = TextEditingController();
  final _descriptionController = TextEditingController();

  @override
  void dispose() {
    _pointsController.dispose();
    _cashbackController.dispose();
    _voucherController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<UserManagementProvider>();
    final users = provider.users;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'إرسال هدية مخصصة',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<int>(
              value: widget.selectedUserId,
              decoration: const InputDecoration(
                labelText: 'اختر المستخدم',
              ),
              items: users
                  .map(
                    (user) => DropdownMenuItem(
                      value: user.id,
                      child: Text('${user.name} • ${user.role.toUpperCase()}'),
                    ),
                  )
                  .toList(),
              onChanged: widget.onUserSelected,
              validator: (value) {
                if (value == null) return 'اختر مستخدمًا';
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _pointsController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'النقاط',
                prefixIcon: Icon(Icons.stars_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _cashbackController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'الكاش باك',
                prefixIcon: Icon(Icons.attach_money),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _voucherController,
              decoration: const InputDecoration(
                labelText: 'نوع الفوتشر',
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'ملاحظات',
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: provider.isSendingGift
                  ? null
                  : () async {
                      if (!_formKey.currentState!.validate()) return;
                      final payload = ManualGiftPayload(
                        points: _pointsController.text.isNotEmpty
                            ? int.tryParse(_pointsController.text)
                            : null,
                        cashback: _cashbackController.text.isNotEmpty
                            ? double.tryParse(_cashbackController.text)
                            : null,
                        voucherType: _voucherController.text,
                        description: _descriptionController.text,
                      );
                      final success = await context
                          .read<UserManagementProvider>()
                          .sendManualGift(
                            userId: widget.selectedUserId!,
                            payload: payload,
                          );
                      if (!mounted) return;
                      if (success) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('تم إرسال الهدية'),
                          ),
                        );
                        _formKey.currentState?.reset();
                        _pointsController.clear();
                        _cashbackController.clear();
                        _voucherController.clear();
                        _descriptionController.clear();
                      }
                    },
              icon: provider.isSendingGift
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.card_giftcard),
              label: const Text('إرسال'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmployeeTab extends StatefulWidget {
  const _EmployeeTab();

  @override
  State<_EmployeeTab> createState() => _EmployeeTabState();
}

class _EmployeeTabState extends State<_EmployeeTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RoleAnalyticsProvider>().initialize();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final analytics = context.watch<RoleAnalyticsProvider>();
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const EmployeeProfileCard(),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'تحقق متعدد العوامل',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: true,
                  onChanged: (_) {},
                  title: const Text('تفعيل OTP'),
                  subtitle: const Text('مطلوب للأدوار الحساسة'),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: auth.currentUser?.isSuperAdmin ?? false,
                  onChanged: (_) {},
                  title: const Text('توقيع رقمي للعمليات الحرجة'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        RoleMatrixBoard(
          entries: analytics.matrix,
          onRefresh: analytics.refreshMatrix,
          isLoading: analytics.isMatrixLoading,
        ),
        const SizedBox(height: 16),
        LiveMonitoringPanel(
          metrics: analytics.liveMetrics,
          activities: analytics.activities,
          isLoading: analytics.isRealtimeLoading,
          onRefresh: analytics.refreshRealtime,
        ),
      ],
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onSelected,
  });

  final String label;
  final bool selected;
  final VoidCallback onSelected;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onSelected(),
      ),
    );
  }
}

void _showDeleteDialog(BuildContext context, user) {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('تأكيد الحذف'),
      content: Text(
          'هل أنت متأكد من حذف المستخدم "${user.name}"؟\n\nهذه العملية لا يمكن التراجع عنها.'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('إلغاء'),
        ),
        FilledButton(
          onPressed: () async {
            Navigator.pop(context);
            final provider = context.read<UserManagementProvider>();
            final success = await provider.deleteUser(user);
            if (!context.mounted) return;
            if (success) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('تم حذف المستخدم بنجاح'),
                  backgroundColor: Colors.green,
                ),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                      provider.errorMessage ?? 'حدث خطأ أثناء حذف المستخدم'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
          style: FilledButton.styleFrom(
            backgroundColor: Colors.red,
          ),
          child: const Text('حذف'),
        ),
      ],
    ),
  );
}

void _showBanDialog(BuildContext context, user) {
  final isBanned = user.banned;
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(isBanned ? 'إلغاء الحظر' : 'حظر المستخدم'),
      content: Text(
        isBanned
            ? 'هل تريد إلغاء حظر المستخدم "${user.name}"؟'
            : 'هل أنت متأكد من حظر المستخدم "${user.name}"؟\n\nالمستخدم المحظور لن يتمكن من تسجيل الدخول.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('إلغاء'),
        ),
        FilledButton(
          onPressed: () async {
            Navigator.pop(context);
            final provider = context.read<UserManagementProvider>();
            final success = await provider.banUser(
              user: user,
              banned: !isBanned,
            );
            if (!context.mounted) return;
            if (success) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    isBanned
                        ? 'تم إلغاء حظر المستخدم بنجاح'
                        : 'تم حظر المستخدم بنجاح',
                  ),
                  backgroundColor: Colors.green,
                ),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(provider.errorMessage ?? 'حدث خطأ'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
          style: FilledButton.styleFrom(
            backgroundColor: isBanned ? Colors.green : Colors.red,
          ),
          child: Text(isBanned ? 'إلغاء الحظر' : 'حظر'),
        ),
      ],
    ),
  );
}
