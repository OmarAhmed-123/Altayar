import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import 'package:altayar/features/booking/data/models/booking.dart';
import 'package:altayar/features/booking/presentation/providers/booking_provider.dart';

class BookingCreationSheet extends StatefulWidget {
  const BookingCreationSheet({super.key});

  @override
  State<BookingCreationSheet> createState() => _BookingCreationSheetState();
}

class _BookingCreationSheetState extends State<BookingCreationSheet> {
  final _formKey = GlobalKey<FormState>();
  BookingCategory _category = BookingCategory.customRequest;
  final _customerName = TextEditingController();
  final _customerEmail = TextEditingController();
  final _special = TextEditingController();
  final _price = TextEditingController();
  final _participants = TextEditingController(text: '1');
  DateTime? _startDate;
  DateTime? _endDate;
  final List<XFile> _images = [];
  final _picker = ImagePicker();

  @override
  void dispose() {
    _customerName.dispose();
    _customerEmail.dispose();
    _special.dispose();
    _price.dispose();
    _participants.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<BookingProvider>();
    return Padding(
      padding: MediaQuery.of(context).viewInsets.add(const EdgeInsets.all(24)),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'طلب حجز مخصص',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<BookingCategory>(
              initialValue: _category,
              decoration: const InputDecoration(labelText: 'الفئة'),
              items: BookingCategory.values
                  .map(
                    (value) => DropdownMenuItem(
                      value: value,
                      child: Text(value.name),
                    ),
                  )
                  .toList(),
              onChanged: (value) => setState(() {
                if (value != null) _category = value;
              }),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _customerName,
              decoration: const InputDecoration(labelText: 'اسم العميل'),
              validator: (value) =>
                  value == null || value.isEmpty ? 'مطلوب' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _customerEmail,
              decoration: const InputDecoration(labelText: 'بريد العميل'),
              validator: (value) =>
                  value == null || value.isEmpty ? 'مطلوب' : null,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextButton.icon(
                    onPressed: () async {
                      final selected = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime.now().subtract(
                          const Duration(days: 365),
                        ),
                        lastDate: DateTime.now().add(
                          const Duration(days: 365),
                        ),
                      );
                      if (selected != null) {
                        setState(() => _startDate = selected);
                      }
                    },
                    icon: const Icon(Icons.calendar_today),
                    label: Text(
                      _startDate == null
                          ? 'تاريخ البدء'
                          : _startDate!.toLocal().toString().split(' ').first,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextButton.icon(
                    onPressed: () async {
                      final selected = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime.now().subtract(
                          const Duration(days: 365),
                        ),
                        lastDate: DateTime.now().add(
                          const Duration(days: 365),
                        ),
                      );
                      if (selected != null) {
                        setState(() => _endDate = selected);
                      }
                    },
                    icon: const Icon(Icons.calendar_month),
                    label: Text(
                      _endDate == null
                          ? 'تاريخ الانتهاء'
                          : _endDate!.toLocal().toString().split(' ').first,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _participants,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'عدد المشاركين'),
              validator: (value) => value == null || int.tryParse(value) == null
                  ? 'أدخل رقمًا صحيحًا'
                  : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _price,
              decoration: const InputDecoration(labelText: 'السعر التقديري'),
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
            ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerLeft,
              child: FilledButton.tonalIcon(
                onPressed: () async {
                  final pics = await _picker.pickMultiImage(imageQuality: 70);
                  setState(() {
                    _images
                      ..clear()
                      ..addAll(pics);
                  });
                },
                icon: const Icon(Icons.attach_file),
                label: const Text('إرفاق صور'),
              ),
            ),
            const SizedBox(height: 8),
            if (_images.isNotEmpty)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _images
                    .map(
                      (img) => Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.file(
                              File(img.path),
                              width: 70,
                              height: 70,
                              fit: BoxFit.cover,
                            ),
                          ),
                          Positioned(
                            top: -4,
                            right: -4,
                            child: IconButton(
                              icon: const Icon(Icons.close, size: 16),
                              color: Colors.red,
                              onPressed: () {
                                setState(() => _images.remove(img));
                              },
                            ),
                          ),
                        ],
                      ),
                    )
                    .toList(),
              ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _special,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'تفاصيل إضافية',
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: provider.isCreating
                  ? null
                  : () async {
                      if (!_formKey.currentState!.validate()) return;
                      final success =
                          await provider.createBooking(<String, dynamic>{
                        'bookingType': _category.name,
                        'customer_name': _customerName.text,
                        'customer_email': _customerEmail.text,
                        'specialRequests': _special.text,
                        'totalPrice': double.tryParse(_price.text) ?? 0.0,
                        'participants': int.tryParse(_participants.text) ?? 1,
                        if (_startDate != null)
                          'startDate': _startDate!.toIso8601String(),
                        if (_endDate != null)
                          'endDate': _endDate!.toIso8601String(),
                        if (_images.isNotEmpty)
                          'images': _images.map((img) => img.path).toList(),
                      });
                      if (!context.mounted) return;
                      if (success) Navigator.of(context).pop();
                    },
              icon: provider.isCreating
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.check_circle),
              label: const Text('حفظ الحجز'),
            ),
          ],
        ),
      ),
    );
  }
}
