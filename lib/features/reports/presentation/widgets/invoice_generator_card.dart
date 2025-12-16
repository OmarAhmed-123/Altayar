import 'package:flutter/material.dart';

import 'package:altayar/core/widgets/glass_card.dart';
import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/core/theme/app_colors.dart';

typedef InvoiceRequest = Future<void> Function(int bookingId);
typedef ReportDownload = Future<void> Function();

class InvoiceGeneratorCard extends StatefulWidget {
  const InvoiceGeneratorCard({
    super.key,
    required this.onGenerateInvoice,
    required this.onDownloadCompanyReport,
    required this.isGenerating,
  });

  final InvoiceRequest onGenerateInvoice;
  final ReportDownload onDownloadCompanyReport;
  final bool isGenerating;

  @override
  State<InvoiceGeneratorCard> createState() => _InvoiceGeneratorCardState();
}

class _InvoiceGeneratorCardState extends State<InvoiceGeneratorCard> {
  final _controller = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GlassCard(
            borderRadius: BorderRadius.circular(24),
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
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
                          Icons.picture_as_pdf,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'إنشاء فاتورة PDF',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppColors.dark,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _controller,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'رقم الحجز',
                      prefixIcon: Icon(Icons.confirmation_number),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'أدخل رقم الحجز';
                      }
                      if (int.tryParse(value) == null) {
                        return 'رقم غير صالح';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  GradientButton(
                    label: 'توليد الفاتورة',
                    icon: Icons.picture_as_pdf,
                    onPressed: widget.isGenerating ? null : _submit,
                    isBusy: widget.isGenerating,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          GlassCard(
            borderRadius: BorderRadius.circular(24),
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: AppColors.successGradient,
                    ),
                  ),
                  child: const Icon(
                    Icons.description,
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
                        'تحميل تقرير مالي شامل',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.dark,
                                ),
                      ),
                      Text(
                        'يشمل ملخص المدفوعات والحركات المالية.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey[700],
                            ),
                      ),
                    ],
                  ),
                ),
                GradientButton(
                  label: 'تحميل',
                  icon: Icons.download,
                  onPressed: widget.isGenerating
                      ? null
                      : widget.onDownloadCompanyReport,
                  isBusy: widget.isGenerating,
                  colors: AppColors.successGradient,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final bookingId = int.parse(_controller.text);
    await widget.onGenerateInvoice(bookingId);
  }
}
