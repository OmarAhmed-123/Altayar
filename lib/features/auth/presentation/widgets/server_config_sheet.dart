import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/config/app_config.dart';
import 'package:altayar/core/networking/server_config_provider.dart';

class ServerConfigSheet extends StatefulWidget {
  const ServerConfigSheet({super.key});

  @override
  State<ServerConfigSheet> createState() => _ServerConfigSheetState();
}

class _ServerConfigSheetState extends State<ServerConfigSheet> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    final baseUrl = context.read<ServerConfigProvider>().baseUrl;
    _controller = TextEditingController(text: baseUrl);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Consumer<ServerConfigProvider>(
            builder: (_, config, __) {
              final suggestions = config.suggestions;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Text(
                        'إعدادات الاتصال بالخادم',
                        style: theme.textTheme.titleLarge,
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'الخادم الحالي: ${_formatBase(config.baseUrl)}',
                    style: theme.textTheme.bodySmall,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      labelText: 'رابط واجهة البرمجة (API)',
                      helperText:
                          'أدخل العنوان كما يظهر في سجل الخادم مثل http://192.168.1.4:5000/api',
                      prefixIcon: Icon(Icons.link),
                    ),
                    keyboardType: TextInputType.url,
                  ),
                  if (suggestions.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text('اقتراحات سريعة', style: theme.textTheme.bodySmall),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: suggestions
                          .map(
                            (item) => ActionChip(
                              label: Text(_formatBase(item)),
                              onPressed: () => _controller.text = item,
                            ),
                          )
                          .toList(),
                    ),
                  ],
                  if (config.errorMessage != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      config.errorMessage!,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.error,
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      OutlinedButton.icon(
                        onPressed: config.isTesting
                            ? null
                            : () =>
                                _controller.text = AppConfig.resolvedBaseUrl(),
                        icon: const Icon(Icons.restart_alt),
                        label: const Text('العودة للوضع الافتراضي'),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed:
                            config.isTesting ? null : () => _autoDetect(config),
                        icon: const Icon(Icons.travel_explore),
                        label: const Text('بحث تلقائي'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed:
                        config.isTesting ? null : () => _applyConfig(config),
                    icon: config.isTesting
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.wifi_tethering),
                    label: const Text('اختبار وحفظ'),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Future<void> _applyConfig(ServerConfigProvider provider) async {
    final success = await provider.updateBaseUrl(_controller.text);
    if (!mounted) return;
    if (success) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('تم تحديث الخادم إلى ${_formatBase(provider.baseUrl)}'),
        ),
      );
    }
  }

  Future<void> _autoDetect(ServerConfigProvider provider) async {
    final success = await provider.autoDetect();
    if (!mounted) return;
    if (success) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'تم العثور على الخادم ${_formatBase(provider.baseUrl)}',
          ),
        ),
      );
    }
  }

  String _formatBase(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return url;
    final buffer = StringBuffer()
      ..write(uri.scheme)
      ..write('://')
      ..write(uri.host);
    if (uri.hasPort) {
      buffer.write(':${uri.port}');
    }
    return buffer.toString();
  }
}
