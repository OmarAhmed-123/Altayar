import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/widgets/state_message.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/content/presentation/providers/content_provider.dart';
import 'package:altayar/features/content/presentation/widgets/blog_card.dart';
import 'package:altayar/features/content/presentation/widgets/reel_composer_sheet.dart';
import 'package:altayar/features/content/presentation/widgets/reel_viewer.dart';

class ContentPage extends StatefulWidget {
  const ContentPage({super.key});

  @override
  State<ContentPage> createState() => _ContentPageState();
}

class _ContentPageState extends State<ContentPage>
    with SingleTickerProviderStateMixin {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<ContentProvider>();
      provider.loadBlogs();
      provider.loadReels();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ContentProvider>();
    final auth = context.watch<AuthProvider>();
    final canCompose = _canManageContent(auth.currentUser?.role);
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          leading: Navigator.of(context).canPop() ? const BackButton() : null,
          title: const Text('المحتوى والتفاعل'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'المدونة'),
              Tab(text: 'الريلز'),
            ],
          ),
          actions: [
            if (canCompose)
              IconButton(
                icon: const Icon(Icons.movie_creation_outlined),
                tooltip: 'إضافة ريل',
                onPressed: () => _openReelComposer(provider),
              ),
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                provider.loadBlogs(refresh: true);
                provider.loadReels(refresh: true);
              },
            ),
          ],
        ),
        body: TabBarView(
          children: [
            provider.isLoadingBlogs
                ? const Center(child: CircularProgressIndicator())
                : provider.errorMessage != null
                    ? StateMessage(
                        icon: Icons.article_outlined,
                        title: 'تعذّر تحميل المقالات',
                        subtitle: provider.errorMessage,
                        action: FilledButton(
                          onPressed: () => provider.loadBlogs(refresh: true),
                          child: const Text('إعادة المحاولة'),
                        ),
                      )
                    : provider.blogs.isEmpty
                        ? RefreshIndicator(
                            onRefresh: () => provider.loadBlogs(refresh: true),
                            child: SingleChildScrollView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              child: SizedBox(
                                height:
                                    MediaQuery.of(context).size.height * 0.7,
                                child: StateMessage(
                                  icon: Icons.article_outlined,
                                  title: 'لا توجد مقالات حالياً',
                                  subtitle: 'سيتم عرض المقالات هنا عند توفرها',
                                  action: FilledButton.icon(
                                    onPressed: () =>
                                        provider.loadBlogs(refresh: true),
                                    icon: const Icon(Icons.refresh),
                                    label: const Text('تحديث'),
                                  ),
                                ),
                              ),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => provider.loadBlogs(refresh: true),
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: provider.blogs.length,
                              itemBuilder: (context, index) =>
                                  BlogCard(blog: provider.blogs[index]),
                            ),
                          ),
            provider.isLoadingReels
                ? const Center(child: CircularProgressIndicator())
                : provider.errorMessage != null
                    ? StateMessage(
                        icon: Icons.play_circle_outline,
                        title: 'لا يمكن تحميل الريلز الآن',
                        subtitle: provider.errorMessage,
                        action: FilledButton(
                          onPressed: () => provider.loadReels(refresh: true),
                          child: const Text('إعادة المحاولة'),
                        ),
                      )
                    : provider.reels.isEmpty
                        ? RefreshIndicator(
                            onRefresh: () => provider.loadReels(refresh: true),
                            child: SingleChildScrollView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              child: SizedBox(
                                height:
                                    MediaQuery.of(context).size.height * 0.7,
                                child: StateMessage(
                                  icon: Icons.play_circle_outline,
                                  title: 'لا توجد ريلز حالياً',
                                  subtitle: 'سيتم عرض الريلز هنا عند توفرها',
                                  action: FilledButton.icon(
                                    onPressed: () =>
                                        provider.loadReels(refresh: true),
                                    icon: const Icon(Icons.refresh),
                                    label: const Text('تحديث'),
                                  ),
                                ),
                              ),
                            ),
                          )
                        : ReelsView(reels: provider.reels),
          ],
        ),
      ),
    );
  }

  bool _canManageContent(String? role) {
    final normalized = (role ?? '').toLowerCase();
    return normalized == 'super_admin' ||
        normalized == 'admin' ||
        normalized == 'data_entry';
  }

  Future<void> _openReelComposer(ContentProvider provider) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => ChangeNotifierProvider.value(
        value: provider,
        child: const ReelComposerSheet(),
      ),
    );
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم رفع الريل بنجاح')),
      );
    }
  }
}
