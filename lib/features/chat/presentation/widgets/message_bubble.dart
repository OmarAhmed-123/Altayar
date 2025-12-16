import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher_string.dart';

import 'package:altayar/core/widgets/animated_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/chat/data/models/chat_attachment.dart';
import 'package:altayar/features/chat/data/models/chat_message.dart';

class MessageBubble extends StatelessWidget {
  const MessageBubble({super.key, required this.message});

  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final alignment =
        message.isMine ? Alignment.centerRight : Alignment.centerLeft;
    final textColor = message.isMine ? Colors.white : AppColors.dark;
    return Align(
      alignment: alignment,
      child: AnimatedCard(
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(20),
          topRight: const Radius.circular(20),
          bottomLeft: Radius.circular(message.isMine ? 20 : 6),
          bottomRight: Radius.circular(message.isMine ? 6 : 20),
        ),
        margin: const EdgeInsets.symmetric(vertical: 6),
        child: Container(
          padding: const EdgeInsets.all(14),
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.65,
          ),
          decoration: BoxDecoration(
            gradient: message.isMine
                ? LinearGradient(
                    colors: AppColors.primaryGradient,
                  )
                : null,
            color: message.isMine ? null : Colors.grey.shade100,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(20),
              topRight: const Radius.circular(20),
              bottomLeft: Radius.circular(message.isMine ? 20 : 6),
              bottomRight: Radius.circular(message.isMine ? 6 : 20),
            ),
            boxShadow: [
              BoxShadow(
                color: message.isMine
                    ? AppColors.primary.withOpacity(0.3)
                    : Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!message.isMine)
                Text(
                  message.senderName,
                  style: TextStyle(
                    color: textColor.withAlpha((255 * .8).round()),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              if (message.content.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Text(
                    message.content,
                    style: TextStyle(color: textColor),
                  ),
                ),
              if (message.attachments.isNotEmpty)
                _AttachmentsGrid(
                  attachments: message.attachments,
                  textColor: textColor,
                ),
              Align(
                alignment: Alignment.bottomRight,
                child: Text(
                  message.createdAt.toLocal().toString().split('.').first,
                  style: TextStyle(
                    color: textColor.withAlpha((255 * .7).round()),
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AttachmentsGrid extends StatelessWidget {
  const _AttachmentsGrid({
    required this.attachments,
    required this.textColor,
  });

  final List<ChatAttachment> attachments;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: attachments.map((attachment) {
        if (attachment.type == ChatAttachmentType.image) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: CachedNetworkImage(
                imageUrl: attachment.url,
                height: 150,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(
                  color: Colors.black12,
                  alignment: Alignment.center,
                  child: const CircularProgressIndicator(strokeWidth: 2),
                ),
                errorWidget: (_, __, ___) => Container(
                  color: Colors.black26,
                  alignment: Alignment.center,
                  child: const Icon(Icons.broken_image, size: 32),
                ),
              ),
            ),
          );
        }
        return ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.insert_drive_file),
          title: Text(
            attachment.name ?? 'ملف مرفق',
            style: TextStyle(color: textColor),
          ),
          onTap: () => _openFile(attachment.url),
        );
      }).toList(),
    );
  }

  Future<void> _openFile(String url) async {
    if (url.isEmpty) return;
    await launchUrlString(
      url,
      mode: LaunchMode.externalApplication,
    );
  }
}
