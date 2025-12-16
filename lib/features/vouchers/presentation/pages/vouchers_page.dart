import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/vouchers/presentation/providers/voucher_provider.dart';
import 'package:altayar/features/vouchers/presentation/widgets/voucher_card.dart';
import 'package:altayar/features/vouchers/presentation/widgets/voucher_creation_sheet.dart';

class VouchersPage extends StatefulWidget {
  const VouchersPage({super.key});

  @override
  State<VouchersPage> createState() => _VouchersPageState();
}

class _VouchersPageState extends State<VouchersPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      final includeAdmin = _isAdmin(auth);
      context.read<VoucherProvider>().loadData(includeAdmin: includeAdmin);
    });
  }

  @override
  Widget build(BuildContext context) {
    final vouchers = context.watch<VoucherProvider>();
    final auth = context.watch<AuthProvider>();
    final isAdmin = _isAdmin(auth);

    return Scaffold(
      appBar: AppBar(
        title: const Text('نظام القسائم والمكافآت'),
        actions: [
          if (isAdmin)
            IconButton(
              onPressed: () => _openCreationSheet(context),
              icon: const Icon(Icons.card_giftcard),
              tooltip: 'منح قسيمة',
            ),
          IconButton(
            onPressed: () =>
                vouchers.loadData(refresh: true, includeAdmin: isAdmin),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: vouchers.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () =>
                  vouchers.loadData(refresh: true, includeAdmin: isAdmin),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _FilterRow(
                    status: vouchers.statusFilter,
                    type: vouchers.typeFilter,
                    onStatusChanged: vouchers.setStatusFilter,
                    onTypeChanged: vouchers.setTypeFilter,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'قسائمي',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  if (vouchers.filteredMyVouchers.isEmpty)
                    const _EmptyState(message: 'لا توجد قسائم حالياً.')
                  else
                    ...vouchers.filteredMyVouchers.map(
                      (voucher) => VoucherCard(
                        voucher: voucher,
                        onRedeem: voucher.isActive
                            ? () => vouchers
                                    .redeemVoucher(voucher.code)
                                    .then((value) {
                                  if (value != null) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          'تم تفعيل القسيمة ${value.code}',
                                        ),
                                      ),
                                    );
                                  }
                                })
                            : null,
                      ),
                    ),
                  if (isAdmin) ...[
                    const SizedBox(height: 24),
                    Text(
                      'القسائم الصادرة',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    if (vouchers.filteredAdminVouchers.isEmpty)
                      const _EmptyState(
                          message: 'لا توجد قسائم صادرة في الفلاتر الحالية.')
                    else
                      ...vouchers.filteredAdminVouchers
                          .map((voucher) => VoucherCard(voucher: voucher)),
                  ],
                ],
              ),
            ),
    );
  }

  Future<void> _openCreationSheet(BuildContext context) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => ChangeNotifierProvider.value(
        value: context.read<VoucherProvider>(),
        child: const VoucherCreationSheet(),
      ),
    );
  }
}

bool _isAdmin(AuthProvider auth) {
  final role = auth.currentUser?.role.toLowerCase().replaceAll(' ', '_');
  return auth.currentUser?.isSuperAdmin == true ||
      role == 'super_admin' ||
      role == 'admin' ||
      role == 'sales';
}

class _FilterRow extends StatelessWidget {
  const _FilterRow({
    required this.status,
    required this.type,
    required this.onStatusChanged,
    required this.onTypeChanged,
  });

  final String? status;
  final String? type;
  final ValueChanged<String?> onStatusChanged;
  final ValueChanged<String?> onTypeChanged;

  static const statuses = ['active', 'redeemed', 'expired'];
  static const types = [
    'عشاء',
    'إفطار',
    'SPA',
    'جيم',
    'عناية بالأسنان',
    'ميكب'
  ];

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        DropdownButton<String?>(
          value: status,
          hint: const Text('حالة القسيمة'),
          items: [
            const DropdownMenuItem<String?>(
              value: null,
              child: Text('الكل'),
            ),
            ...statuses.map(
              (item) => DropdownMenuItem<String?>(
                value: item,
                child: Text(item.toUpperCase()),
              ),
            ),
          ],
          onChanged: onStatusChanged,
        ),
        DropdownButton<String?>(
          value: type,
          hint: const Text('نوع القسيمة'),
          items: [
            const DropdownMenuItem<String?>(
              value: null,
              child: Text('الكل'),
            ),
            ...types.map(
              (item) => DropdownMenuItem<String?>(
                value: item,
                child: Text(item),
              ),
            ),
          ],
          onChanged: onTypeChanged,
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      margin: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.card_giftcard),
          const SizedBox(width: 12),
          Expanded(child: Text(message)),
        ],
      ),
    );
  }
}
