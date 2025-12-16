import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

typedef MessageSubmit = Future<void> Function({
  required String content,
  File? attachment,
});

class MessageInputBar extends StatefulWidget {
  const MessageInputBar({
    super.key,
    required this.onSend,
    required this.onBotAssist,
    this.isSending = false,
  });

  final MessageSubmit onSend;
  final VoidCallback onBotAssist;
  final bool isSending;

  @override
  State<MessageInputBar> createState() => _MessageInputBarState();
}

class _MessageInputBarState extends State<MessageInputBar> {
  final _controller = TextEditingController();
  File? _attachment;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (_attachment != null)
          ListTile(
            tileColor: Theme.of(context).colorScheme.surfaceContainerHighest,
            title: Text(_attachment!.path.split('/').last),
            trailing: IconButton(
              icon: const Icon(Icons.close),
              onPressed: () => setState(() => _attachment = null),
            ),
          ),
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.photo),
              onPressed: () => _pickImage(),
              tooltip: 'صورة',
            ),
            IconButton(
              icon: const Icon(Icons.videocam),
              onPressed: () => _pickVideo(),
              tooltip: 'فيديو',
            ),
            IconButton(
              icon: const Icon(Icons.attach_file),
              onPressed: () => _pickFile(),
              tooltip: 'ملف',
            ),
            IconButton(
              icon: const Icon(Icons.smart_toy_outlined),
              onPressed: widget.onBotAssist,
            ),
            Expanded(
              child: TextField(
                controller: _controller,
                minLines: 1,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'اكتب رسالتك...',
                  border: InputBorder.none,
                ),
              ),
            ),
            IconButton(
              onPressed: widget.isSending ? null : _submit,
              icon: widget.isSending
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      setState(() => _attachment = File(picked.path));
    }
  }

  Future<void> _pickVideo() async {
    final picker = ImagePicker();
    final picked = await picker.pickVideo(source: ImageSource.gallery);
    if (picked != null) {
      setState(() => _attachment = File(picked.path));
    }
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.any,
      allowMultiple: false,
    );
    if (result != null && result.files.single.path != null) {
      setState(() => _attachment = File(result.files.single.path!));
    }
  }

  Future<void> _submit() async {
    final text = _controller.text.trim();
    if (text.isEmpty && _attachment == null) return;
    await widget.onSend(content: text, attachment: _attachment);
    if (mounted) {
      setState(() {
        _controller.clear();
        _attachment = null;
      });
    }
  }
}
