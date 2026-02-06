import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { commentService } from './../../services/commentService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

interface Comment {
  id: number;
  user_id: number;
  resource_type: string;
  resource_id: number;
  content: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export const CommentsManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'blog' | 'package'>('all');

  const filterStyles = useMemo(
    () => ({
      activeButton: { backgroundColor: theme.colors.primary },
      activeText: { color: '#FFFFFF' },
      inactiveText: { color: theme.colors.text },
    }),
    [theme.colors.primary, theme.colors.text],
  );

  useEffect(() => {
    loadComments();
  }, [filter]);

  const loadComments = async () => {
    try {
      setLoading(true);
      // Note: Backend doesn't have a "get all comments" endpoint
      // This would need to be added to the backend or we fetch from blogs/packages
      // For now, we'll show a message that this needs backend support
      setComments([]);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل التعليقات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    Alert.alert(
      'حذف التعليق',
      'هل أنت متأكد من حذف هذا التعليق?',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await commentService.deleteComment(commentId.toString());
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم حذف التعليق بنجاح',
              });
              loadComments();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || 'فشل حذف التعليق',
              });
            }
          },
        },
      ]
    );
  };

  const getResourceTypeName = (type: string) => {
    const types: Record<string, string> = {
      Blog: 'مدونة',
      Package: 'حزمة',
    };
    return types[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderCommentItem = ({ item }: { item: Comment }) => (
    <View style={[styles.commentCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.commentHeader}>
        <View style={styles.commentInfo}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {item.user?.name || 'مستخدم'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
            {item.user?.email || ''}
          </Text>
        </View>
        <View style={[styles.resourceBadge, { backgroundColor: theme.colors.primary + '20' }]}>
          <Text style={[styles.resourceText, { color: theme.colors.primary }]}>
            {getResourceTypeName(item.resource_type)}
          </Text>
        </View>
      </View>

      <Text style={[styles.commentContent, { color: theme.colors.text }]}>{item.content}</Text>

      <View style={styles.commentFooter}>
        <Text style={[styles.commentDate, { color: theme.colors.textSecondary }]}>
          {formatDate(item.created_at)}
        </Text>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.colors.error + '20' }]}
          onPress={() => handleDeleteComment(item.id)}
        >
          <SafeIcon name="delete" size={18} color={theme.colors.error} />
          <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>حذف</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة التعليقات</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {comments.length} تعليق
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && filterStyles.activeButton,
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' ? filterStyles.activeText : filterStyles.inactiveText,
            ]}
          >
            الكل
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'blog' && filterStyles.activeButton,
          ]}
          onPress={() => setFilter('blog')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'blog' ? filterStyles.activeText : filterStyles.inactiveText,
            ]}
          >
            المدونات
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'package' && filterStyles.activeButton,
          ]}
          onPress={() => setFilter('package')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'package' ? filterStyles.activeText : filterStyles.inactiveText,
            ]}
          >
            الحزم
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={comments}
        renderItem={renderCommentItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadComments();
            }}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="comment-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد تعليقات
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              ملاحظة: هذه الميزة تحتاج إلى endpoint في الباك اند لجلب جميع التعليقات
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  commentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  commentInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
  },
  resourceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resourceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  commentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentDate: {
    fontSize: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

