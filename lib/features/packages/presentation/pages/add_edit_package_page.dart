import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';

import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/packages/data/models/travel_package.dart';

class AddEditPackagePage extends StatefulWidget {
  const AddEditPackagePage({
    super.key,
    this.package,
    required this.onSave,
  });

  final TravelPackage? package;
  final Future<void> Function(Map<String, dynamic> data) onSave;

  @override
  State<AddEditPackagePage> createState() => _AddEditPackagePageState();
}

class _AddEditPackagePageState extends State<AddEditPackagePage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _durationDaysController = TextEditingController();
  final _durationNightsController = TextEditingController();
  final _remainingSeatsController = TextEditingController();
  final _destinationController = TextEditingController();
  final _categoryController = TextEditingController();

  List<File> _selectedImages = [];
  bool _isLoading = false;
  bool _isExclusive = false;

  @override
  void initState() {
    super.initState();
    if (widget.package != null) {
      _titleController.text = widget.package!.title;
      _descriptionController.text = widget.package!.description;
      _priceController.text = widget.package!.price.toString();
      _durationDaysController.text = widget.package!.durationDays.toString();
      _durationNightsController.text = widget.package!.durationNights.toString();
      _remainingSeatsController.text = widget.package!.remainingSeats.toString();
      _destinationController.text = widget.package!.destination ?? '';
      _categoryController.text = widget.package!.category ?? '';
      _isExclusive = widget.package!.isExclusive;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _durationDaysController.dispose();
    _durationNightsController.dispose();
    _remainingSeatsController.dispose();
    _destinationController.dispose();
    _categoryController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final pickedFiles = await picker.pickMultiImage();
    if (pickedFiles.isNotEmpty) {
      setState(() {
        _selectedImages = pickedFiles.map((file) => File(file.path)).toList();
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final data = <String, dynamic>{
        'title': _titleController.text.trim(),
        'name': _titleController.text.trim(), // Backend might use 'name'
        'description': _descriptionController.text.trim(),
        'price': double.parse(_priceController.text),
        'days': int.parse(_durationDaysController.text),
        'durationDays': int.parse(_durationDaysController.text),
        'nights': int.parse(_durationNightsController.text),
        'durationNights': int.parse(_durationNightsController.text),
        'seats': int.parse(_remainingSeatsController.text),
        'remainingSeats': int.parse(_remainingSeatsController.text),
        'isExclusive': _isExclusive,
        if (_destinationController.text.isNotEmpty)
          'destination': _destinationController.text.trim(),
        if (_categoryController.text.isNotEmpty)
          'category': _categoryController.text.trim(),
      };

      // Handle image upload if new images are selected
      if (_selectedImages.isNotEmpty) {
        final apiClient = context.read<ApiClient>();
        final baseUrl = apiClient.baseUrl.replaceAll('/api', '');
        final uploadUrl = '$baseUrl/api/packages${widget.package != null ? '/${widget.package!.id}' : ''}';

        final request = http.MultipartRequest(
          widget.package != null ? 'PUT' : 'POST',
          Uri.parse(uploadUrl),
        );

        // Add auth token
        final token = apiClient.authToken;
        if (token != null) {
          request.headers['Authorization'] = 'Bearer $token';
        }

        // Add form fields
        request.fields.addAll(data.map((key, value) => MapEntry(key, value.toString())));

        // Add image files
        for (final imageFile in _selectedImages) {
          final file = await http.MultipartFile.fromPath(
            'images',
            imageFile.path,
          );
          request.files.add(file);
        }

        final streamedResponse = await request.send();
        final response = await http.Response.fromStream(streamedResponse);

        if (response.statusCode >= 200 && response.statusCode < 300) {
          await widget.onSave(data);
        } else {
          throw Exception('فشل رفع الصور: ${response.statusCode}');
        }
      } else {
        await widget.onSave(data);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('خطأ: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.package != null ? 'تعديل الباقة' : 'إضافة باقة جديدة'),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Image picker
              GestureDetector(
                onTap: _pickImages,
                child: Container(
                  height: 200,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: _selectedImages.isNotEmpty
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: PageView.builder(
                            itemCount: _selectedImages.length,
                            itemBuilder: (context, index) => Image.file(
                              _selectedImages[index],
                              fit: BoxFit.cover,
                            ),
                          ),
                        )
                      : widget.package?.images.isNotEmpty == true
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: PageView.builder(
                                itemCount: widget.package!.images.length,
                                itemBuilder: (context, index) => Image.network(
                                  widget.package!.images[index],
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => const Icon(
                                    Icons.image,
                                    size: 64,
                                  ),
                                ),
                              ),
                            )
                          : const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.add_photo_alternate, size: 64),
                                SizedBox(height: 8),
                                Text('اضغط لإضافة صور'),
                              ],
                            ),
                ),
              ),
              const SizedBox(height: 16),

              // Title
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'عنوان الباقة',
                  border: OutlineInputBorder(),
                ),
                validator: (value) =>
                    value?.isEmpty ?? true ? 'يرجى إدخال عنوان الباقة' : null,
              ),
              const SizedBox(height: 16),

              // Description
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'الوصف',
                  border: OutlineInputBorder(),
                ),
                maxLines: 4,
                validator: (value) =>
                    value?.isEmpty ?? true ? 'يرجى إدخال الوصف' : null,
              ),
              const SizedBox(height: 16),

              // Price
              TextFormField(
                controller: _priceController,
                decoration: const InputDecoration(
                  labelText: 'السعر (EGP)',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'يرجى إدخال السعر';
                  }
                  if (double.tryParse(value!) == null) {
                    return 'يرجى إدخال رقم صحيح';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Duration Days
              TextFormField(
                controller: _durationDaysController,
                decoration: const InputDecoration(
                  labelText: 'عدد الأيام',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'يرجى إدخال عدد الأيام';
                  }
                  if (int.tryParse(value!) == null) {
                    return 'يرجى إدخال رقم صحيح';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Duration Nights
              TextFormField(
                controller: _durationNightsController,
                decoration: const InputDecoration(
                  labelText: 'عدد الليالي',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'يرجى إدخال عدد الليالي';
                  }
                  if (int.tryParse(value!) == null) {
                    return 'يرجى إدخال رقم صحيح';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Remaining Seats
              TextFormField(
                controller: _remainingSeatsController,
                decoration: const InputDecoration(
                  labelText: 'المقاعد المتاحة',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'يرجى إدخال عدد المقاعد';
                  }
                  if (int.tryParse(value!) == null) {
                    return 'يرجى إدخال رقم صحيح';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Destination
              TextFormField(
                controller: _destinationController,
                decoration: const InputDecoration(
                  labelText: 'الوجهة (اختياري)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),

              // Category
              TextFormField(
                controller: _categoryController,
                decoration: const InputDecoration(
                  labelText: 'الفئة (اختياري)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),

              // Is Exclusive
              SwitchListTile(
                title: const Text('باقة حصرية'),
                value: _isExclusive,
                onChanged: (value) => setState(() => _isExclusive = value),
              ),
              const SizedBox(height: 24),

              // Save Button
              FilledButton(
                onPressed: _isLoading ? null : _save,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(widget.package != null ? 'حفظ التعديلات' : 'إضافة الباقة'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

