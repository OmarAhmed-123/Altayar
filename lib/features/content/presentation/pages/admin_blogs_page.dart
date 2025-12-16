import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/features/content/data/models/blog_post.dart';
import 'package:altayar/features/content/presentation/providers/content_provider.dart';
import 'package:altayar/features/content/presentation/pages/add_edit_blog_page.dart';
import 'package:altayar/core/utils/date_formatter.dart';

class AdminBlogsPage extends StatefulWidget {
  const AdminBlogsPage({super.key});

  @override
  State<AdminBlogsPage> createState() => _AdminBlogsPageState();
}

class _AdminBlogsPageState extends State<AdminBlogsPage> {
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ContentProvider>().loadBlogs(refresh: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('إدارة المدونات'),
        actions: [
          IconButton(
            onPressed: () {
              context.read<ContentProvider>().loadBlogs(refresh: true);
            },
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث',
          ),
          IconButton(
            onPressed: () => _showAddBlogDialog(context),
            icon: const Icon(Icons.add_circle_outline),
            tooltip: 'إضافة مدونة جديدة',
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'بحث في المدونات...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                filled: true,
                fillColor: Colors.grey[100],
              ),
              onChanged: (value) {
                setState(() => _searchQuery = value);
              },
            ),
          ),

          // Blogs List
          Expanded(
            child: Consumer<ContentProvider>(
              builder: (context, provider, _) {
                if (provider.isLoadingBlogs) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (provider.errorMessage != null) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline,
                            size: 64, color: Colors.red[300]),
                        const SizedBox(height: 16),
                        Text(
                          'خطأ في تحميل المدونات',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          provider.errorMessage!,
                          style: Theme.of(context).textTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: () => provider.loadBlogs(refresh: true),
                          child: const Text('إعادة المحاولة'),
                        ),
                      ],
                    ),
                  );
                }

                final filteredBlogs = _searchQuery.isEmpty
                    ? provider.blogs
                    : provider.blogs
                        .where((blog) =>
                            blog.title
                                .toLowerCase()
                                .contains(_searchQuery.toLowerCase()) ||
                            blog.content
                                .toLowerCase()
                                .contains(_searchQuery.toLowerCase()))
                        .toList();

                if (filteredBlogs.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.article_outlined,
                            size: 64, color: Colors.grey[400]),
                        const SizedBox(height: 16),
                        Text(
                          _searchQuery.isEmpty
                              ? 'لا توجد مدونات'
                              : 'لم يتم العثور على نتائج',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _searchQuery.isEmpty
                              ? 'ابدأ بإضافة مدونة جديدة'
                              : 'جرب البحث بكلمات مختلفة',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        if (_searchQuery.isEmpty) ...[
                          const SizedBox(height: 24),
                          GradientButton(
                            label: 'إضافة مدونة جديدة',
                            icon: Icons.add,
                            onPressed: () => _showAddBlogDialog(context),
                          ),
                        ],
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => provider.loadBlogs(refresh: true),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredBlogs.length,
                    itemBuilder: (context, index) {
                      final blog = filteredBlogs[index];
                      return _BlogCard(
                        blog: blog,
                        onEdit: () => _showEditBlogDialog(context, blog),
                        onDelete: () => _showDeleteConfirmation(
                          context,
                          blog,
                          provider,
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showAddBlogDialog(BuildContext context) {
    Navigator.of(context)
        .push(
      MaterialPageRoute(
        builder: (_) => const AddEditBlogPage(),
      ),
    )
        .then((_) {
      if (context.mounted) {
        context.read<ContentProvider>().loadBlogs(refresh: true);
      }
    });
  }

  void _showEditBlogDialog(BuildContext context, BlogPost blog) {
    Navigator.of(context)
        .push(
      MaterialPageRoute(
        builder: (_) => AddEditBlogPage(blog: blog),
      ),
    )
        .then((_) {
      if (context.mounted) {
        context.read<ContentProvider>().loadBlogs(refresh: true);
      }
    });
  }

  Future<void> _showDeleteConfirmation(
    BuildContext context,
    BlogPost blog,
    ContentProvider provider,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.red),
            SizedBox(width: 12),
            Text('تأكيد الحذف'),
          ],
        ),
        content: Text(
          'هل أنت متأكد من حذف المدونة "${blog.title}"؟\n\nسيتم حذف المدونة من قاعدة البيانات ولن تظهر عند جميع المستخدمين.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('حذف'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final success = await provider.deleteBlog(blog.id);
      if (context.mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم حذف المدونة بنجاح'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                provider.errorMessage ?? 'فشل حذف المدونة',
              ),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }
}

class _BlogCard extends StatelessWidget {
  const _BlogCard({
    required this.blog,
    required this.onEdit,
    required this.onDelete,
  });

  final BlogPost blog;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasMedia = (blog.mediaUrl ?? '').isNotEmpty;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with gradient
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
                      const SizedBox(height: 8),
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
                // Action buttons
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      onPressed: onEdit,
                      icon: const Icon(Icons.edit_rounded, color: Colors.white),
                      tooltip: 'تعديل',
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.white.withOpacity(0.2),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: onDelete,
                      icon:
                          const Icon(Icons.delete_rounded, color: Colors.white),
                      tooltip: 'حذف',
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.red.withOpacity(0.3),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Media preview
          if (hasMedia)
            ClipRRect(
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
              child: Image.network(
                blog.mediaUrl!,
                height: 200,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  height: 200,
                  color: Colors.grey[200],
                  child: const Icon(Icons.broken_image, size: 48),
                ),
              ),
            ),

          // Content preview
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  blog.content,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    height: 1.6,
                    color: Colors.grey[700],
                  ),
                  maxLines: hasMedia ? 2 : 3,
                  overflow: TextOverflow.ellipsis,
                ),
                if (blog.tags.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: blog.tags
                        .take(3)
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
                            child: Text(
                              tag,
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    _StatChip(
                      icon: Icons.favorite_outline,
                      count: blog.likesCount,
                      color: Colors.pink,
                    ),
                    const SizedBox(width: 12),
                    _StatChip(
                      icon: Icons.comment_outlined,
                      count: blog.commentsCount,
                      color: Colors.blue,
                    ),
                    const SizedBox(width: 12),
                    _StatChip(
                      icon: Icons.share_outlined,
                      count: blog.shareCount,
                      color: Colors.green,
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

class _StatChip extends StatelessWidget {
  const _StatChip({
    required this.icon,
    required this.count,
    required this.color,
  });

  final IconData icon;
  final int count;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 4),
        Text(
          count.toString(),
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      ],
    );
  }
}
