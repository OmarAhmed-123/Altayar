import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/core/utils/date_formatter.dart';
import 'package:altayar/core/utils/url_builder.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/content/data/models/comment_model.dart';
import 'package:altayar/features/content/presentation/providers/content_provider.dart';

class CommentsSheet extends StatefulWidget {
  const CommentsSheet({
    super.key,
    required this.resourceType,
    required this.resourceId,
    required this.title,
  });

  final String resourceType;
  final int resourceId;
  final String title;

  @override
  State<CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends State<CommentsSheet> {
  final _controller = TextEditingController();
  bool _loading = true;
  bool _commentSent = false;
  List<CommentModel> _comments = const [];

  @override
  void initState() {
    super.initState();
    _loadComments();
  }

  Future<void> _loadComments({bool refresh = false}) async {
    final provider = context.read<ContentProvider>();
    final result = await provider.fetchComments(
      resourceType: widget.resourceType,
      resourceId: widget.resourceId,
      refresh: refresh,
    );
    setState(() {
      _comments = result;
      _loading = false;
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ContentProvider>();
    final theme = Theme.of(context);
    return SafeArea(
      child: Container(
        decoration: BoxDecoration(
          color: theme.scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: SizedBox(
            height: MediaQuery.of(context).size.height * 0.75,
            child: Column(
              children: [
                // Handle bar
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                // Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'التعليقات',
                              style: theme.textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              widget.title,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: Colors.grey[600],
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: _loading
                      ? const Center(child: CircularProgressIndicator())
                      : RefreshIndicator(
                          onRefresh: () => _loadComments(refresh: true),
                          child: _comments.isEmpty
                              ? ListView(
                                  children: const [
                                    Padding(
                                      padding: EdgeInsets.all(32),
                                      child: Center(
                                        child: Text('لا توجد تعليقات بعد.'),
                                      ),
                                    ),
                                  ],
                                )
                              : ListView.separated(
                                  padding: const EdgeInsets.all(16),
                                  itemBuilder: (context, index) {
                                    final comment = _comments[index];
                                    return _CommentTile(comment: comment);
                                  },
                                  separatorBuilder: (_, __) =>
                                      const Divider(height: 1),
                                  itemCount: _comments.length,
                                ),
                        ),
                ),
                // Input section
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.cardColor,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _controller,
                          decoration: InputDecoration(
                            hintText: 'أضف تعليقك...',
                            filled: true,
                            fillColor: theme.inputDecorationTheme.fillColor ??
                                Colors.grey[100],
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 12,
                            ),
                          ),
                          maxLines: null,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _submit(provider),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: AppColors.primaryGradient,
                          ),
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          onPressed: provider.isCommenting
                              ? null
                              : () => _submit(provider),
                          icon: _commentSent
                              ? const Icon(Icons.check_circle,
                                  color: Colors.white, size: 24)
                              : provider.isCommenting
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Icon(Icons.send_rounded,
                                      color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit(ContentProvider provider) async {
    final content = _controller.text.trim();
    if (content.isEmpty) return;

    // Reset comment sent state
    setState(() {
      _commentSent = false;
    });

    // Get current user name from AuthProvider
    final authProvider = context.read<AuthProvider>();
    final currentUser = authProvider.currentUser;
    final userName = currentUser?.name ?? 'مستخدم';

    final comment = await provider.addComment(
      resourceType: widget.resourceType,
      resourceId: widget.resourceId,
      content: content,
    );
    if (comment != null) {
      // If the comment doesn't have the user name, update it with current user name
      final updatedComment =
          comment.authorName.isEmpty || comment.authorName == 'مستخدم'
              ? comment.copyWith(
                  authorName: userName,
                  authorAvatar:
                      comment.authorAvatar ?? currentUser?.profilePictureUrl,
                )
              : comment;

      setState(() {
        _comments = [updatedComment, ..._comments];
        _controller.clear();
        _commentSent = true;
      });

      // Reset the check mark after 2 seconds
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          setState(() {
            _commentSent = false;
          });
        }
      });

      // Refresh comments count in the provider
      if (widget.resourceType == 'reel') {
        // The provider already updates the count in addComment
      }
    } else if (mounted && provider.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.errorMessage!)),
      );
    }
  }
}

class _CommentTile extends StatelessWidget {
  const _CommentTile({required this.comment});

  final CommentModel comment;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasAvatar =
        comment.authorAvatar != null && comment.authorAvatar!.isNotEmpty;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.grey[200]!,
          width: 1,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: hasAvatar
                  ? null
                  : LinearGradient(
                      colors: AppColors.primaryGradient,
                    ),
              border: Border.all(
                color: AppColors.primary.withOpacity(0.3),
                width: 2,
              ),
            ),
            child: ClipOval(
              child: hasAvatar
                  ? CachedNetworkImage(
                      imageUrl: UrlBuilder.resolveMedia(comment.authorAvatar!),
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: AppColors.primary,
                        child: const Center(
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      errorWidget: (_, __, ___) => Container(
                        color: AppColors.primary,
                        child: const Icon(
                          Icons.person,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    )
                  : Center(
                      child: Text(
                        comment.authorName.isNotEmpty
                            ? comment.authorName[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 12),
          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Author name
                Text(
                  comment.authorName.isNotEmpty ? comment.authorName : 'مستخدم',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.dark,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 8),
                // Comment content
                Text(
                  comment.content.isNotEmpty ? comment.content : 'لا يوجد نص',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    height: 1.6,
                    fontSize: 14,
                    color: AppColors.dark,
                  ),
                ),
                const SizedBox(height: 8),
                // Date
                Row(
                  children: [
                    Icon(
                      Icons.access_time_rounded,
                      size: 14,
                      color: Colors.grey[500],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      DateFormatter.format(comment.createdAt),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
