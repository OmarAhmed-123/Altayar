import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:video_player/video_player.dart';

import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/core/utils/date_formatter.dart';
import 'package:altayar/core/utils/url_builder.dart';
import 'package:altayar/features/auth/presentation/widgets/server_config_sheet.dart';
import 'package:altayar/features/content/data/models/reel_model.dart';
import 'package:altayar/features/content/presentation/providers/content_provider.dart';
import 'package:altayar/features/content/presentation/widgets/comments_sheet.dart';
import 'package:altayar/core/config/app_config.dart';

class ReelsView extends StatefulWidget {
  const ReelsView({super.key, required this.reels});

  final List<ReelModel> reels;

  @override
  State<ReelsView> createState() => _ReelsViewState();
}

class _ReelsViewState extends State<ReelsView> {
  final PageController _controller = PageController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.reels.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.play_circle_outline,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'لا توجد فيديوهات بعد',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
          ],
        ),
      );
    }
    return PageView.builder(
      controller: _controller,
      scrollDirection: Axis.vertical,
      itemCount: widget.reels.length,
      itemBuilder: (context, index) {
        final reel = widget.reels[index];
        return _ReelPlayer(reel: reel);
      },
    );
  }
}

class _ReelPlayer extends StatefulWidget {
  const _ReelPlayer({required this.reel});

  final ReelModel reel;

  @override
  State<_ReelPlayer> createState() => _ReelPlayerState();
}

class _ReelPlayerState extends State<_ReelPlayer> {
  VideoPlayerController? _videoController;
  bool _isReady = false;
  String? _error;
  bool _suggestServerFix = false;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    final url = widget.reel.videoUrl.trim();
    if (url.isEmpty) {
      setState(() => _error = 'رابط الفيديو غير متاح.');
      return;
    }
    try {
      await _loadControllerFromNetwork(url);
      return;
    } on SocketException catch (error, stack) {
      debugPrint('[ReelPlayer] network socket error: $error');
      debugPrintStack(stackTrace: stack);
      _recordError(
        'تعذّر الاتصال بالخادم (${error.message}). تأكد من عنوان الخادم.',
        suggestServerFix: true,
      );
    } catch (error, stack) {
      debugPrint('[ReelPlayer] network stream failed: $error');
      debugPrintStack(stackTrace: stack);
    }
    try {
      final normalizedUrl = _parseUri(url).toString();
      final file = await DefaultCacheManager().getSingleFile(normalizedUrl);
      await _loadControllerFromFile(file.path);
    } on SocketException catch (error, stack) {
      if (!mounted) return;
      debugPrint('[ReelPlayer] cache socket error: $error');
      debugPrintStack(stackTrace: stack);
      _recordError(
        'تعذّر الوصول إلى الملف المخزن (${error.message}).',
        suggestServerFix: true,
      );
    } catch (error, stack) {
      if (!mounted) return;
      debugPrint('[ReelPlayer] cached file playback failed: $error');
      debugPrintStack(stackTrace: stack);
      _recordError('تعذّر تشغيل الفيديو (تأكد من الاتصال وحجم الملف).');
    }
  }

  Future<void> _loadControllerFromNetwork(String url) async {
    final uri = _parseUri(url);
    final controller = VideoPlayerController.networkUrl(uri);
    await _configureController(controller);
  }

  Future<void> _loadControllerFromFile(String path) async {
    final controller = VideoPlayerController.file(File(path));
    await _configureController(controller);
  }

  Future<void> _configureController(VideoPlayerController controller) async {
    await controller.initialize();
    controller.setLooping(true);
    await controller.play();
    if (!mounted) {
      await controller.dispose();
      return;
    }
    setState(() {
      _videoController?.dispose();
      _videoController = controller;
      _isReady = true;
      _error = null;
    });
  }

  Uri _parseUri(String url) {
    try {
      return Uri.parse(url);
    } catch (_) {
      return Uri.parse(Uri.encodeFull(url));
    }
  }

  bool get _isPlaying => _videoController?.value.isPlaying ?? false;

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ContentProvider>();
    final theme = Theme.of(context);

    return Stack(
      fit: StackFit.expand,
      children: [
        _buildBackdrop(),
        // Gradient overlay for better text readability
        Positioned.fill(
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.black.withOpacity(0.3),
                  Colors.black.withOpacity(0.7),
                ],
                stops: const [0.0, 0.6, 1.0],
              ),
            ),
          ),
        ),
        // Content info on the left
        Positioned(
          bottom: 0,
          left: 16,
          right: 100,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Author info
              Row(
                children: [
                  if (widget.reel.authorAvatar != null &&
                      widget.reel.authorAvatar!.isNotEmpty)
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: ClipOval(
                        child: CachedNetworkImage(
                          imageUrl: UrlBuilder.resolveMedia(
                              widget.reel.authorAvatar!),
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) => Container(
                            color: AppColors.primary,
                            child: Icon(
                              Icons.person,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                      ),
                    )
                  else
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.primary,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: Icon(
                        Icons.person,
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
                          widget.reel.authorName,
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (widget.reel.content != null &&
                            widget.reel.content!.isNotEmpty)
                          Text(
                            widget.reel.content!,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: Colors.white70,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Title
              Text(
                widget.reel.title,
                style: theme.textTheme.titleLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  shadows: [
                    Shadow(
                      color: Colors.black.withOpacity(0.5),
                      blurRadius: 4,
                    ),
                  ],
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              // Date
              Row(
                children: [
                  Icon(
                    Icons.access_time_rounded,
                    size: 14,
                    color: Colors.white70,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    DateFormatter.format(widget.reel.createdAt),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red, width: 1),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _error!,
                        style: const TextStyle(
                          color: Colors.redAccent,
                          fontSize: 12,
                        ),
                      ),
                      if (_suggestServerFix) ...[
                        const SizedBox(height: 8),
                        TextButton.icon(
                          onPressed: _openServerSettings,
                          icon: const Icon(Icons.settings_ethernet, size: 16),
                          label: const Text('ضبط إعدادات الاتصال'),
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
            ],
          ),
        ),
        // Action buttons on the right
        Positioned(
          bottom: 24,
          right: 16,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              // Like button
              _ModernActionButton(
                icon: widget.reel.isLiked
                    ? Icons.favorite_rounded
                    : Icons.favorite_border_rounded,
                label: _formatCount(widget.reel.likesCount),
                color: widget.reel.isLiked ? Colors.pinkAccent : Colors.white,
                onTap: () => provider.toggleLike(
                  postId: widget.reel.id,
                  isReel: true,
                ),
                gradient: widget.reel.isLiked
                    ? [Colors.pinkAccent, Colors.pink.shade300]
                    : null,
              ),
              const SizedBox(height: 20),
              // Favorite button
              _ModernActionButton(
                icon: widget.reel.isFavorite
                    ? Icons.bookmark_rounded
                    : Icons.bookmark_border_rounded,
                label: 'مفضل',
                color: widget.reel.isFavorite ? Colors.amber : Colors.white,
                onTap: () => provider.toggleFavorite(
                  postId: widget.reel.id,
                  isReel: true,
                ),
                gradient: widget.reel.isFavorite
                    ? [Colors.amber, Colors.orange.shade300]
                    : null,
              ),
              const SizedBox(height: 20),
              // Comments button
              _ModernActionButton(
                icon: Icons.mode_comment_outlined,
                label: _formatCount(widget.reel.commentsCount),
                onTap: () => _openComments(context),
              ),
              const SizedBox(height: 20),
              // Share button
              _ModernActionButton(
                icon: Icons.share_rounded,
                label: _formatCount(widget.reel.shareCount),
                onTap: () => _handleShare(context, provider),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  Future<void> _handleShare(
      BuildContext context, ContentProvider provider) async {
    try {
      // Use the video URL directly (mediaUrl/mediaUri) - no text, just the URL
      String shareLink = widget.reel.videoUrl;

      // If videoUrl is empty or relative, try to construct it
      if (shareLink.isEmpty) {
        final baseUrl = AppConfig.resolvedBaseUrl()
            .replaceAll('/api', '')
            .replaceAll(RegExp(r'/+$'), '');
        shareLink = '$baseUrl/uploads/reels/${widget.reel.id}.mp4';
      } else {
        // Ensure the URL is absolute
        final baseUrl = AppConfig.resolvedBaseUrl()
            .replaceAll('/api', '')
            .replaceAll(RegExp(r'/+$'), '');

        if (shareLink.startsWith('/')) {
          shareLink = '$baseUrl$shareLink';
        } else if (!shareLink.startsWith('http://') &&
            !shareLink.startsWith('https://')) {
          shareLink = '$baseUrl/$shareLink';
        }
      }

      // Share only the video URL (mediaUri) - no text description
      await Share.share(
        shareLink,
        subject: widget.reel.title,
      );

      // Increment share count after successful share
      try {
        await provider.shareContent(
          postId: widget.reel.id,
          isReel: true,
        );
      } catch (e) {
        // Silently fail if share count increment fails
        debugPrint('Failed to increment share count: $e');
      }

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم مشاركة رابط الفيديو بنجاح'),
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

        String finalLink = widget.reel.videoUrl;
        if (finalLink.isEmpty) {
          finalLink = '$baseUrl/uploads/reels/${widget.reel.id}.mp4';
        } else {
          if (finalLink.startsWith('/')) {
            finalLink = '$baseUrl$finalLink';
          } else if (!finalLink.startsWith('http://') &&
              !finalLink.startsWith('https://')) {
            finalLink = '$baseUrl/$finalLink';
          }
        }

        await showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('مشاركة رابط الفيديو'),
            content: SingleChildScrollView(
              child: SelectableText(finalLink),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('إغلاق'),
              ),
              FilledButton.icon(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: finalLink));
                  if (context.mounted) {
                    Navigator.of(context).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('تم نسخ رابط الفيديو')),
                    );
                    // Try to increment share count
                    try {
                      await provider.shareContent(
                        postId: widget.reel.id,
                        isReel: true,
                      );
                    } catch (e) {
                      debugPrint('Failed to increment share count: $e');
                    }
                  }
                },
                icon: const Icon(Icons.copy),
                label: const Text('نسخ رابط الفيديو'),
              ),
            ],
          ),
        );
      }
    }
  }

  void _recordError(String message, {bool suggestServerFix = false}) {
    setState(() {
      _error = message;
      _isReady = false;
      _suggestServerFix = suggestServerFix;
    });
  }

  Future<void> _openServerSettings() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => const ServerConfigSheet(),
    );
  }

  Widget _buildBackdrop() {
    Widget content;
    if (_isReady && _videoController != null) {
      content = FittedBox(
        fit: BoxFit.cover,
        child: SizedBox(
          width: _videoController!.value.size.width,
          height: _videoController!.value.size.height,
          child: VideoPlayer(_videoController!),
        ),
      );
    } else if (widget.reel.thumbnailUrl.isNotEmpty) {
      content = CachedNetworkImage(
        imageUrl: widget.reel.thumbnailUrl,
        fit: BoxFit.cover,
        placeholder: (context, url) => Container(
          color: Colors.black87,
          child: const Center(
            child: CircularProgressIndicator(color: Colors.white),
          ),
        ),
        errorWidget: (_, __, ___) => Container(
          color: Colors.black87,
          child:
              const Icon(Icons.broken_image, size: 48, color: Colors.white54),
        ),
      );
    } else {
      content = Container(color: Colors.black87);
    }
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        // Toggle playback on tap - pause if playing, play if paused
        if (_isReady && _videoController != null) {
          if (_videoController!.value.isPlaying) {
            _videoController!.pause();
          } else {
            _videoController!.play();
          }
          if (mounted) {
            setState(() {});
          }
        }
      },
      child: Stack(
        fit: StackFit.expand,
        children: [
          content,
          if (_isReady && !_isPlaying)
            Container(
              color: Colors.black.withOpacity(0.3),
              child: const Center(
                child: Icon(
                  Icons.play_circle_filled,
                  size: 80,
                  color: Colors.white70,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _openComments(BuildContext context) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ChangeNotifierProvider.value(
        value: context.read<ContentProvider>(),
        child: CommentsSheet(
          resourceType: 'reel',
          resourceId: widget.reel.id,
          title: widget.reel.title,
        ),
      ),
    );
  }
}

class _ModernActionButton extends StatelessWidget {
  const _ModernActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = Colors.white,
    this.gradient,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;
  final List<Color>? gradient;

  @override
  Widget build(BuildContext context) {
    final button = Container(
      width: 56,
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        gradient: gradient != null
            ? LinearGradient(
                colors: gradient!,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : null,
        color: gradient == null ? Colors.black.withOpacity(0.3) : null,
        shape: BoxShape.circle,
        border: Border.all(
          color: gradient == null
              ? Colors.white.withOpacity(0.3)
              : Colors.transparent,
          width: 1.5,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );

    return GestureDetector(
      onTap: onTap,
      child: button,
    );
  }
}
