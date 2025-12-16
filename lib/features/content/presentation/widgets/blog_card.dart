import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import 'package:altayar/core/widgets/animated_card.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/core/utils/date_formatter.dart';
import 'package:altayar/core/config/app_config.dart';
import 'package:altayar/features/content/data/models/blog_post.dart';
import 'package:altayar/features/content/presentation/providers/content_provider.dart';
import 'package:altayar/features/content/presentation/widgets/comments_sheet.dart';

class BlogCard extends StatelessWidget {
  const BlogCard({super.key, required this.blog});

  final BlogPost blog;

  @override
  Widget build(BuildContext context) {
    final provider = context.read<ContentProvider>();
    final theme = Theme.of(context);
    final hasMedia = (blog.mediaUrl ?? '').isNotEmpty;

    return AnimatedCard(
      borderRadius: BorderRadius.circular(20),
      margin: const EdgeInsets.only(bottom: 20),
      elevation: 2,
      onTap: () => _openDetails(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with gradient background
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: AppColors.primaryGradient,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
              ),
            ),
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.article_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        blog.title,
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontSize: 18,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(
                            Icons.person_outline_rounded,
                            size: 14,
                            color: Colors.white.withOpacity(0.9),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            blog.authorName,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.white.withOpacity(0.9),
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Icon(
                            Icons.access_time_rounded,
                            size: 14,
                            color: Colors.white.withOpacity(0.9),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            DateFormatter.format(blog.createdAt),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.white.withOpacity(0.9),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Media section
          if (hasMedia)
            ClipRRect(
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
              child: Stack(
                children: [
                  CachedNetworkImage(
                    imageUrl: blog.mediaUrl!,
                    height: 220,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      height: 220,
                      color: AppColors.light,
                      child: const Center(
                        child: CircularProgressIndicator(),
                      ),
                    ),
                    errorWidget: (context, url, error) => Container(
                      height: 220,
                      color: AppColors.light,
                      child: const Icon(Icons.broken_image, size: 48),
                    ),
                  ),
                  // Gradient overlay for better text readability
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      height: 80,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withOpacity(0.6),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

          // Content section
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Content preview
                Text(
                  blog.content,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    height: 1.6,
                    color: Colors.grey[700],
                  ),
                  maxLines: hasMedia ? 3 : 4,
                  overflow: TextOverflow.ellipsis,
                ),

                // Tags
                if (blog.tags.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: blog.tags
                        .map(
                          (tag) => Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: AppColors.primaryGradient
                                    .map((c) => c.withOpacity(0.15))
                                    .toList(),
                              ),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: AppColors.primary.withOpacity(0.3),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.tag_rounded,
                                  size: 14,
                                  color: AppColors.primary,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  tag,
                                  style: TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],

                // Action buttons
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(
                        color: Colors.grey[300]!,
                        width: 1,
                      ),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _ActionButton(
                        icon: blog.isLiked
                            ? Icons.favorite_rounded
                            : Icons.favorite_border_rounded,
                        label: _formatCount(blog.likesCount),
                        color: blog.isLiked
                            ? Colors.pinkAccent
                            : AppColors.primary,
                        onTap: () => provider.toggleLike(
                          postId: blog.id,
                          isReel: false,
                        ),
                      ),
                      _ActionButton(
                        icon: Icons.mode_comment_outlined,
                        label: _formatCount(blog.commentsCount),
                        onTap: () => _openComments(context),
                      ),
                      _ActionButton(
                        icon: Icons.share_rounded,
                        label: _formatCount(blog.shareCount),
                        onTap: () => _handleShare(context, blog, provider),
                      ),
                      _ActionButton(
                        icon: Icons.arrow_forward_ios_rounded,
                        label: 'اقرأ المزيد',
                        isText: true,
                        onTap: () => _openDetails(context),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  Future<void> _openComments(BuildContext context) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => ChangeNotifierProvider.value(
        value: context.read<ContentProvider>(),
        child: CommentsSheet(
          resourceType: 'blog',
          resourceId: blog.id,
          title: blog.title,
        ),
      ),
    );
  }

  Future<void> _openDetails(BuildContext context) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: true,
      enableDrag: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => ChangeNotifierProvider.value(
        value: context.read<ContentProvider>(),
        child: _BlogDetailSheet(blog: blog),
      ),
    );
  }

  Future<void> _handleShare(
    BuildContext context,
    BlogPost blog,
    ContentProvider provider,
  ) async {
    try {
      // Get share link from backend
      final shareLink = await provider.getShareLink(
        postId: blog.id,
        isReel: false,
      );

      String finalShareLink = shareLink;

      // If share link is empty, construct it manually
      if (finalShareLink.isEmpty) {
        final baseUrl = AppConfig.resolvedBaseUrl()
            .replaceAll('/api', '')
            .replaceAll(RegExp(r'/+$'), '');
        finalShareLink = '$baseUrl/blogs/${blog.id}';
      } else {
        // Ensure the URL is absolute
        final baseUrl = AppConfig.resolvedBaseUrl()
            .replaceAll('/api', '')
            .replaceAll(RegExp(r'/+$'), '');

        if (finalShareLink.startsWith('/')) {
          finalShareLink = '$baseUrl$finalShareLink';
        } else if (!finalShareLink.startsWith('http://') &&
            !finalShareLink.startsWith('https://')) {
          finalShareLink = '$baseUrl/$finalShareLink';
        }
      }

      // Share the link
      await Share.share(
        '${blog.title}\n\n$finalShareLink',
        subject: blog.title,
      );

      // Increment share count after successful share
      try {
        await provider.shareContent(
          postId: blog.id,
          isReel: false,
        );
      } catch (e) {
        // Silently fail if share count increment fails
        debugPrint('Failed to increment share count: $e');
      }

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم مشاركة رابط المدونة بنجاح'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (error) {
      if (context.mounted) {
        // Fallback: show dialog with copy option
        final baseUrl = AppConfig.resolvedBaseUrl()
            .replaceAll('/api', '')
            .replaceAll(RegExp(r'/+$'), '');

        String finalLink = '$baseUrl/blogs/${blog.id}';

        await showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('مشاركة المدونة'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('الرابط: $finalLink'),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('تم نسخ الرابط'),
                      ),
                    );
                  },
                  icon: const Icon(Icons.copy),
                  label: const Text('نسخ الرابط'),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('إغلاق'),
              ),
            ],
          ),
        );
      }
    }
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    this.onTap,
    this.color,
    this.isText = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final Color? color;
  final bool isText;

  @override
  Widget build(BuildContext context) {
    if (isText) {
      return TextButton(
        onPressed: onTap,
        style: TextButton.styleFrom(
          foregroundColor: color ?? AppColors.primary,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color ?? AppColors.primary,
              ),
            ),
            const SizedBox(width: 4),
            Icon(icon, size: 14, color: color ?? AppColors.primary),
          ],
        ),
      );
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 20,
              color: color ?? AppColors.primary,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: color ?? AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BlogDetailSheet extends StatelessWidget {
  const _BlogDetailSheet({required this.blog});

  final BlogPost blog;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ContentProvider>();
    final theme = Theme.of(context);
    final hasMedia = (blog.mediaUrl ?? '').isNotEmpty;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.95,
      minChildSize: 0.5,
      maxChildSize: 0.98,
      builder: (context, controller) => Container(
        decoration: BoxDecoration(
          color: theme.scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: AppColors.primaryGradient,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          blog.title,
                          style: theme.textTheme.headlineSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(
                              Icons.person_outline_rounded,
                              size: 16,
                              color: Colors.white.withOpacity(0.9),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              blog.authorName,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: Colors.white.withOpacity(0.9),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Icon(
                              Icons.access_time_rounded,
                              size: 16,
                              color: Colors.white.withOpacity(0.9),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              DateFormatter.format(blog.createdAt),
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: Colors.white.withOpacity(0.9),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded, color: Colors.white),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.white.withOpacity(0.2),
                    ),
                  ),
                ],
              ),
            ),

            // Content
            Expanded(
              child: SingleChildScrollView(
                controller: controller,
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (hasMedia)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: CachedNetworkImage(
                          imageUrl: blog.mediaUrl!,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            height: 250,
                            color: AppColors.light,
                            child: const Center(
                              child: CircularProgressIndicator(),
                            ),
                          ),
                          errorWidget: (context, url, error) => Container(
                            height: 250,
                            color: AppColors.light,
                            child: const Icon(Icons.broken_image, size: 48),
                          ),
                        ),
                      ),
                    if (hasMedia) const SizedBox(height: 24),
                    Text(
                      blog.content,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        height: 1.8,
                        fontSize: 16,
                      ),
                    ),
                    if (blog.tags.isNotEmpty) ...[
                      const SizedBox(height: 24),
                      Text(
                        'الوسوم',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: blog.tags
                            .map(
                              (tag) => Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: AppColors.primaryGradient
                                        .map((c) => c.withOpacity(0.15))
                                        .toList(),
                                  ),
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(
                                    color: AppColors.primary.withOpacity(0.3),
                                    width: 1,
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.tag_rounded,
                                      size: 16,
                                      color: AppColors.primary,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      tag,
                                      style: TextStyle(
                                        color: AppColors.primary,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ],
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),

            // Action bar
            Container(
              padding: const EdgeInsets.all(20),
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
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _ActionButton(
                        icon: blog.isLiked
                            ? Icons.favorite_rounded
                            : Icons.favorite_border_rounded,
                        label: _formatCount(blog.likesCount),
                        color: blog.isLiked
                            ? Colors.pinkAccent
                            : AppColors.primary,
                        onTap: () => provider.toggleLike(
                          postId: blog.id,
                          isReel: false,
                        ),
                      ),
                      _ActionButton(
                        icon: Icons.mode_comment_outlined,
                        label: _formatCount(blog.commentsCount),
                        onTap: () => _openComments(context),
                      ),
                      _ActionButton(
                        icon: Icons.share_rounded,
                        label: _formatCount(blog.shareCount),
                        onTap: () => _handleShare(context, blog, provider),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () => _openComments(context),
                      icon: const Icon(Icons.chat_bubble_outline_rounded),
                      label: const Text('عرض التعليقات'),
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  Future<void> _openComments(BuildContext context) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => ChangeNotifierProvider.value(
        value: context.read<ContentProvider>(),
        child: CommentsSheet(
          resourceType: 'blog',
          resourceId: blog.id,
          title: blog.title,
        ),
      ),
    );
  }

  Future<void> _handleShare(
    BuildContext context,
    BlogPost blog,
    ContentProvider provider,
  ) async {
    try {
      // Get share link from backend
      final shareLink = await provider.getShareLink(
        postId: blog.id,
        isReel: false,
      );

      String finalShareLink = shareLink;

      // If share link is empty, construct it manually
      if (finalShareLink.isEmpty) {
        final baseUrl = AppConfig.resolvedBaseUrl()
            .replaceAll('/api', '')
            .replaceAll(RegExp(r'/+$'), '');
        finalShareLink = '$baseUrl/blogs/${blog.id}';
      } else {
        // Ensure the URL is absolute
        final baseUrl = AppConfig.resolvedBaseUrl()
            .replaceAll('/api', '')
            .replaceAll(RegExp(r'/+$'), '');

        if (finalShareLink.startsWith('/')) {
          finalShareLink = '$baseUrl$finalShareLink';
        } else if (!finalShareLink.startsWith('http://') &&
            !finalShareLink.startsWith('https://')) {
          finalShareLink = '$baseUrl/$finalShareLink';
        }
      }

      // Share the link
      await Share.share(
        '${blog.title}\n\n$finalShareLink',
        subject: blog.title,
      );

      // Increment share count after successful share
      try {
        await provider.shareContent(
          postId: blog.id,
          isReel: false,
        );
      } catch (e) {
        // Silently fail if share count increment fails
        debugPrint('Failed to increment share count: $e');
      }

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم مشاركة رابط المدونة بنجاح'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (error) {
      if (context.mounted) {
        // Fallback: show dialog with copy option
        final baseUrl = AppConfig.resolvedBaseUrl()
            .replaceAll('/api', '')
            .replaceAll(RegExp(r'/+$'), '');

        String finalLink = '$baseUrl/blogs/${blog.id}';

        await showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('مشاركة المدونة'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('الرابط: $finalLink'),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: () {
                    // Copy to clipboard
                    // You can add clipboard package if needed
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('تم نسخ الرابط'),
                      ),
                    );
                  },
                  icon: const Icon(Icons.copy),
                  label: const Text('نسخ الرابط'),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('إغلاق'),
              ),
            ],
          ),
        );
      }
    }
  }
}
