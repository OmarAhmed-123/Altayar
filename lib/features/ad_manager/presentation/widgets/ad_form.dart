import 'dart:io';

import 'package:flutter/material.dart';

class AdFormPayload {
  AdFormPayload({
    required this.title,
    required this.description,
    required this.isActive,
    this.linkUrl,
    this.startDate,
    this.endDate,
  });

  final String title;
  final String description;
  final bool isActive;
  final String? linkUrl;
  final DateTime? startDate;
  final DateTime? endDate;
}

class AdForm extends StatefulWidget {
  const AdForm({
    super.key,
    required this.onSubmit,
    required this.onPickImage,
    required this.isSaving,
    this.selectedImage,
  });

  final Future<void> Function(AdFormPayload payload) onSubmit;
  final VoidCallback onPickImage;
  final bool isSaving;
  final File? selectedImage;

  @override
  State<AdForm> createState() => _AdFormState();
}

class _AdFormState extends State<AdForm> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _linkController = TextEditingController();
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isActive = true;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _linkController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'عنوان الإعلان'),
              validator: (value) =>
                  value == null || value.isEmpty ? 'أدخل العنوان' : null,
            ),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(labelText: 'الوصف'),
              maxLines: 4,
              validator: (value) =>
                  value == null || value.isEmpty ? 'أدخل الوصف' : null,
            ),
            TextFormField(
              controller: _linkController,
              decoration: const InputDecoration(
                labelText: 'رابط Call To Action (اختياري)',
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _startDate == null
                            ? 'بدون تاريخ بداية'
                            : 'تبدأ ${_startDate!.toString().split(' ').first}',
                      ),
                      TextButton(
                        onPressed: () => _pickDate(isStart: true),
                        child: const Text('اختيار تاريخ البداية'),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _endDate == null
                            ? 'بدون تاريخ نهاية'
                            : 'تنتهي ${_endDate!.toString().split(' ').first}',
                      ),
                      TextButton(
                        onPressed: () => _pickDate(isStart: false),
                        child: const Text('اختيار تاريخ النهاية'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SwitchListTile(
              title: const Text('تفعيل الإعلان مباشرة'),
              value: _isActive,
              onChanged: (value) => setState(() => _isActive = value),
            ),
            ListTile(
              title: Text(
                widget.selectedImage == null
                    ? 'لم يتم اختيار صورة'
                    : widget.selectedImage!.path.split('/').last,
              ),
              trailing: IconButton(
                icon: const Icon(Icons.image),
                onPressed: widget.onPickImage,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: widget.isSaving ? null : _handleSubmit,
                icon: widget.isSaving
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.save),
                label: const Text('حفظ الإعلان'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickDate({required bool isStart}) async {
    final now = DateTime.now();
    final selected = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (selected != null) {
      setState(() {
        if (isStart) {
          _startDate = selected;
        } else {
          _endDate = selected;
        }
      });
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    final payload = AdFormPayload(
      title: _titleController.text,
      description: _descriptionController.text,
      linkUrl: _linkController.text.isEmpty ? null : _linkController.text,
      startDate: _startDate,
      endDate: _endDate,
      isActive: _isActive,
    );
    await widget.onSubmit(payload);
  }
}
