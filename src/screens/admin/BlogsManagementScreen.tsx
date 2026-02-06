import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { blogService } from './../../services/blogService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

const BLOG_EDIT_COLOR = '#2196F3';
const BLOG_EDIT_BACKGROUND = `${BLOG_EDIT_COLOR}20`;

interface Blog {
  id: number;
  title: string;
  content: string;
  authorId?: number;
  imageUrl?: string;
  likes?: number;
  views?: number;
  views_count?: number;
  viewsCount?: number;
  isPublished?: boolean;
  created_at?: string;
  category?: string;
  destination?: string;
  tags?: string[] | string;
}

export const BlogsManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    category: 'general',
    destination: '',
    tags: '',
    isPublished: true,
  });

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const response = await blogService.getBlogs();
      const blogsData = response.data || response || [];
      setBlogs(Array.isArray(blogsData) ? blogsData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل المدونات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateBlog = async () => {
    if (!formData.title || !formData.content) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      const tagsList =
        formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean) || [];

      const blogData = {
        title: formData.title,
        content: formData.content,
        imageUrl: formData.imageUrl || undefined,
        category: formData.category || undefined,
        destination: formData.destination || undefined,
        tags: tagsList.length ? tagsList : undefined,
        isPublished: formData.isPublished,
      };

      if (editingBlog) {
        // Update blog - need to check if API supports update
        Toast.show({
          type: 'info',
          text1: 'ملاحظة',
          text2: 'تحديث المدونة يحتاج إلى endpoint في الباك اند',
        });
      } else {
        await blogService.createBlog(blogData);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم إنشاء المدونة بنجاح',
        });
      }
      setShowCreateModal(false);
      setEditingBlog(null);
      resetForm();
      loadBlogs();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل حفظ المدونة',
      });
    }
  };

  const handleDeleteBlog = async (blogId: number, blogTitle: string) => {
    Alert.alert(
      'حذف المدونة',
      `هل أنت متأكد من حذف المدونة "${blogTitle}"?`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete blog - need to check if API supports delete
              Toast.show({
                type: 'info',
                text1: 'ملاحظة',
                text2: 'حذف المدونة يحتاج إلى endpoint في الباك اند',
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || 'فشل حذف المدونة',
              });
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      imageUrl: '',
      category: 'general',
      destination: '',
      tags: '',
      isPublished: true,
    });
  };

  const openEditModal = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      imageUrl: blog.imageUrl || '',
      category: blog.category || 'general',
      destination: blog.destination || '',
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : (blog.tags as string) || '',
      isPublished: blog.isPublished !== false,
    });
    setShowCreateModal(true);
  };

  const renderBlogItem = ({ item }: { item: Blog }) => {
    const viewCount = item.viewsCount ?? item.views_count ?? item.views;
    const tagsList = Array.isArray(item.tags)
      ? item.tags
      : typeof item.tags === 'string'
        ? item.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

    return (
      <View style={[styles.blogCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.blogHeader}>
          <View style={styles.blogInfo}>
            <Text style={[styles.blogTitle, { color: theme.colors.text }]}>{item.title}</Text>
            <Text style={[styles.blogContent, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {item.content}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.isPublished ? theme.colors.success + '20' : theme.colors.error + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: item.isPublished ? theme.colors.success : theme.colors.error },
              ]}
            >
              {item.isPublished ? 'منشور' : 'مسودة'}
            </Text>
          </View>
        </View>

        <View style={styles.blogStats}>
          {item.likes !== undefined && (
            <View style={styles.statItem}>
              <SafeIcon name="favorite" size={16} color={theme.colors.error} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                {item.likes}
              </Text>
            </View>
          )}
          {viewCount !== undefined && (
            <View style={styles.statItem}>
              <SafeIcon name="visibility" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                {viewCount}
              </Text>
            </View>
          )}
        </View>

        {item.destination ? (
          <Text style={[styles.destinationLabel, { color: theme.colors.textSecondary }]}>
            الوجهة: {item.destination}
          </Text>
        ) : null}

        {tagsList.length > 0 && (
          <View style={styles.tagRow}>
            {tagsList.map(tag => (
              <View key={`${item.id}-${tag}`} style={[styles.tagChip, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.tagText, { color: theme.colors.text }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: BLOG_EDIT_BACKGROUND }]}
            onPress={() => openEditModal(item)}
          >
            <SafeIcon name="edit" size={20} color={BLOG_EDIT_COLOR} />
            <Text style={[styles.actionText, { color: BLOG_EDIT_COLOR }]}>تعديل</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.error + '20' }]}
            onPress={() => handleDeleteBlog(item.id, item.title)}
          >
            <SafeIcon name="delete" size={20} color={theme.colors.error} />
            <Text style={[styles.actionText, { color: theme.colors.error }]}>حذف</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة المدونات</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {blogs.length} مدونة
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          resetForm();
          setEditingBlog(null);
          setShowCreateModal(true);
        }}
      >
        <SafeIcon name="add" size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>مدونة جديدة</Text>
      </TouchableOpacity>

      <FlatList
        data={blogs}
        renderItem={renderBlogItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadBlogs();
            }}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="article" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد مدونات
            </Text>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowCreateModal(false);
          setEditingBlog(null);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingBlog ? 'تعديل المدونة' : 'مدونة جديدة'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setEditingBlog(null);
                  resetForm();
                }}
              >
                <SafeIcon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>العنوان *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="عنوان المدونة"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>المحتوى *</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: theme.colors.background, color: theme.colors.text },
                  ]}
                  value={formData.content}
                  onChangeText={(text) => setFormData({ ...formData, content: text })}
                  placeholder="محتوى المدونة"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={8}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>رابط الصورة</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.imageUrl}
                  onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>التصنيف</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.category}
                  onChangeText={(text) => setFormData({ ...formData, category: text })}
                  placeholder="مثال: travel-news"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>الوجهة</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.destination}
                  onChangeText={(text) => setFormData({ ...formData, destination: text })}
                  placeholder="مثال: دبي"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>الوسوم (مفصولة بفواصل)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.tags}
                  onChangeText={(text) => setFormData({ ...formData, tags: text })}
                  placeholder="فاخر, عائلة, عروض"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleCreateBlog}
              >
                <Text style={styles.submitButtonText}>{editingBlog ? 'تحديث' : 'إنشاء'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  blogCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  blogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  blogInfo: {
    flex: 1,
  },
  blogTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  blogContent: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  blogStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  destinationLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagChip: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    maxHeight: 500,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

