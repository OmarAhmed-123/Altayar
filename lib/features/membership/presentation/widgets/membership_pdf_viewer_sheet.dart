import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher_string.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/features/membership/data/models/membership_plan.dart';

class MembershipPdfViewerSheet extends StatefulWidget {
  const MembershipPdfViewerSheet({
    super.key,
    required this.plan,
    required this.onSubscribe,
  });

  final MembershipPlan plan;
  final VoidCallback onSubscribe;

  @override
  State<MembershipPdfViewerSheet> createState() =>
      _MembershipPdfViewerSheetState();
}

class _MembershipPdfViewerSheetState extends State<MembershipPdfViewerSheet> {
  bool _isLoading = true;
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    final pdfUrl = widget.plan.pdfViewUrl ?? widget.plan.pdfUrl;
    if (pdfUrl != null) {
      _controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setNavigationDelegate(
          NavigationDelegate(
            onPageStarted: (_) {
              if (mounted) {
                setState(() => _isLoading = true);
              }
            },
            onPageFinished: (_) {
              if (mounted) {
                setState(() => _isLoading = false);
              }
            },
          ),
        )
        ..loadRequest(Uri.parse(pdfUrl));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final pdfUrl = widget.plan.pdfViewUrl ?? widget.plan.pdfUrl;

    return DraggableScrollableSheet(
      initialChildSize: 0.95,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: AppColors.primaryGradient,
                ),
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(24),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.picture_as_pdf,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'مراجعة ملف PDF',
                          style: theme.textTheme.titleLarge?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          widget.plan.name,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, color: Colors.white),
                  ),
                ],
              ),
            ),
            // PDF Viewer
            Expanded(
              child: pdfUrl == null
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.picture_as_pdf_outlined,
                            size: 64,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'ملف PDF غير متاح',
                            style: theme.textTheme.titleMedium?.copyWith(
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    )
                  : Stack(
                      children: [
                        WebViewWidget(controller: _controller),
                        if (_isLoading)
                          Container(
                            color: Colors.white,
                            child: const Center(
                              child: CircularProgressIndicator(),
                            ),
                          ),
                      ],
                    ),
            ),
            // Footer with Subscribe Button
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GradientButton(
                    label: 'الاشتراك الآن عبر Fawaterak',
                    icon: Icons.payment,
                    onPressed: () {
                      Navigator.pop(context);
                      widget.onSubscribe();
                    },
                  ),
                  const SizedBox(height: 12),
                  TextButton.icon(
                    onPressed: () {
                      final downloadUrl =
                          widget.plan.pdfDownloadUrl ?? widget.plan.pdfUrl;
                      if (downloadUrl != null) {
                        launchUrlString(
                          downloadUrl,
                          mode: LaunchMode.externalApplication,
                        );
                      }
                    },
                    icon: const Icon(Icons.download),
                    label: const Text('تحميل PDF'),
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
