import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/features/content/data/models/blog_post.dart';
import 'package:altayar/features/content/presentation/providers/content_provider.dart';

class AddEditBlogPage extends StatefulWidget {
  const AddEditBlogPage({
    super.key,
    this.blog,
  });

  final BlogPost? blog;

  @override
  State<AddEditBlogPage> createState() => _AddEditBlogPageState();
}

class _AddEditBlogPageState extends State<AddEditBlogPage> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _contentController;
  late TextEditingController _categoryController;
  late TextEditingController _destinationController;
  late TextEditingController _tagsController;

  File? _selectedImage;
  String? _imageUrl;
  bool _isPublished = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(
      text: widget.blog?.title ?? '',
    );
    _contentController = TextEditingController(
      text: widget.blog?.content ?? '',
    );
    _categoryController = TextEditingController(
      text: widget.blog?.category ?? '',
    );
    _destinationController = TextEditingController(
      text: widget.blog?.destination ?? '',
    );
    _tagsController = TextEditingController(
      text: widget.blog?.tags.join(', ') ?? '',
    );
    _imageUrl = widget.blog?.mediaUrl;
    _isPublished =
        widget.blog != null ? true : true; // Always published by default
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    _categoryController.dispose();
    _destinationController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );

    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
        _imageUrl = null; // Clear URL when new image is selected
      });
    }
  }

  Future<void> _takePhoto() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 85,
    );

    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
        _imageUrl = null; // Clear URL when new image is selected
      });
    }
  }

  Future<void> _showImageSourceDialog() async {
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('اختر مصدر الصورة'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('من المعرض'),
              onTap: () {
                Navigator.pop(context);
                _pickImage();
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('التقاط صورة'),
              onTap: () {
                Navigator.pop(context);
                _takePhoto();
              },
            ),
            if (_imageUrl != null)
              ListTile(
                leading: const Icon(Icons.link),
                title: const Text('استخدام رابط URL'),
                onTap: () {
                  Navigator.pop(context);
                  _showUrlInputDialog();
                },
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _showUrlInputDialog() async {
    final urlController = TextEditingController(text: _imageUrl ?? '');
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('أدخل رابط الصورة'),
        content: TextField(
          controller: urlController,
          decoration: const InputDecoration(
            hintText: 'https://example.com/image.jpg',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () {
              setState(() {
                _imageUrl = urlController.text.trim();
                _selectedImage = null; // Clear file when URL is set
              });
              Navigator.pop(context);
            },
            child: const Text('حفظ'),
          ),
        ],
      ),
    );
  }

  List<String> _parseTags(String tagsString) {
    if (tagsString.trim().isEmpty) return [];
    return tagsString
        .split(',')
        .map((tag) => tag.trim())
        .where((tag) => tag.isNotEmpty)
        .toList();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    final provider = context.read<ContentProvider>();
    final tags = _parseTags(_tagsController.text);

    bool success = false;

    if (widget.blog == null) {
      // Create new blog
      success = await provider.createBlog(
        title: _titleController.text.trim(),
        content: _contentController.text.trim(),
        category: _categoryController.text.trim().isEmpty
            ? null
            : _categoryController.text.trim(),
        destination: _destinationController.text.trim().isEmpty
            ? null
            : _destinationController.text.trim(),
        tags: tags.isEmpty ? null : tags,
        image: _selectedImage != null ? XFile(_selectedImage!.path) : null,
        mediaUrl:
            _selectedImage == null && _imageUrl != null && _imageUrl!.isNotEmpty
                ? _imageUrl
                : null,
      );
    } else {
      // Update existing blog
      success = await provider.updateBlog(
        id: widget.blog!.id,
        title: _titleController.text.trim(),
        content: _contentController.text.trim(),
        category: _categoryController.text.trim().isEmpty
            ? null
            : _categoryController.text.trim(),
        destination: _destinationController.text.trim().isEmpty
            ? null
            : _destinationController.text.trim(),
        tags: tags.isEmpty ? null : tags,
        image: _selectedImage != null ? XFile(_selectedImage!.path) : null,
        mediaUrl:
            _selectedImage == null && _imageUrl != null && _imageUrl!.isNotEmpty
                ? _imageUrl
                : null,
        isPublished: _isPublished,
      );
    }

    setState(() => _isSaving = false);

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.blog == null
                ? 'تم إنشاء المدونة بنجاح'
                : 'تم تحديث المدونة بنجاح',
          ),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.of(context).pop(true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            provider.errorMessage ??
                (widget.blog == null
                    ? 'فشل إنشاء المدونة'
                    : 'فشل تحديث المدونة'),
          ),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isEditing = widget.blog != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'تعديل المدونة' : 'إضافة مدونة جديدة'),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Image Preview/Selector
              Container(
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
                          width: double.infinity,
                        ),
                      )
                    : _imageUrl != null && _imageUrl!.isNotEmpty
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.network(
                              _imageUrl!,
                              fit: BoxFit.cover,
                              width: double.infinity,
                              errorBuilder: (context, error, stackTrace) =>
                                  _buildImagePlaceholder(),
                            ),
                          )
                        : _buildImagePlaceholder(),
              ),
              const SizedBox(height: 12),
              GradientButton(
                label: _selectedImage != null || _imageUrl != null
                    ? 'تغيير الصورة'
                    : 'إضافة صورة',
                icon: Icons.add_photo_alternate,
                onPressed: _showImageSourceDialog,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),

              const SizedBox(height: 24),

              // Title
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(
                  labelText: 'عنوان المدونة *',
                  hintText: 'أدخل عنوان المدونة',
                  prefixIcon: const Icon(Icons.title),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Colors.grey[50],
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'الرجاء إدخال عنوان المدونة';
                  }
                  return null;
                },
                maxLines: 2,
              ),

              const SizedBox(height: 16),

              // Content
              TextFormField(
                controller: _contentController,
                decoration: InputDecoration(
                  labelText: 'محتوى المدونة *',
                  hintText: 'أدخل محتوى المدونة',
                  prefixIcon: const Icon(Icons.article),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Colors.grey[50],
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'الرجاء إدخال محتوى المدونة';
                  }
                  return null;
                },
                maxLines: 8,
              ),

              const SizedBox(height: 16),

              // Category
              TextFormField(
                controller: _categoryController,
                decoration: InputDecoration(
                  labelText: 'الفئة',
                  hintText: 'مثال: سياحة، طعام، ثقافة',
                  prefixIcon: const Icon(Icons.category),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Colors.grey[50],
                ),
              ),

              const SizedBox(height: 16),

              // Destination
              TextFormField(
                controller: _destinationController,
                decoration: InputDecoration(
                  labelText: 'الوجهة',
                  hintText: 'مثال: القاهرة، الأقصر، أسوان',
                  prefixIcon: const Icon(Icons.location_on),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Colors.grey[50],
                ),
              ),

              const SizedBox(height: 16),

              // Tags
              TextFormField(
                controller: _tagsController,
                decoration: InputDecoration(
                  labelText: 'الوسوم',
                  hintText: 'مثال: سياحة، مصر، تاريخ (مفصولة بفواصل)',
                  prefixIcon: const Icon(Icons.tag),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Colors.grey[50],
                  helperText: 'افصل بين الوسوم بفواصل',
                ),
              ),

              const SizedBox(height: 24),

              // Published Toggle
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.publish, color: AppColors.primary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'نشر المدونة',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'ستظهر المدونة لجميع المستخدمين',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: _isPublished,
                      onChanged: (value) {
                        setState(() => _isPublished = value);
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Save Button
              GradientButton(
                label: isEditing ? 'حفظ التعديلات' : 'إنشاء المدونة',
                icon: Icons.save,
                onPressed: _isSaving ? null : _save,
                isBusy: _isSaving,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImagePlaceholder() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.add_photo_alternate, size: 48, color: Colors.grey[400]),
          const SizedBox(height: 8),
          Text(
            'إضافة صورة',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}
