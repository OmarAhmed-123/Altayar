import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/widgets/animated_card.dart';
import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/core/utils/date_formatter.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/booking/data/models/booking.dart';
import 'package:altayar/features/sales/data/models/client_profile.dart';
import 'package:altayar/features/sales/data/models/quotation_item.dart';
import 'package:altayar/features/sales/data/models/quotation_summary.dart';
import 'package:altayar/features/sales/presentation/providers/sales_provider.dart';
import 'package:altayar/features/user_management/data/models/user_account.dart';

class SalesPage extends StatefulWidget {
  const SalesPage({super.key});

  @override
  State<SalesPage> createState() => _SalesPageState();
}

class _SalesPageState extends State<SalesPage> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SalesProvider>().loadCustomers();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final provider = context.watch<SalesProvider>();
    final isAuthorized = _isSales(auth);

    return Scaffold(
      appBar: AppBar(
        leading: Navigator.of(context).canPop() ? const BackButton() : null,
        title: const Text('موديول المبيعات (Sales & CRM Lite)'),
        actions: [
          if (isAuthorized)
            IconButton(
              onPressed: () =>
                  provider.loadCustomers(query: provider.searchQuery),
              icon: const Icon(Icons.refresh),
            ),
        ],
      ),
      body: !isAuthorized
          ? const _AccessDenied()
          : LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth > 900;
                final list = _CustomerList(
                  customers: provider.customers,
                  isLoading: provider.isLoadingCustomers,
                  selectedId: provider.selectedProfile?.user.id,
                  onSelect: context.read<SalesProvider>().selectCustomer,
                  searchController: _searchController,
                );
                final detail = _ClientDetailPanel(
                  profile: provider.selectedProfile,
                  isLoading: provider.isLoadingProfile,
                  quotations: provider.quotations,
                  onSendOffer: () => _openOfferSheet(provider),
                  onCreateQuotation: () => _openQuotationSheet(provider),
                  isSendingOffer: provider.isSendingOffer,
                  isCreatingQuotation: provider.isCreatingQuotation,
                );
                if (isWide) {
                  return Row(
                    children: [
                      SizedBox(
                        width: constraints.maxWidth * 0.32,
                        child: list,
                      ),
                      const VerticalDivider(width: 1),
                      Expanded(child: detail),
                    ],
                  );
                }
                return Column(
                  children: [
                    Expanded(flex: 2, child: list),
                    const Divider(height: 1),
                    Expanded(flex: 3, child: detail),
                  ],
                );
              },
            ),
    );
  }

  bool _isSales(AuthProvider auth) {
    final role = auth.currentUser?.role.toLowerCase().replaceAll(' ', '_');
    return auth.currentUser?.isSuperAdmin == true ||
        role == 'super_admin' ||
        role == 'admin' ||
        role == 'sales';
  }

  Future<void> _openOfferSheet(SalesProvider provider) async {
    if (provider.selectedProfile == null) return;
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => ChangeNotifierProvider.value(
        value: provider,
        child: const _SendOfferSheet(),
      ),
    );
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم إرسال العرض للعميل بنجاح')),
      );
    }
  }

  Future<void> _openQuotationSheet(SalesProvider provider) async {
    if (provider.selectedProfile == null) return;
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => ChangeNotifierProvider.value(
        value: provider,
        child: const _QuotationSheet(),
      ),
    );
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم إنشاء وإرسال عرض السعر بنجاح')),
      );
    }
  }
}

class _CustomerList extends StatelessWidget {
  const _CustomerList({
    required this.customers,
    required this.isLoading,
    required this.selectedId,
    required this.onSelect,
    required this.searchController,
  });

  final List<UserAccount> customers;
  final bool isLoading;
  final int? selectedId;
  final Future<void> Function(UserAccount) onSelect;
  final TextEditingController searchController;

  @override
  Widget build(BuildContext context) {
    final provider = context.read<SalesProvider>();
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: searchController,
            onSubmitted: (value) => provider.loadCustomers(query: value),
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.search),
              hintText: 'ابحث عن عميل بالاسم أو البريد',
              suffixIcon: IconButton(
                onPressed: () {
                  searchController.clear();
                  provider.loadCustomers(query: '');
                },
                icon: const Icon(Icons.clear),
              ),
            ),
          ),
        ),
        if (isLoading)
          const Expanded(
            child: Center(child: CircularProgressIndicator()),
          )
        else if (customers.isEmpty)
          const Expanded(
            child: Center(child: Text('لا يوجد عملاء مطابقين.')),
          )
        else
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: customers.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final customer = customers[index];
                final isSelected = customer.id == selectedId;
                return AnimatedCard(
                  borderRadius: BorderRadius.circular(16),
                  margin: EdgeInsets.zero,
                  onTap: () async {
                    // Show loading indicator immediately
                    await onSelect(customer);
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: isSelected
                          ? LinearGradient(
                              colors: [
                                AppColors.primary.withOpacity(0.1),
                                AppColors.primary.withOpacity(0.05),
                              ],
                            )
                          : null,
                      color: isSelected ? null : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected
                            ? AppColors.primary.withOpacity(0.3)
                            : Colors.grey.shade200,
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              colors: AppColors.primaryGradient,
                            ),
                          ),
                          child: const Icon(
                            Icons.person,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                customer.name,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.dark,
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                customer.email,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: Colors.grey[700],
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'النقاط: ${customer.points}',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          Icons.chevron_right,
                          color: isSelected ? AppColors.primary : Colors.grey,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
}

class _ClientDetailPanel extends StatelessWidget {
  const _ClientDetailPanel({
    required this.profile,
    required this.isLoading,
    required this.quotations,
    required this.onSendOffer,
    required this.onCreateQuotation,
    required this.isSendingOffer,
    required this.isCreatingQuotation,
  });

  final ClientProfile? profile;
  final bool isLoading;
  final List<QuotationSummary> quotations;
  final VoidCallback onSendOffer;
  final VoidCallback onCreateQuotation;
  final bool isSendingOffer;
  final bool isCreatingQuotation;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('جاري تحميل تفاصيل العميل...'),
          ],
        ),
      );
    }
    if (profile == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.person_outline,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'اختر عميلًا لرؤية التفاصيل',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'اضغط على أي عميل من القائمة لعرض تفاصيله الكاملة',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[500],
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }
    final lastBooking = profile!.lastBooking;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GlassCard(
              borderRadius: BorderRadius.circular(24),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // CRITICAL: Enhanced customer details display
                    Row(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              colors: AppColors.primaryGradient,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withOpacity(0.3),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Center(
                            child: Text(
                              profile!.user.name.isNotEmpty
                                  ? profile!.user.name[0].toUpperCase()
                                  : 'U',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                profile!.user.name,
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall
                                    ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(
                                    Icons.email_outlined,
                                    size: 16,
                                    color: Colors.grey[600],
                                  ),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      profile!.user.email,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium
                                          ?.copyWith(
                                            color: Colors.grey[700],
                                          ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Chip(
                                label: Text(profile!.membershipTier),
                                avatar: const Icon(
                                  Icons.workspace_premium,
                                  size: 18,
                                ),
                                backgroundColor:
                                    AppColors.primary.withOpacity(0.1),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    // CRITICAL: Enhanced statistics display
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: AppColors.primary.withOpacity(0.1),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'الإحصائيات',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 12,
                            runSpacing: 12,
                            children: [
                              _StatChip(
                                label: 'النقاط',
                                value: profile!.points.toString(),
                                icon: Icons.stars,
                              ),
                              _StatChip(
                                label: 'الكاش باك',
                                value:
                                    '${profile!.cashback.toStringAsFixed(2)} EGP',
                                icon: Icons.account_balance_wallet_outlined,
                              ),
                              _StatChip(
                                label: 'العضوية',
                                value: profile!.membershipName,
                                icon: Icons.card_membership,
                              ),
                              _StatChip(
                                label: 'عدد الحجوزات',
                                value: profile!.bookings.length.toString(),
                                icon: Icons.event_available,
                              ),
                              _StatChip(
                                label: 'الحجوزات المكتملة',
                                value: profile!.completedBookings.toString(),
                                icon: Icons.check_circle_outline,
                              ),
                              _StatChip(
                                label: 'إجمالي الإنفاق',
                                value:
                                    '${profile!.totalSpend.toStringAsFixed(0)} EGP',
                                icon: Icons.paid_outlined,
                              ),
                              _StatChip(
                                label: 'تاريخ الانضمام',
                                value: DateFormatter.format(profile!.joinedAt),
                                icon: Icons.calendar_today,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (lastBooking != null)
                      _LastBookingCard(booking: lastBooking),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: GradientButton(
                            label: 'إرسال عرض خاص',
                            icon: Icons.flash_on,
                            onPressed: isSendingOffer ? null : onSendOffer,
                            isBusy: isSendingOffer,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: GradientButton(
                            label: 'إنشاء عرض سعر',
                            icon: Icons.picture_as_pdf,
                            onPressed:
                                isCreatingQuotation ? null : onCreateQuotation,
                            isBusy: isCreatingQuotation,
                            colors: AppColors.successGradient,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            _BookingHistorySection(bookings: profile!.bookings),
            const SizedBox(height: 16),
            _QuotationSection(quotations: quotations),
          ],
        ),
      ),
    );
  }
}

class _BookingHistorySection extends StatelessWidget {
  const _BookingHistorySection({required this.bookings});

  final List<BookingModel> bookings;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(24),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: AppColors.primaryGradient,
                    ),
                  ),
                  child: const Icon(
                    Icons.history,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  'سجل الحجوزات',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.dark,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (bookings.isEmpty)
              const Text('لا توجد حجوزات سابقة لهذا العميل.')
            else
              ...bookings.map(
                (booking) => AnimatedCard(
                  borderRadius: BorderRadius.circular(16),
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: AppColors.primaryGradient,
                        ),
                      ),
                      child: Text(
                        '#${booking.id}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    title: Text(
                      booking.category.name.toUpperCase(),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(
                      '${DateFormatter.format(booking.startDate)} → ${DateFormatter.format(booking.endDate)}',
                    ),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: AppColors.successGradient,
                        ),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        booking.status.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _QuotationSection extends StatelessWidget {
  const _QuotationSection({required this.quotations});

  final List<QuotationSummary> quotations;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(24),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: AppColors.primaryGradient,
                    ),
                  ),
                  child: const Icon(
                    Icons.description_outlined,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  'عروض الأسعار السابقة',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.dark,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (quotations.isEmpty)
              const Text('لا توجد عروض أسعار لهذا العميل حتى الآن.')
            else
              ...quotations.map(
                (quote) => AnimatedCard(
                  borderRadius: BorderRadius.circular(16),
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: AppColors.primaryGradient,
                        ),
                      ),
                      child: Text(
                        '#${quote.id}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    title: Text(
                      'عرض #${quote.id}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(
                      'المجموع: ${quote.total.toStringAsFixed(0)} EGP • الإنشاء: ${DateFormatter.format(quote.createdAt)}',
                    ),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: AppColors.warningGradient,
                        ),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        quote.status.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.bodySmall),
              Text(
                value,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LastBookingCard extends StatelessWidget {
  const _LastBookingCard({required this.booking});

  final BookingModel booking;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Theme.of(context).colorScheme.primaryContainer,
      ),
      child: Row(
        children: [
          const Icon(Icons.new_releases),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'آخر حجز',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  '${booking.category.name.toUpperCase()} • ${booking.status.name}',
                ),
                Text(
                  '${DateFormatter.format(booking.startDate)} → ${DateFormatter.format(booking.endDate)}',
                ),
              ],
            ),
          ),
          Text('${booking.totalPrice.toStringAsFixed(0)} EGP'),
        ],
      ),
    );
  }
}

class _AccessDenied extends StatelessWidget {
  const _AccessDenied();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.lock_outline, size: 48),
          SizedBox(height: 12),
          Text('ليست لديك صلاحية الوصول إلى موديول المبيعات.'),
        ],
      ),
    );
  }
}

class _SendOfferSheet extends StatefulWidget {
  const _SendOfferSheet();

  @override
  State<_SendOfferSheet> createState() => _SendOfferSheetState();
}

class _SendOfferSheetState extends State<_SendOfferSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController(text: 'عرض خاص لك');
  final _messageController = TextEditingController();

  @override
  void dispose() {
    _titleController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SalesProvider>();
    return Padding(
      padding: MediaQuery.of(context).viewInsets.add(
            const EdgeInsets.all(24),
          ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'إرسال عرض خاص',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context, false),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'عنوان العرض'),
              validator: (value) =>
                  value == null || value.isEmpty ? 'أدخل العنوان' : null,
            ),
            TextFormField(
              controller: _messageController,
              decoration: const InputDecoration(labelText: 'نص العرض'),
              maxLines: 4,
              validator: (value) =>
                  value == null || value.isEmpty ? 'أدخل تفاصيل العرض' : null,
            ),
            const SizedBox(height: 16),
            GradientButton(
              label: 'إرسال الآن',
              onPressed:
                  provider.isSendingOffer ? null : () => _submit(provider),
              isBusy: provider.isSendingOffer,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit(SalesProvider provider) async {
    if (!_formKey.currentState!.validate()) return;
    final success = await provider.sendOffer(
      title: _titleController.text,
      message: _messageController.text,
    );
    if (success && mounted) {
      Navigator.pop(context, true);
    } else if (mounted && provider.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.errorMessage!)),
      );
    }
  }
}

class _QuotationSheet extends StatefulWidget {
  const _QuotationSheet();

  @override
  State<_QuotationSheet> createState() => _QuotationSheetState();
}

class _QuotationSheetState extends State<_QuotationSheet> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  final _discountController = TextEditingController();
  DateTime? _validUntil;
  final List<_ItemFormData> _items = [
    _ItemFormData(),
  ];

  @override
  void dispose() {
    _notesController.dispose();
    _discountController.dispose();
    for (final item in _items) {
      item.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SalesProvider>();
    return Padding(
      padding: MediaQuery.of(context).viewInsets.add(
            const EdgeInsets.all(24),
          ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'إنشاء عرض سعر',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context, false),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              ..._items.map((item) => _QuotationItemFields(data: item)),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: () => setState(() => _items.add(_ItemFormData())),
                  icon: const Icon(Icons.add),
                  label: const Text('إضافة بند'),
                ),
              ),
              TextFormField(
                controller: _discountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'خصم (اختياري)',
                ),
              ),
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(labelText: 'ملاحظات'),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      _validUntil == null
                          ? 'بدون تاريخ انتهاء'
                          : 'صالح حتى ${_validUntil!.toLocal().toString().split(' ').first}',
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () async {
                      final now = DateTime.now();
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: now.add(const Duration(days: 7)),
                        firstDate: now,
                        lastDate: now.add(const Duration(days: 90)),
                      );
                      if (picked != null) {
                        setState(() => _validUntil = picked);
                      }
                    },
                    icon: const Icon(Icons.calendar_today),
                    label: const Text('تاريخ الصلاحية'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              GradientButton(
                label: 'إنشاء وإرسال العرض',
                onPressed: provider.isCreatingQuotation
                    ? null
                    : () => _submit(provider),
                isBusy: provider.isCreatingQuotation,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit(SalesProvider provider) async {
    if (!_formKey.currentState!.validate()) return;
    final items = _items
        .map(
          (item) => QuotationItem(
            name: item.nameController.text,
            quantity: int.tryParse(item.quantityController.text) ?? 1,
            price: double.tryParse(item.priceController.text) ?? 0,
          ),
        )
        .where((item) => item.name.isNotEmpty)
        .toList();
    if (items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('أضف بنداً واحداً على الأقل')),
      );
      return;
    }
    final discount = double.tryParse(_discountController.text);
    final success = await provider.createQuotation(
      items: items,
      notes: _notesController.text,
      discount: discount,
      validUntil: _validUntil,
    );
    if (success && mounted) {
      Navigator.pop(context, true);
    } else if (mounted && provider.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.errorMessage!)),
      );
    }
  }
}

class _QuotationItemFields extends StatelessWidget {
  const _QuotationItemFields({required this.data});

  final _ItemFormData data;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            TextFormField(
              controller: data.nameController,
              decoration: const InputDecoration(labelText: 'اسم البند'),
              validator: (value) =>
                  value == null || value.isEmpty ? 'أدخل اسم البند' : null,
            ),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: data.quantityController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                        labelText: 'الكمية', hintText: '1'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: data.priceController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'السعر للوحدة',
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ItemFormData {
  _ItemFormData()
      : nameController = TextEditingController(),
        quantityController = TextEditingController(text: '1'),
        priceController = TextEditingController();

  final TextEditingController nameController;
  final TextEditingController quantityController;
  final TextEditingController priceController;

  void dispose() {
    nameController.dispose();
    quantityController.dispose();
    priceController.dispose();
  }
}
