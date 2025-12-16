import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';

import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/features/membership/data/models/membership_plan.dart';

class AddEditMembershipPage extends StatefulWidget {
  const AddEditMembershipPage({
    super.key,
    this.plan,
    required this.onSave,
  });

  final MembershipPlan? plan;
  final Future<void> Function(Map<String, dynamic> data) onSave;

  @override
  State<AddEditMembershipPage> createState() => _AddEditMembershipPageState();
}

class _AddEditMembershipPageState extends State<AddEditMembershipPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _tierController = TextEditingController();
  final _priceController = TextEditingController();
  final _pointsController = TextEditingController();
  final _pointMultiplierController = TextEditingController();
  final _cashbackRateController = TextEditingController();
  final _welcomePointsController = TextEditingController();
  final _welcomeCashbackController = TextEditingController();
  final _durationDaysController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _benefitsController = TextEditingController();

  File? _selectedImage;
  bool _isLoading = false;
  bool _isActive = true;

  @override
  void initState() {
    super.initState();
    if (widget.plan != null) {
      _nameController.text = widget.plan!.name;
      _tierController.text = widget.plan!.tier;
      _priceController.text = widget.plan!.price.toString();
      _pointsController.text = widget.plan!.points.toString();
      _pointMultiplierController.text = widget.plan!.pointMultiplier.toString();
      _cashbackRateController.text = widget.plan!.cashbackRate.toString();
      _welcomePointsController.text = widget.plan!.welcomePoints.toString();
      _welcomeCashbackController.text = widget.plan!.welcomeCashback.toString();
      _durationDaysController.text = widget.plan!.durationDays.toString();
      _descriptionController.text = widget.plan!.description ?? '';
      _benefitsController.text = widget.plan!.benefits.join('\n');
      _isActive = widget.plan!.isActive;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _tierController.dispose();
    _priceController.dispose();
    _pointsController.dispose();
    _pointMultiplierController.dispose();
    _cashbackRateController.dispose();
    _welcomePointsController.dispose();
    _welcomeCashbackController.dispose();
    _durationDaysController.dispose();
    _descriptionController.dispose();
    _benefitsController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final data = <String, dynamic>{
        'name': _nameController.text.trim(),
        'tier': _tierController.text.trim().toLowerCase(),
        'price': double.parse(_priceController.text),
        'points': int.parse(_pointsController.text),
        'point_multiplier': double.parse(_pointMultiplierController.text),
        'cashback_rate': double.parse(_cashbackRateController.text),
        'welcome_points': int.parse(_welcomePointsController.text),
        'welcome_cashback': double.parse(_welcomeCashbackController.text),
        'duration_days': int.parse(_durationDaysController.text),
        'is_active': _isActive,
        if (_descriptionController.text.isNotEmpty)
          'description': _descriptionController.text.trim(),
        if (_benefitsController.text.isNotEmpty)
          'benefits': _benefitsController.text
              .split('\n')
              .where((b) => b.trim().isNotEmpty)
              .map((b) => b.trim())
              .toList(),
      };

      // Handle image upload if new image is selected
      if (_selectedImage != null) {
        final apiClient = context.read<ApiClient>();
        final baseUrl = apiClient.baseUrl.replaceAll('/api', '');
        final uploadUrl =
            '$baseUrl/api/memberships${widget.plan != null ? '/${widget.plan!.id}' : ''}';

        final request = http.MultipartRequest(
          widget.plan != null ? 'PUT' : 'POST',
          Uri.parse(uploadUrl),
        );

        // Add auth token
        final token = apiClient.authToken;
        if (token != null) {
          request.headers['Authorization'] = 'Bearer $token';
        }

        // Add form fields
        request.fields.addAll(data.map((key, value) {
          if (value is List) {
            return MapEntry(key, value.join(','));
          }
          return MapEntry(key, value.toString());
        }));

        // Add image file
        final imageFile = await http.MultipartFile.fromPath(
          'image',
          _selectedImage!.path,
        );
        request.files.add(imageFile);

        final streamedResponse = await request.send();
        final response = await http.Response.fromStream(streamedResponse);

        if (response.statusCode >= 200 && response.statusCode < 300) {
          await widget.onSave(data);
        } else {
          throw Exception('فشل رفع الصورة: ${response.statusCode}');
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
        title: Text(widget.plan != null ? 'تعديل الباقة' : 'إضافة باقة جديدة'),
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
                onTap: _pickImage,
                child: Container(
                  height: 200,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: _selectedImage != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.file(
                            _selectedImage!,
                            fit: BoxFit.cover,
                          ),
                        )
                      : widget.plan?.imageUrl != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Image.network(
                                widget.plan!.imageUrl!,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => const Icon(
                                  Icons.image,
                                  size: 64,
                                ),
                              ),
                            )
                          : const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.add_photo_alternate, size: 64),
                                SizedBox(height: 8),
                                Text('اضغط لإضافة صورة'),
                              ],
                            ),
                ),
              ),
              const SizedBox(height: 16),

              // Name
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'اسم الباقة',
                  border: OutlineInputBorder(),
                ),
                validator: (value) =>
                    value?.isEmpty ?? true ? 'يرجى إدخال اسم الباقة' : null,
              ),
              const SizedBox(height: 16),

              // Tier
              TextFormField(
                controller: _tierController,
                decoration: const InputDecoration(
                  labelText:
                      'المستوى (silver, gold, platinum, vip, diamond, business)',
                  border: OutlineInputBorder(),
                ),
                validator: (value) =>
                    value?.isEmpty ?? true ? 'يرجى إدخال المستوى' : null,
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

              // Points
              TextFormField(
                controller: _pointsController,
                decoration: const InputDecoration(
                  labelText: 'النقاط',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'يرجى إدخال النقاط';
                  }
                  if (int.tryParse(value!) == null) {
                    return 'يرجى إدخال رقم صحيح';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Point Multiplier
              TextFormField(
                controller: _pointMultiplierController,
                decoration: const InputDecoration(
                  labelText: 'مضاعف النقاط',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'يرجى إدخال مضاعف النقاط';
                  }
                  if (double.tryParse(value!) == null) {
                    return 'يرجى إدخال رقم صحيح';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Cashback Rate
              TextFormField(
                controller: _cashbackRateController,
                decoration: const InputDecoration(
                  labelText: 'نسبة الكاش باك (%)',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'يرجى إدخال نسبة الكاش باك';
                  }
                  if (double.tryParse(value!) == null) {
                    return 'يرجى إدخال رقم صحيح';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Welcome Points
              TextFormField(
                controller: _welcomePointsController,
                decoration: const InputDecoration(
                  labelText: 'نقاط الترحيب',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'يرجى إدخال نقاط الترحيب';
                  }
                  if (int.tryParse(value!) == null) {
                    return 'يرجى إدخال رقم صحيح';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Welcome Cashback
              TextFormField(
                controller: _welcomeCashbackController,
                decoration: const InputDecoration(
                  labelText: 'كاش باك الترحيب',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'يرجى إدخال كاش باك الترحيب';
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
                  labelText: 'المدة بالأيام',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'يرجى إدخال المدة';
                  }
                  if (int.tryParse(value!) == null) {
                    return 'يرجى إدخال رقم صحيح';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Description
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'الوصف (اختياري)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),

              // Benefits
              TextFormField(
                controller: _benefitsController,
                decoration: const InputDecoration(
                  labelText: 'المميزات (سطر واحد لكل ميزة)',
                  border: OutlineInputBorder(),
                  helperText: 'اكتب كل ميزة في سطر منفصل',
                ),
                maxLines: 5,
              ),
              const SizedBox(height: 16),

              // Is Active
              SwitchListTile(
                title: const Text('الباقة نشطة'),
                value: _isActive,
                onChanged: (value) => setState(() => _isActive = value),
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
                    : Text(
                        widget.plan != null ? 'حفظ التعديلات' : 'إضافة الباقة'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
