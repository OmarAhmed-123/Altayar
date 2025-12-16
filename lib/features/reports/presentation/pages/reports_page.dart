import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher_string.dart';

import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/reports/data/models/invoice_data.dart';
import 'package:altayar/features/reports/presentation/providers/reports_provider.dart';
import 'package:altayar/features/reports/presentation/widgets/invoice_generator_card.dart';
import 'package:altayar/features/reports/presentation/widgets/invoice_preview_sheet.dart';
import 'package:altayar/features/reports/presentation/widgets/payment_history_table.dart';
import 'package:altayar/features/reports/presentation/pages/revenue_analytics_page.dart';

class ReportsPage extends StatefulWidget {
  const ReportsPage({super.key, this.showAnalytics = false});

  final bool showAnalytics;

  @override
  State<ReportsPage> createState() => _ReportsPageState();
}

class _ReportsPageState extends State<ReportsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReportsProvider>().loadHistory();
      if (widget.showAnalytics) {
        _tabController.animateTo(0);
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final provider = context.watch<ReportsProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final authorized = _isAuthorized(auth.currentUser?.role ?? '');
    if (!authorized) {
      return const Scaffold(
        body: Center(child: Text('هذه الصفحة متاحة فقط للمراجعة المالية.')),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('مركز التقارير'),
        actions: [
          IconButton(
            icon: const Icon(Icons.analytics),
            tooltip: 'تحليل الإيرادات الشامل',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const RevenueAnalyticsPage(),
                ),
              );
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'التاريخ المالي'),
            Tab(text: 'الفواتير'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          PaymentHistoryTable(provider: provider),
          InvoiceGeneratorCard(
            isGenerating: provider.isGenerating,
            onGenerateInvoice: (bookingId) async {
              final invoice = await provider.generateInvoice(bookingId);
              if (!context.mounted) return;
              if (invoice != null) {
                await _showInvoicePreview(context, invoice);
                if (!context.mounted) return;
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text(
                      'تم إنشاء الفاتورة بنجاح. استخدم زر التحميل داخل المعاينة لحفظ ملف PDF.',
                    ),
                    duration: Duration(seconds: 4),
                  ),
                );
              } else if (provider.errorMessage != null) {
                messenger.showSnackBar(
                  SnackBar(content: Text(provider.errorMessage!)),
                );
              }
            },
            onDownloadCompanyReport: () async {
              final url = await provider.downloadCompanyReport();
              if (!context.mounted) return;
              if (url != null) {
                await launchUrlString(url);
              } else if (provider.errorMessage != null) {
                messenger.showSnackBar(
                  SnackBar(content: Text(provider.errorMessage!)),
                );
              }
            },
          ),
        ],
      ),
    );
  }

  bool _isAuthorized(String role) {
    final normalized = role.toLowerCase();
    return normalized.contains('super_admin') ||
        normalized.contains('admin') ||
        normalized.contains('accountant');
  }

  Future<void> _showInvoicePreview(
    BuildContext context,
    InvoiceData invoice,
  ) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => InvoicePreviewSheet(invoice: invoice),
    );
  }
}
