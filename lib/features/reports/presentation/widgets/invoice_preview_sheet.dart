import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';

import 'package:altayar/features/reports/data/models/invoice_data.dart';
import 'package:altayar/features/reports/presentation/utils/invoice_pdf_builder.dart';

class InvoicePreviewSheet extends StatelessWidget {
  const InvoicePreviewSheet({super.key, required this.invoice});

  final InvoiceData invoice;

  @override
  Widget build(BuildContext context) {
    final builder = InvoicePdfBuilder(invoice);
    final theme = Theme.of(context);
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SizedBox(
          height: MediaQuery.of(context).size.height * 0.9,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 12),
              Center(
                child: Container(
                  width: 48,
                  height: 4,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.outlineVariant,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              ListTile(
                title: Text(
                  'معاينة الفاتورة',
                  style: theme.textTheme.titleLarge,
                ),
                subtitle: Text('فاتورة #${invoice.invoiceNumber}'),
                trailing: IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: PdfPreview(
                  allowPrinting: false,
                  allowSharing: false,
                  canDebug: false,
                  canChangePageFormat: false,
                  useActions: false,
                  build: (format) => builder.build(format),
                ),
              ),
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () async {
                          try {
                            final bytes = await builder.build(PdfPageFormat.a4);
                            await Printing.layoutPdf(
                              onLayout: (format) async => bytes,
                            );
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('خطأ في معاينة PDF: $e'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                            }
                          }
                        },
                        icon: const Icon(Icons.print),
                        label: const Text('طباعة'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () async {
                          try {
                            final bytes = await builder.build(PdfPageFormat.a4);
                            await Printing.sharePdf(
                              bytes: bytes,
                              filename: 'invoice_${invoice.invoiceNumber}.pdf',
                            );
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('تم حفظ ملف PDF بنجاح'),
                                  backgroundColor: Colors.green,
                                ),
                              );
                            }
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('خطأ في تحميل PDF: $e'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                            }
                          }
                        },
                        icon: const Icon(Icons.download),
                        label: const Text('تحميل PDF'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
