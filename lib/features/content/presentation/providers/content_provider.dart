import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import 'package:altayar/core/utils/logger.dart';
import 'package:altayar/features/content/data/content_repository.dart';
import 'package:altayar/features/content/data/models/blog_post.dart';
import 'package:altayar/features/content/data/models/comment_model.dart';
import 'package:altayar/features/content/data/models/reel_model.dart';

class ContentProvider extends ChangeNotifier {
  ContentProvider(this._repository);

  final ContentRepository _repository;

  List<BlogPost> blogs = [];
  List<ReelModel> reels = [];
  bool isLoadingBlogs = false;
  bool isLoadingReels = false;
  bool isSharing = false;
  bool isCommenting = false;
  bool isUploadingReel = false;
  String? errorMessage;

  Future<void> loadBlogs({bool refresh = false}) async {
    isLoadingBlogs = true;
    errorMessage = null;
    notifyListeners();
    try {
      final loadedBlogs = await _repository.getBlogs(force: refresh);
      blogs = loadedBlogs;
      AppLogger.info('Loaded ${blogs.length} blogs');
      errorMessage = null;
    } catch (error, stackTrace) {
      final errorMsg = error.toString();
      errorMessage = errorMsg.contains('Exception')
          ? 'حدث خطأ أثناء تحميل المقالات. يرجى المحاولة مرة أخرى.'
          : errorMsg;
      AppLogger.error('Blogs load failed', error, stackTrace);
      // Keep existing blogs if available, don't clear them on error
    } finally {
      isLoadingBlogs = false;
      notifyListeners();
    }
  }

  Future<void> loadReels({bool refresh = false}) async {
    isLoadingReels = true;
    errorMessage = null;
    notifyListeners();
    try {
      final loadedReels = await _repository.getReels(force: refresh);
      reels = loadedReels;
      AppLogger.info('Loaded ${reels.length} reels');
      errorMessage = null;
    } catch (error, stackTrace) {
      final errorMsg = error.toString();
      errorMessage = errorMsg.contains('Exception')
          ? 'حدث خطأ أثناء تحميل الريلز. يرجى المحاولة مرة أخرى.'
          : errorMsg;
      AppLogger.error('Reels load failed', error, stackTrace);
      // Keep existing reels if available, don't clear them on error
    } finally {
      isLoadingReels = false;
      notifyListeners();
    }
  }

  Future<void> toggleLike({
    required int postId,
    required bool isReel,
  }) async {
    try {
      await _repository.likeContent(postId);
      if (isReel) {
        reels = reels
            .map(
              (reel) => reel.id == postId
                  ? reel.copyWith(
                      isLiked: !reel.isLiked,
                      likesCount: reel.isLiked
                          ? (reel.likesCount - 1).clamp(0, 1 << 31)
                          : reel.likesCount + 1,
                    )
                  : reel,
            )
            .toList();
      } else {
        blogs = blogs
            .map(
              (blog) => blog.id == postId
                  ? blog.copyWith(
                      isLiked: !blog.isLiked,
                      likesCount: blog.isLiked
                          ? (blog.likesCount - 1).clamp(0, 1 << 31)
                          : blog.likesCount + 1,
                    )
                  : blog,
            )
            .toList();
      }
      notifyListeners();
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
    }
  }

  Future<void> shareContent({
    required int postId,
    required bool isReel,
  }) async {
    try {
      isSharing = true;
      notifyListeners();

      // Get share link first
      final shareLink = await _repository.getShareLink(postId, isReel);

      // Share the link
      if (shareLink.isNotEmpty) {
        // Use url_launcher or share functionality
        // For now, we'll just increment the count
        await _repository.shareContent(postId);
      } else {
        // Fallback: just increment share count
        await _repository.shareContent(postId);
      }

      if (isReel) {
        reels = reels
            .map((reel) => reel.id == postId
                ? reel.copyWith(shareCount: reel.shareCount + 1)
                : reel)
            .toList();
      } else {
        blogs = blogs
            .map((blog) => blog.id == postId
                ? blog.copyWith(shareCount: blog.shareCount + 1)
                : blog)
            .toList();
      }
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isSharing = false;
      notifyListeners();
    }
  }

  Future<void> toggleFavorite({
    required int postId,
    required bool isReel,
  }) async {
    try {
      await _repository.toggleFavorite(postId, isReel);
      if (isReel) {
        reels = reels
            .map(
              (reel) => reel.id == postId
                  ? reel.copyWith(isFavorite: !reel.isFavorite)
                  : reel,
            )
            .toList();
      }
      notifyListeners();
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
    }
  }

  Future<String> getShareLink({
    required int postId,
    required bool isReel,
  }) async {
    try {
      return await _repository.getShareLink(postId, isReel);
    } catch (error) {
      errorMessage = error.toString();
      return '';
    }
  }

  Future<List<CommentModel>> fetchComments({
    required String resourceType,
    required int resourceId,
    bool refresh = false,
  }) {
    return _repository.getComments(
      resourceType: resourceType,
      resourceId: resourceId,
      force: refresh,
    );
  }

  Future<CommentModel?> addComment({
    required String resourceType,
    required int resourceId,
    required String content,
  }) async {
    try {
      isCommenting = true;
      notifyListeners();
      final comment = await _repository.addComment(
        resourceType: resourceType,
        resourceId: resourceId,
        content: content,
      );
      if (resourceType == 'blog') {
        blogs = blogs
            .map((blog) => blog.id == resourceId
                ? blog.copyWith(commentsCount: blog.commentsCount + 1)
                : blog)
            .toList();
      } else if (resourceType == 'reel') {
        reels = reels
            .map((reel) => reel.id == resourceId
                ? reel.copyWith(commentsCount: reel.commentsCount + 1)
                : reel)
            .toList();
      }
      notifyListeners();
      return comment;
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
      return null;
    } finally {
      isCommenting = false;
      notifyListeners();
    }
  }

  Future<bool> uploadReel({
    required String title,
    required String description,
    required XFile video,
  }) async {
    try {
      isUploadingReel = true;
      notifyListeners();
      final reel = await _repository.uploadReel(
        title: title,
        description: description,
        video: video,
      );
      reels = [reel, ...reels];
      await loadReels(refresh: true);
      errorMessage = null;
      return true;
    } catch (error, stackTrace) {
      errorMessage = error.toString();
      AppLogger.error('Reel upload failed', error, stackTrace);
      return false;
    } finally {
      isUploadingReel = false;
      notifyListeners();
    }
  }

  Future<bool> createBlog({
    required String title,
    required String content,
    String? category,
    String? destination,
    List<String>? tags,
    XFile? image,
    String? mediaUrl,
  }) async {
    try {
      isLoadingBlogs = true;
      errorMessage = null;
      notifyListeners();
      await _repository.createBlog(
        title: title,
        content: content,
        category: category,
        destination: destination,
        tags: tags,
        image: image,
        mediaUrl: mediaUrl,
      );
      await loadBlogs(refresh: true);
      errorMessage = null;
      return true;
    } catch (error, stackTrace) {
      errorMessage = error.toString();
      AppLogger.error('Blog creation failed', error, stackTrace);
      return false;
    } finally {
      isLoadingBlogs = false;
      notifyListeners();
    }
  }

  Future<bool> updateBlog({
    required int id,
    String? title,
    String? content,
    String? category,
    String? destination,
    List<String>? tags,
    XFile? image,
    String? mediaUrl,
    bool? isPublished,
  }) async {
    try {
      isLoadingBlogs = true;
      errorMessage = null;
      notifyListeners();
      await _repository.updateBlog(
        id: id,
        title: title,
        content: content,
        category: category,
        destination: destination,
        tags: tags,
        image: image,
        mediaUrl: mediaUrl,
        isPublished: isPublished,
      );
      await loadBlogs(refresh: true);
      errorMessage = null;
      return true;
    } catch (error, stackTrace) {
      errorMessage = error.toString();
      AppLogger.error('Blog update failed', error, stackTrace);
      return false;
    } finally {
      isLoadingBlogs = false;
      notifyListeners();
    }
  }

  Future<bool> deleteBlog(int id) async {
    try {
      isLoadingBlogs = true;
      errorMessage = null;
      notifyListeners();
      await _repository.deleteBlog(id);
      blogs = blogs.where((blog) => blog.id != id).toList();
      await loadBlogs(refresh: true);
      errorMessage = null;
      return true;
    } catch (error, stackTrace) {
      errorMessage = error.toString();
      AppLogger.error('Blog deletion failed', error, stackTrace);
      return false;
    } finally {
      isLoadingBlogs = false;
      notifyListeners();
    }
  }
}
