import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import 'package:altayar/features/content/presentation/providers/content_provider.dart';

class ReelComposerSheet extends StatefulWidget {
  const ReelComposerSheet({super.key});

  @override
  State<ReelComposerSheet> createState() => _ReelComposerSheetState();
}

class _ReelComposerSheetState extends State<ReelComposerSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  XFile? _selectedVideo;
  bool _isUploading = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets;
    final provider = context.watch<ContentProvider>();
    final canSubmit =
        _selectedVideo != null && !_isUploading && !_titleEmpty && !_descEmpty;
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 16,
        bottom: viewInsets.bottom + 16,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 46,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text(
                'إنشاء ريل جديد',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'العنوان',
                ),
                maxLength: 60,
                validator: (value) =>
                    value == null || value.trim().isEmpty ? 'مطلوب' : null,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'الوصف',
                ),
                maxLines: 4,
                maxLength: 300,
                validator: (value) =>
                    value == null || value.trim().isEmpty ? 'مطلوب' : null,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.video_library_outlined),
                      label: const Text('المعرض'),
                      onPressed: _isUploading
                          ? null
                          : () => _pickVideo(ImageSource.gallery),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.videocam_outlined),
                      label: const Text('الكاميرا'),
                      onPressed: _isUploading || kIsWeb
                          ? null
                          : () => _pickVideo(ImageSource.camera),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _VideoSummary(
                file: _selectedVideo,
                onClear: _selectedVideo == null
                    ? null
                    : () => setState(() => _selectedVideo = null),
              ),
              if (provider.errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    provider.errorMessage!,
                    style: const TextStyle(color: Colors.redAccent),
                  ),
                ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  icon: _isUploading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.cloud_upload_outlined),
                  label: const Text('نشر الريل'),
                  onPressed: canSubmit ? () => _submit(provider) : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  bool get _titleEmpty => _titleController.text.trim().isEmpty;
  bool get _descEmpty => _descriptionController.text.trim().isEmpty;

  Future<void> _pickVideo(ImageSource source) async {
    try {
      final video = await _picker.pickVideo(
        source: source,
        maxDuration: const Duration(minutes: 3),
      );
      if (video != null) {
        setState(() => _selectedVideo = video);
      }
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('فشل اختيار الفيديو: $error')),
      );
    }
  }

  Future<void> _submit(ContentProvider provider) async {
    if (!_formKey.currentState!.validate() || _selectedVideo == null) return;
    setState(() => _isUploading = true);
    final success = await provider.uploadReel(
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      video: _selectedVideo!,
    );
    if (!mounted) return;
    setState(() => _isUploading = false);
    if (success) {
      Navigator.of(context).pop(true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تعذّر رفع الريل، حاول مرة أخرى')),
      );
    }
  }
}

class _VideoSummary extends StatelessWidget {
  const _VideoSummary({this.file, this.onClear});

  final XFile? file;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    if (file == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Colors.grey.shade100,
        ),
        child: Row(
          children: const [
            Icon(Icons.info_outline),
            SizedBox(width: 8),
            Expanded(
              child: Text('اختر فيديو MP4 أو MOV لمدة لا تتجاوز 3 دقائق.'),
            ),
          ],
        ),
      );
    }
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 8),
      leading: const Icon(Icons.check_circle, color: Colors.green),
      title: Text(file!.name),
      subtitle: const Text('الفيديو جاهز للرفع.'),
      trailing: IconButton(
        icon: const Icon(Icons.close),
        onPressed: onClear,
      ),
    );
  }
}
