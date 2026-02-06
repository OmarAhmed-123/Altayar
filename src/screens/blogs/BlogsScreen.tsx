import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { blogService, type BlogQueryParams } from '../../services/blogService';
import { useTheme } from '../../hooks/useTheme';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ExpressiveEmptyState } from '../../components/common/ExpressiveEmptyState';
import { ensureStringUri } from '../../utils/imageUriHelper';
import { buildImageUrl } from '../../utils/imageUrlBuilder';
import { SafeIcon } from '../../utils/iconHelper';
import Toast from 'react-native-toast-message';

const CATEGORY_FILTERS = [
  { label: 'الكل', value: 'all' },
  { label: 'أخبار', value: 'news' },
  { label: 'مغامرات', value: 'adventures' },
  { label: 'عائلي', value: 'family' },
  { label: 'فاخر', value: 'luxury' },
];

const DESTINATION_FILTERS = [
  { label: 'جميع الوجهات', value: 'all' },
  { label: 'دبي', value: 'Dubai' },
  { label: 'القاهرة', value: 'Cairo' },
  { label: 'الرياض', value: 'Riyadh' },
  { label: 'باريس', value: 'Paris' },
];

const formatCompactNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

export const BlogsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDestination, setSelectedDestination] = useState('all');

  const loadBlogs = useCallback(async () => {
    try {
      if (!refreshing) {
        setIsLoading(true);
      }
      const params: BlogQueryParams = {};
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (selectedDestination !== 'all') {
        params.destination = selectedDestination;
      }

      const response = await blogService.getBlogs(params);
      const blogsData = Array.isArray(response) ? response : (response.data || []);
      setBlogs(blogsData);
    } catch (error: any) {
      console.error('Error loading blogs:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.response?.data?.message || 'فشل تحميل المدونات',
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, searchQuery, selectedCategory, selectedDestination]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBlogs();
  };

  const handleLike = async (blogId: string) => {
    try {
      await blogService.likeBlog(blogId);
      // Update local state
      setBlogs(prevBlogs =>
        prevBlogs.map(blog =>
        blog.id === blogId 
          ? { ...blog, likes: (blog.likes || 0) + 1, isLiked: true }
          : blog
        ),
      );
    } catch (error: any) {
      console.error('Error liking blog:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل في الإعجاب بالمدونة',
      });
    }
  };

  const renderFilters = () => (
    <View style={styles.filtersSection}>
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <SafeIcon name="search" size={18} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="ابحث عن مقال أو ريل..."
          placeholderTextColor={theme.colors.textSecondary}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {CATEGORY_FILTERS.map(filter => {
          const isActive = selectedCategory === filter.value;
          return (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(filter.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? '#FFFFFF' : theme.colors.text },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {DESTINATION_FILTERS.map(filter => {
          const isActive = selectedDestination === filter.value;
          return (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? theme.colors.success : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setSelectedDestination(filter.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? '#FFFFFF' : theme.colors.text },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderBlogCard = ({ item }: { item: any }) => {
    const rawImageUri = ensureStringUri(
      item.mediaUrl || item.imageUrl,
      'https://via.placeholder.com/400x300'
    );
    const imageUri = rawImageUri ? (buildImageUrl(rawImageUri) || rawImageUri) : 'https://via.placeholder.com/400x300';
    const viewCount = Number(item.viewsCount ?? item.views_count ?? item.views ?? 0);

    const categoryLabel = item.category ? item.category.toString() : '';
    const destinationLabel = item.destination ? item.destination.toString() : '';

    return (
      <TouchableOpacity
        style={[styles.blogCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => {
          const nav = navigation as any;
          nav.navigate('BlogDetails', { blogId: item.id });
        }}
      >
        {item.mediaType === 'video' || item.isReel ? (
          <View style={styles.mediaContainer}>
            <Image source={{ uri: imageUri }} style={styles.blogImage} resizeMode="cover" />
            <View style={styles.playIcon}>
              <SafeIcon name="play-circle" size={40} color={theme.colors.primary} />
            </View>
          </View>
        ) : (
          <Image source={{ uri: imageUri }} style={styles.blogImage} resizeMode="cover" />
        )}
        <View style={styles.blogContent}>
          <Text style={[styles.blogTitle, { color: theme.colors.text }]} numberOfLines={2}>
            {item.title || 'عنوان المدونة'}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <SafeIcon name="visibility" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                {formatCompactNumber(viewCount)} مشاهدة
              </Text>
            </View>
            {categoryLabel ? (
              <View style={[styles.categoryPill, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={[styles.categoryText, { color: theme.colors.primary }]}>
                  {categoryLabel}
                </Text>
              </View>
            ) : null}
          </View>
          {destinationLabel ? (
            <Text style={[styles.destinationText, { color: theme.colors.textSecondary }]}>
              {destinationLabel}
            </Text>
          ) : null}
          <Text style={[styles.blogDescription, { color: theme.colors.textSecondary }]} numberOfLines={3}>
            {item.content || item.description || ''}
          </Text>
          <View style={styles.blogFooter}>
            <TouchableOpacity
              style={styles.likeButton}
              onPress={() => handleLike(item.id.toString())}
            >
              <SafeIcon
                name={item.isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={item.isLiked ? theme.colors.error : theme.colors.textSecondary}
              />
              <Text style={[styles.likeCount, { color: theme.colors.textSecondary }]}>
                {item.likes || 0}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.blogDate, { color: theme.colors.textSecondary }]}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={blogs}
        renderItem={renderBlogCard}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderFilters}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyStateWrapper}>
              <ExpressiveEmptyState
                title="لا توجد مدونات"
                message="جرّب تعديل البحث أو التصنيفات"
                iconName="document-text"
              />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  blogCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mediaContainer: {
    position: 'relative',
  },
  blogImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  blogContent: {
    padding: 16,
  },
  blogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filtersSection: {
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  categoryPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  destinationText: {
    fontSize: 12,
    marginBottom: 4,
  },
  blogDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  blogFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    fontSize: 14,
  },
  blogDate: {
    fontSize: 12,
  },
  emptyStateWrapper: {
    paddingVertical: 32,
  },
});

