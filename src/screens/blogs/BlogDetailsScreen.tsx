import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { blogService } from '../../services/blogService';
import { commentService } from '../../services/commentService';
import { useTheme } from '../../hooks/useTheme';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ensureStringUri } from '../../utils/imageUriHelper';
import { buildImageUrl } from '../../utils/imageUrlBuilder';
import { SafeIcon } from '../../utils/iconHelper';
import Toast from 'react-native-toast-message';

const formatCompactNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

export const BlogDetailsScreen: React.FC = () => {
  const route = useRoute();
  const { theme } = useTheme();
  const { blogId } = route.params as any;
  const [blog, setBlog] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');

  const tagsList = useMemo(() => {
    const source = blog?.tags;
    if (!source) {
      return [];
    }
    if (Array.isArray(source)) {
      return source;
    }
    if (typeof source === 'string') {
      try {
        const parsed = JSON.parse(source);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        // fall through to splitting by comma
      }
      return source
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
    }
    return [];
  }, [blog?.tags]);

  const viewCount = Number(blog?.viewsCount ?? blog?.views_count ?? blog?.views ?? 0);
  const destinationLabel = blog?.destination ? blog.destination.toString() : '';

  const loadBlogDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await blogService.getBlogById(blogId);
      const blogData = response.data || response;
      const normalizedBlog = blogData.blog ?? blogData;
      setBlog(normalizedBlog);
      if (Array.isArray(blogData.comments)) {
        setComments(blogData.comments);
      }
    } catch (error: any) {
      console.error('Error loading blog:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل تحميل المدونة',
      });
    } finally {
      setIsLoading(false);
    }
  }, [blogId]);

  const loadComments = useCallback(async () => {
    try {
      const response = await commentService.getCommentsByResource('Blog', blogId);
      const commentsData = Array.isArray(response) ? response : (response.data || []);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }, [blogId]);

  useEffect(() => {
    loadBlogDetails();
    loadComments();
  }, [loadBlogDetails, loadComments]);

  const handleLike = async () => {
    try {
      await blogService.likeBlog(blogId);
      setBlog({ ...blog, likes: (blog.likes || 0) + 1, isLiked: true });
    } catch (error: any) {
      console.error('Error liking blog:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل في الإعجاب بالمدونة',
      });
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      await commentService.addComment({
        resourceType: 'Blog',
        resourceId: blogId,
        content: commentText,
      });
      setCommentText('');
      loadComments();
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم إضافة التعليق بنجاح',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل إضافة التعليق',
      });
      console.error('Error adding comment:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!blog) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>المدونة غير موجودة</Text>
      </View>
    );
  }

  const rawImageUri = ensureStringUri(blog.mediaUrl || blog.imageUrl, 'https://via.placeholder.com/400x300');
  const imageUri = rawImageUri ? (buildImageUrl(rawImageUri) || rawImageUri) : 'https://via.placeholder.com/400x300';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.scrollView}>
        <Image source={{ uri: imageUri }} style={styles.blogImage} resizeMode="cover" />
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{blog.title}</Text>
          <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
            {blog.created_at ? new Date(blog.created_at).toLocaleDateString('ar-EG') : ''}
          </Text>
          {destinationLabel ? (
            <Text style={[styles.destination, { color: theme.colors.textSecondary }]}>
              الوجهة: {destinationLabel}
            </Text>
          ) : null}
          {tagsList.length > 0 && (
            <View style={styles.tagsContainer}>
              {tagsList.map(tag => (
                <View key={tag} style={[styles.tagChip, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.tagChipText, { color: theme.colors.text }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[styles.body, { color: theme.colors.text }]}>{blog.content || blog.description}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
              <SafeIcon
                name={blog.isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={blog.isLiked ? theme.colors.error : theme.colors.textSecondary}
              />
              <Text style={[styles.likeCount, { color: theme.colors.textSecondary }]}>
                {blog.likes || 0}
              </Text>
            </TouchableOpacity>
            <View style={styles.viewsBadge}>
              <SafeIcon name="visibility" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.viewsText, { color: theme.colors.textSecondary }]}>
                {formatCompactNumber(viewCount)} مشاهدة
              </Text>
            </View>
          </View>

          <View style={styles.commentsSection}>
            <Text style={[styles.commentsTitle, { color: theme.colors.text }]}>التعليقات</Text>
            {comments.map((comment) => (
              <View key={comment.id} style={[styles.commentItem, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.commentText, { color: theme.colors.text }]}>{comment.content}</Text>
                <Text style={[styles.commentDate, { color: theme.colors.textSecondary }]}>
                  {comment.created_at ? new Date(comment.created_at).toLocaleDateString('ar-EG') : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.commentInputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <TextInput
          style={[styles.commentInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="أضف تعليقاً..."
          placeholderTextColor={theme.colors.textSecondary}
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddComment}
        >
          <SafeIcon name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  blogImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    marginBottom: 16,
  },
  destination: {
    fontSize: 13,
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'center',
    gap: 16,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  likeCount: {
    fontSize: 16,
    marginLeft: 4,
  },
  viewsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewsText: {
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentsSection: {
    marginTop: 24,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  commentItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});

