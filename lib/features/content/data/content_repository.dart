import 'package:image_picker/image_picker.dart';

import 'package:altayar/features/content/data/content_api.dart';
import 'package:altayar/features/content/data/models/blog_post.dart';
import 'package:altayar/features/content/data/models/comment_model.dart';
import 'package:altayar/features/content/data/models/reel_model.dart';

class ContentRepository {
  ContentRepository(this._api);

  final ContentApi _api;

  List<BlogPost>? _blogCache;
  List<ReelModel>? _reelCache;
  final Map<String, List<CommentModel>> _commentsCache = {};

  Future<List<BlogPost>> getBlogs({bool force = false}) async {
    if (!force && _blogCache != null) return _blogCache!;
    try {
      final data = await _api.fetchBlogs();
      _blogCache = data;
      return data;
    } catch (e) {
      // Clear cache on error to force refresh next time
      _blogCache = null;
      rethrow;
    }
  }

  Future<List<ReelModel>> getReels({bool force = false}) async {
    if (!force && _reelCache != null) return _reelCache!;
    try {
      final data = await _api.fetchReels();
      _reelCache = data;
      return data;
    } catch (e) {
      // Clear cache on error to force refresh next time
      _reelCache = null;
      rethrow;
    }
  }

  Future<void> likeContent(int id) => _api.likeContent(id);

  Future<void> shareContent(int id) => _api.shareContent(id);

  Future<String> getShareLink(int id, bool isReel) =>
      _api.getShareLink(id, isReel);

  Future<void> toggleFavorite(int id, bool isReel) =>
      _api.toggleFavorite(id, isReel);

  Future<List<CommentModel>> getComments({
    required String resourceType,
    required int resourceId,
    bool force = false,
  }) async {
    final key = _cacheKey(resourceType, resourceId);
    if (!force && _commentsCache.containsKey(key)) {
      return _commentsCache[key]!;
    }
    final data = await _api.fetchComments(resourceType, resourceId);
    _commentsCache[key] = data;
    return data;
  }

  Future<CommentModel> addComment({
    required String resourceType,
    required int resourceId,
    required String content,
  }) async {
    final comment = await _api.postComment(
      resourceType: resourceType,
      resourceId: resourceId,
      content: content,
    );
    final key = _cacheKey(resourceType, resourceId);
    final existing = _commentsCache[key] ?? [];
    _commentsCache[key] = [comment, ...existing];
    return comment;
  }

  Future<ReelModel> uploadReel({
    required String title,
    required String description,
    required XFile video,
  }) {
    return _api.uploadReel(
      title: title,
      description: description,
      video: video,
    );
  }

  Future<BlogPost> createBlog({
    required String title,
    required String content,
    String? category,
    String? destination,
    List<String>? tags,
    XFile? image,
    String? mediaUrl,
  }) async {
    final blog = await _api.createBlog(
      title: title,
      content: content,
      category: category,
      destination: destination,
      tags: tags,
      image: image,
      mediaUrl: mediaUrl,
    );
    // Invalidate cache to force refresh
    _blogCache = null;
    return blog;
  }

  Future<BlogPost> updateBlog({
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
    final blog = await _api.updateBlog(
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
    // Invalidate cache to force refresh
    _blogCache = null;
    return blog;
  }

  Future<void> deleteBlog(int id) async {
    await _api.deleteBlog(id);
    // Remove from cache if exists
    if (_blogCache != null) {
      _blogCache = _blogCache!.where((blog) => blog.id != id).toList();
    }
  }

  String _cacheKey(String type, int id) => '$type-$id';
}
