import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class FawaterakCheckoutPage extends StatefulWidget {
  const FawaterakCheckoutPage({super.key, required this.paymentUrl});

  final String paymentUrl;

  static Future<bool> open(BuildContext context, String paymentUrl) async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => FawaterakCheckoutPage(paymentUrl: paymentUrl),
      ),
    );
    return result ?? false;
  }

  @override
  State<FawaterakCheckoutPage> createState() => _FawaterakCheckoutPageState();
}

class _FawaterakCheckoutPageState extends State<FawaterakCheckoutPage> {
  late final WebViewController _controller;
  double _progress = 0;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() {
            _progress = 0;
          }),
          onProgress: (value) => setState(() {
            _progress = value / 100;
          }),
          onPageFinished: (_) => setState(() {
            _progress = 1;
          }),
        ),
      )
      ..loadRequest(Uri.parse(widget.paymentUrl));
  }

  void _close(bool shouldVerify) {
    Navigator.of(context).maybePop(shouldVerify);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('بوابة دفع Fawaterak'),
        leading: IconButton(
          onPressed: () => _close(false),
          icon: const Icon(Icons.close),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: _progress >= 1
              ? const SizedBox(height: 4)
              : LinearProgressIndicator(value: _progress),
        ),
      ),
      body: Column(
        children: [
          Expanded(child: WebViewWidget(controller: _controller)),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'بعد إتمام الدفع وظهور رسالة النجاح في صفحة Fawaterak اضغط على الزر بالأسفل '
                    'ليتم التأكد من العملية وتحديث بياناتك.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: () => _close(true),
                    icon: const Icon(Icons.verified_outlined),
                    label: const Text('تم الدفع، التحقق الآن'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
