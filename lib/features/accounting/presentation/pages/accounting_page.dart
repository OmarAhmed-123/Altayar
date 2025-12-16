import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/accounting/data/models/transaction_model.dart';
import 'package:altayar/features/accounting/presentation/providers/accounting_provider.dart';
import 'package:altayar/features/accounting/presentation/widgets/referral_card.dart';
import 'package:altayar/features/accounting/presentation/widgets/transaction_tile.dart';
import 'package:altayar/features/accounting/presentation/widgets/wallet_overview_card.dart';

class AccountingPage extends StatefulWidget {
  const AccountingPage({super.key});

  @override
  State<AccountingPage> createState() => _AccountingPageState();
}

class _AccountingPageState extends State<AccountingPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<AccountingProvider>().loadAll();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AccountingProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('المحاسبة والمحفظة'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => provider.loadAll(refresh: true),
          ),
        ],
      ),
      body: provider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => provider.loadAll(refresh: true),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                children: [
                  if (provider.wallet != null)
                    WalletOverviewCard(summary: provider.wallet!),
                  const SizedBox(height: 16),
                  if (provider.referralSummary != null)
                    ReferralCard(
                      summary: provider.referralSummary!,
                      isInviting: provider.isInviting,
                      onInvite: (email) => provider.inviteFriend(email),
                    ),
                  const SizedBox(height: 16),
                  _TransactionSection(provider: provider),
                  if (provider.errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Text(
                        provider.errorMessage!,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}

class _TransactionSection extends StatelessWidget {
  const _TransactionSection({required this.provider});

  final AccountingProvider provider;

  @override
  Widget build(BuildContext context) {
    final transactions = provider.filteredTransactions;
    return GlassCard(
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: AppColors.primaryGradient,
                  ),
                ),
                child: const Icon(
                  Icons.receipt_long,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'سجل المعاملات',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.dark,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                ChoiceChip(
                  label: const Text('الكل'),
                  selected: provider.typeFilter == null,
                  onSelected: (_) => provider.setFilter(null),
                ),
                const SizedBox(width: 8),
                ...TransactionType.values.map(
                  (type) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(_label(type)),
                      selected: provider.typeFilter == type,
                      onSelected: (_) => provider.setFilter(type),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (transactions.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('لا توجد معاملات في الفترة الحالية.'),
            )
          else
            ...transactions.map(
              (tx) => Column(
                children: [
                  TransactionTile(transaction: tx),
                  const Divider(),
                ],
              ),
            ),
        ],
      ),
    );
  }

  String _label(TransactionType type) {
    switch (type) {
      case TransactionType.membershipPurchase:
        return 'شراء عضوية';
      case TransactionType.bookingPayment:
        return 'حجوزات';
      case TransactionType.cashbackEarned:
        return 'كاش باك';
      case TransactionType.pointsSpent:
        return 'صرف نقاط';
      case TransactionType.manualDeposit:
        return 'محاسبة';
      case TransactionType.invoicePayment:
        return 'فواتير';
    }
  }
}
