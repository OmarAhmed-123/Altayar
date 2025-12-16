import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';

import 'package:altayar/core/networking/api_client.dart';
import 'package:altayar/core/utils/logger.dart';
import 'package:altayar/features/content/data/models/blog_post.dart';
import 'package:altayar/features/content/data/models/comment_model.dart';
import 'package:altayar/features/content/data/models/reel_model.dart';

class ContentApi {
  ContentApi(this._client);

  final ApiClient _client;

  /// Extracts list data from API response
  /// Handles both direct list and paginated response formats
  List<dynamic> _extractListData(dynamic responseData) {
    // If response is already a list, return it
    if (responseData is List) {
      AppLogger.info(
          'Response is a direct list with ${responseData.length} items');
      return responseData;
    }

    // If response is a Map, try to extract the list from common fields
    if (responseData is Map<String, dynamic>) {
      final keys = responseData.keys.toList();
      AppLogger.info('Response is a map with keys: $keys');

      // CRITICAL FIX: The backend might be returning data in the response body
      // but the api_client extracts payload['data'] which might be the entire response
      // Check if the response itself contains the data array directly

      // First, try to find data in common pagination field names
      final possibleFields = [
        'data',
        'blogs',
        'items',
        'results',
        'content',
        'posts',
        'records', // Some APIs use 'records'
      ];

      for (final field in possibleFields) {
        final value = responseData[field];
        if (value is List) {
          if (value.isNotEmpty) {
            AppLogger.info('Found $field field with ${value.length} items');
            return value;
          } else {
            AppLogger.warn('Found $field field but it is empty');
          }
        }
      }

      // If we have count/total, the backend is using pagination
      // The data MUST be somewhere in the response
      if (responseData.containsKey('count') ||
          responseData.containsKey('total')) {
        final count = responseData['count'] ?? responseData['total'] ?? 0;
        AppLogger.info('Response has pagination metadata: count=$count');

        // Try to find any list-like structure (excluding metadata fields)
        final excludedKeys = {
          'count',
          'total',
          'limit',
          'offset',
          'hasMore',
          'filters',
          'page',
          'pages',
          'pagination',
        };

        // Look for any list field that's not in excluded keys
        for (final entry in responseData.entries) {
          final key = entry.key;
          final value = entry.value;

          if (!excludedKeys.contains(key) && value is List) {
            final list = value;
            if (list.isNotEmpty) {
              AppLogger.info(
                  'Found list in "$key" field with ${list.length} items');
              return list;
            }
          }
        }

        // If count > 0 but no list found, log all keys for debugging
        if (count > 0) {
          AppLogger.error(
              'Backend reports count=$count but no data array found in response!');
          AppLogger.error('Available keys: ${keys.join(", ")}');
          final responseStr = responseData.toString();
          AppLogger.error(
              'Response structure: ${responseStr.length > 500 ? responseStr.substring(0, 500) : responseStr}');
        }

        // Return empty list - data is missing from response
        return [];
      }

      // If no pagination metadata, check if response has any list values
      for (final entry in responseData.entries) {
        if (entry.value is List) {
          final list = entry.value as List;
          if (list.isNotEmpty) {
            AppLogger.info(
                'Found list in "${entry.key}" field with ${list.length} items');
            return list;
          }
        }
      }

      // Log the structure for debugging
      AppLogger.warn('Unexpected response structure. Keys: $keys');
      final sample = responseData.toString();
      AppLogger.warn(
          'Response sample: ${sample.length > 500 ? sample.substring(0, 500) : sample}');
    }

    AppLogger.warn(
        'Could not extract list data from response. Type: ${responseData.runtimeType}');
    return [];
  }

  Future<List<BlogPost>> fetchBlogs() async {
    try {
      final result = await _client.get('blogs');
      final rawData = result.data;

      // Debug: Log the raw response structure
      AppLogger.info('Raw API response type: ${rawData.runtimeType}');
      if (rawData is Map<String, dynamic>) {
        AppLogger.info('Raw API response keys: ${rawData.keys.toList()}');
        final sample = rawData.toString();
        AppLogger.info(
            'Raw API response sample: ${sample.length > 500 ? sample.substring(0, 500) : sample}');
      }

      // Extract list from response (handles paginated and direct responses)
      final dataList = _extractListData(rawData);

      AppLogger.info('Fetched ${dataList.length} items from blogs API');

      if (dataList.isEmpty) {
        AppLogger.warn('No blogs data found in response');
        // Try to get the raw response body to see what we're actually receiving
        if (rawData is Map<String, dynamic>) {
          AppLogger.warn('Response map contains: ${rawData.keys.join(", ")}');
          // Check if there's a nested structure we're missing
          for (final key in rawData.keys) {
            final value = rawData[key];
            final valueStr = value.toString();
            AppLogger.warn(
                'Key "$key" type: ${value.runtimeType}, value sample: ${valueStr.length > 100 ? valueStr.substring(0, 100) : valueStr}');
          }
        }
        return [];
      }

      final blogs = dataList
          .whereType<Map<String, dynamic>>()
          .where((item) {
            // Handle both snake_case and camelCase, and string/boolean values
            final isReelValue = item['is_reel'] ?? item['isReel'];
            bool isReel = false;
            if (isReelValue is bool) {
              isReel = isReelValue;
            } else if (isReelValue is String) {
              isReel = isReelValue.toLowerCase() == 'true';
            } else if (isReelValue is int) {
              isReel = isReelValue != 0;
            }
            return !isReel;
          })
          .map((item) {
            try {
              return BlogPost.fromJson(item);
            } catch (e, stackTrace) {
              // Log parsing errors but continue processing other items
              AppLogger.error('Failed to parse blog item', e, stackTrace);
              AppLogger.warn('Problematic item: ${item.keys}');
              return null;
            }
          })
          .whereType<BlogPost>()
          .toList();

      AppLogger.info('Successfully parsed ${blogs.length} blogs');
      return blogs;
    } catch (e, stackTrace) {
      AppLogger.error('Failed to fetch blogs', e, stackTrace);
      rethrow;
    }
  }

  Future<List<ReelModel>> fetchReels() async {
    try {
      final result = await _client.get(
        'blogs',
        queryParams: {'isReel': 'true'},
      );
      final rawData = result.data;

      // Extract list from response (handles paginated and direct responses)
      final dataList = _extractListData(rawData);

      AppLogger.info('Fetched ${dataList.length} items from reels API');

      if (dataList.isEmpty) {
        AppLogger.warn('No reels data found in response');
        return [];
      }

      final reels = dataList
          .whereType<Map<String, dynamic>>()
          .map((item) {
            try {
              return ReelModel.fromJson(item);
            } catch (e, stackTrace) {
              // Log parsing errors but continue processing other items
              AppLogger.error('Failed to parse reel item', e, stackTrace);
              AppLogger.warn('Problematic item: ${item.keys}');
              return null;
            }
          })
          .whereType<ReelModel>()
          .toList();

      AppLogger.info('Successfully parsed ${reels.length} reels');
      return reels;
    } catch (e, stackTrace) {
      AppLogger.error('Failed to fetch reels', e, stackTrace);
      rethrow;
    }
  }

  Future<void> likeContent(int id) {
    return _client.post('blogs/like/$id');
  }

  Future<void> shareContent(int id) {
    return _client.post('blogs/share/$id');
  }

  Future<String> getShareLink(int id, bool isReel) async {
    final response = await _client.get('blogs/$id/share-link');
    final data = response.data as Map<String, dynamic>? ?? {};
    return data['shareLink']?.toString() ??
        data['share_link']?.toString() ??
        data['url']?.toString() ??
        '';
  }

  Future<void> toggleFavorite(int id, bool isReel) async {
    await _client.post('blogs/$id/favorite');
  }

  Future<List<CommentModel>> fetchComments(
    String resourceType,
    int resourceId,
  ) async {
    final response = await _client.get('comments/$resourceType/$resourceId');
    final data = response.data as List<dynamic>? ?? [];
    return data
        .map((item) => CommentModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<CommentModel> postComment({
    required String resourceType,
    required int resourceId,
    required String content,
  }) async {
    final response = await _client.post(
      'comments',
      body: {
        'resourceType': resourceType,
        'resourceId': resourceId,
        'content': content,
      },
    );
    return CommentModel.fromJson(
      response.data as Map<String, dynamic>? ?? {},
    );
  }

  Future<ReelModel> uploadReel({
    required String title,
    required String description,
    required XFile video,
  }) async {
    final file = http.MultipartFile.fromBytes(
      'media',
      await video.readAsBytes(),
      filename: video.name,
      contentType: MediaType('video', video.mimeType?.split('/').last ?? 'mp4'),
    );

    final response = await _client.postMultipart(
      'blogs',
      fields: {
        'title': title,
        'content': description,
        'isReel': 'true',
        'mediaType': 'video',
      },
      files: [file],
    );
    return ReelModel.fromJson(response.data as Map<String, dynamic>? ?? {});
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
    if (image != null) {
      final file = http.MultipartFile.fromBytes(
        'media',
        await image.readAsBytes(),
        filename: image.name,
        contentType:
            MediaType('image', image.mimeType?.split('/').last ?? 'jpg'),
      );

      final response = await _client.postMultipart(
        'blogs',
        fields: {
          'title': title,
          'content': content,
          if (category != null) 'category': category,
          if (destination != null) 'destination': destination,
          if (tags != null && tags.isNotEmpty) 'tags': tags.join(','),
          'isReel': 'false',
          'mediaType': 'image',
        },
        files: [file],
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return BlogPost.fromJson(data['data'] ?? data);
    } else if (mediaUrl != null && mediaUrl.isNotEmpty) {
      final response = await _client.post(
        'blogs',
        body: {
          'title': title,
          'content': content,
          if (category != null) 'category': category,
          if (destination != null) 'destination': destination,
          if (tags != null && tags.isNotEmpty) 'tags': tags.join(','),
          'isReel': false,
          'mediaType': 'image',
          'mediaUrl': mediaUrl,
        },
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return BlogPost.fromJson(data['data'] ?? data);
    } else {
      final response = await _client.post(
        'blogs',
        body: {
          'title': title,
          'content': content,
          if (category != null) 'category': category,
          if (destination != null) 'destination': destination,
          if (tags != null && tags.isNotEmpty) 'tags': tags.join(','),
          'isReel': false,
        },
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return BlogPost.fromJson(data['data'] ?? data);
    }
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
    if (image != null) {
      final file = http.MultipartFile.fromBytes(
        'media',
        await image.readAsBytes(),
        filename: image.name,
        contentType:
            MediaType('image', image.mimeType?.split('/').last ?? 'jpg'),
      );

      final response = await _client.putMultipart(
        'blogs/$id',
        fields: {
          if (title != null) 'title': title,
          if (content != null) 'content': content,
          if (category != null) 'category': category,
          if (destination != null) 'destination': destination,
          if (tags != null && tags.isNotEmpty) 'tags': tags.join(','),
          if (isPublished != null) 'isPublished': isPublished.toString(),
          'mediaType': 'image',
        },
        files: [file],
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return BlogPost.fromJson(data['data'] ?? data);
    } else {
      final response = await _client.put(
        'blogs/$id',
        body: {
          if (title != null) 'title': title,
          if (content != null) 'content': content,
          if (category != null) 'category': category,
          if (destination != null) 'destination': destination,
          if (tags != null && tags.isNotEmpty) 'tags': tags.join(','),
          if (mediaUrl != null) 'mediaUrl': mediaUrl,
          if (isPublished != null) 'isPublished': isPublished,
        },
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return BlogPost.fromJson(data['data'] ?? data);
    }
  }

  Future<void> deleteBlog(int id) async {
    await _client.delete('blogs/$id');
  }
}
