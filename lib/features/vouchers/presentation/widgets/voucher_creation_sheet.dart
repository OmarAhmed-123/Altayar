import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/features/vouchers/presentation/providers/voucher_provider.dart';

class VoucherCreationSheet extends StatefulWidget {
  const VoucherCreationSheet({super.key});

  @override
  State<VoucherCreationSheet> createState() => _VoucherCreationSheetState();
}

class _VoucherCreationSheetState extends State<VoucherCreationSheet> {
  final _formKey = GlobalKey<FormState>();
  final _userIdController = TextEditingController();
  final _valueController = TextEditingController();
  final _descriptionController = TextEditingController();
  DateTime? _expiryDate;
  String _type = 'عشاء';

  final _types = const [
    'عشاء',
    'إفطار',
    'SPA',
    'جيم',
    'عناية بالأسنان',
    'ميكب',
    'نقل VIP',
  ];

  @override
  void dispose() {
    _userIdController.dispose();
    _valueController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<VoucherProvider>();
    return Padding(
      padding: MediaQuery.of(context).viewInsets.add(
            const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'منح قسيمة هدية',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _type,
              decoration: const InputDecoration(labelText: 'نوع القسيمة'),
              items: _types
                  .map(
                    (type) => DropdownMenuItem(
                      value: type,
                      child: Text(type),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                if (value != null) setState(() => _type = value);
              },
            ),
            TextFormField(
              controller: _userIdController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'معرّف العميل'),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'الرجاء إدخال معرّف العميل';
                }
                return null;
              },
            ),
            TextFormField(
              controller: _valueController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'القيمة (اختياري)'),
            ),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(labelText: 'الوصف'),
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Text(
                    _expiryDate == null
                        ? 'بدون تاريخ انتهاء'
                        : 'صالح حتى ${_expiryDate!.toLocal().toString().split(' ').first}',
                  ),
                ),
                TextButton.icon(
                  onPressed: _pickDate,
                  icon: const Icon(Icons.calendar_month),
                  label: const Text('اختيار تاريخ'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: provider.isCreating ? null : () => _submit(provider),
                child: provider.isCreating
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('إرسال القسيمة'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickDate() async {
    final selected = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (selected != null) {
      setState(() {
        _expiryDate = selected;
      });
    }
  }

  Future<void> _submit(VoucherProvider provider) async {
    if (!_formKey.currentState!.validate()) return;
    final userId = int.tryParse(_userIdController.text);
    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('معرّف العميل غير صالح')),
      );
      return;
    }
    final value = double.tryParse(_valueController.text);
    final voucher = await provider.createManualVoucher(
      userId: userId,
      type: _type,
      value: value,
      description: _descriptionController.text,
      expiresAt: _expiryDate,
    );
    if (voucher != null && mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تم منح القسيمة #${voucher.code} بنجاح')),
      );
    }
  }
}
