import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/features/user_management/data/models/manual_gift_payload.dart';
import 'package:altayar/features/user_management/presentation/providers/user_management_provider.dart';

class ManualGiftForm extends StatefulWidget {
  const ManualGiftForm({super.key, required this.userId});

  final int userId;

  @override
  State<ManualGiftForm> createState() => _ManualGiftFormState();
}

class _ManualGiftFormState extends State<ManualGiftForm> {
  final _formKey = GlobalKey<FormState>();
  final _pointsController = TextEditingController();
  final _cashbackController = TextEditingController();
  final _voucherController = TextEditingController();
  final _descriptionController = TextEditingController();

  @override
  void dispose() {
    _pointsController.dispose();
    _cashbackController.dispose();
    _voucherController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<UserManagementProvider>();

    return Padding(
      padding: MediaQuery.of(context).viewInsets.add(const EdgeInsets.all(24)),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'إضافة هدية يدوية',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _pointsController,
              decoration: const InputDecoration(
                labelText: 'النقاط الإضافية',
                prefixIcon: Icon(Icons.stars_outlined),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _cashbackController,
              decoration: const InputDecoration(
                labelText: 'الكاش باك',
                prefixIcon: Icon(Icons.attach_money),
              ),
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _voucherController,
              decoration: const InputDecoration(
                labelText: 'نوع الفوتشر',
                prefixIcon: Icon(Icons.card_giftcard),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'ملاحظات/سبب الهدية',
              ),
              maxLines: 2,
              validator: (value) {
                if ((value == null || value.isEmpty) &&
                    _pointsController.text.isEmpty &&
                    _cashbackController.text.isEmpty &&
                    _voucherController.text.isEmpty) {
                  return 'أدخل نوع هدية أو وصفاً لها';
                }
                return null;
              },
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: provider.isSendingGift
                  ? null
                  : () async {
                      if (!_formKey.currentState!.validate()) return;
                      final payload = ManualGiftPayload(
                        points: _pointsController.text.isNotEmpty
                            ? int.tryParse(_pointsController.text)
                            : null,
                        cashback: _cashbackController.text.isNotEmpty
                            ? double.tryParse(_cashbackController.text)
                            : null,
                        voucherType: _voucherController.text.isEmpty
                            ? null
                            : _voucherController.text,
                        description: _descriptionController.text,
                      );
                      final success = await context
                          .read<UserManagementProvider>()
                          .sendManualGift(
                              userId: widget.userId, payload: payload);
                      if (!mounted) return;
                      if (success) Navigator.of(context).pop();
                    },
              icon: provider.isSendingGift
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send),
              label: const Text('إرسال الهدية'),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}
