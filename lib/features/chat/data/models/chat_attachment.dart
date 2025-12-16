import 'package:equatable/equatable.dart';

import 'package:altayar/core/utils/url_builder.dart';

enum ChatAttachmentType { image, file }

class ChatAttachment extends Equatable {
  const ChatAttachment({
    required this.url,
    required this.type,
    this.name,
    this.mime,
  });

  final String url;
  final ChatAttachmentType type;
  final String? name;
  final String? mime;

  factory ChatAttachment.fromJson(Map<String, dynamic> json) {
    final mime =
        json['mime_type']?.toString() ?? json['mime']?.toString() ?? '';
    final isImage = mime.startsWith('image/');
    final rawUrl = json['url']?.toString() ?? '';
    return ChatAttachment(
      url: UrlBuilder.resolveMedia(rawUrl),
      type: isImage ? ChatAttachmentType.image : ChatAttachmentType.file,
      name: json['name']?.toString(),
      mime: mime,
    );
  }

  @override
  List<Object?> get props => [url, type, name, mime];
}
