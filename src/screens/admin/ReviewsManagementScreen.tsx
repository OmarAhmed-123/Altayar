import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { reviewService } from './../../services/reviewService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

interface Review {
  id: number;
  userId: number;
  packageId: number;
  rating: number;
  comment: string;
  is_verified?: boolean;
  is_featured?: boolean;
  created_at?: string;
  user?: {
    name: string;
    email: string;
  };
  package?: {
    title: string;
  };
}

export const ReviewsManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(theme), [theme]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'featured'>('all');

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reviewService.getAllReviews();
      const reviewsData = response.data || response || [];
      let filteredReviews = Array.isArray(reviewsData) ? reviewsData : [];

      if (filter === 'verified') {
        filteredReviews = filteredReviews.filter((r: Review) => r.is_verified);
      } else if (filter === 'unverified') {
        filteredReviews = filteredReviews.filter((r: Review) => !r.is_verified);
      } else if (filter === 'featured') {
        filteredReviews = filteredReviews.filter((r: Review) => r.is_featured);
      }

      setReviews(filteredReviews);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل التقييمات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  const loadStatistics = useCallback(async () => {
    try {
      const response = await reviewService.getReviewStatistics();
      setStatistics(response.data || response);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const handleVerifyReview = async (reviewId: number) => {
    try {
      await reviewService.verifyReview(reviewId.toString());
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم التحقق من التقييم بنجاح',
      });
      loadReviews();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل التحقق من التقييم',
      });
    }
  };

  const handleFeatureReview = async (reviewId: number, isFeatured: boolean) => {
    try {
      await reviewService.featureReview(reviewId.toString());
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: isFeatured ? 'تم إبراز التقييم بنجاح' : 'تم إلغاء إبراز التقييم بنجاح',
      });
      loadReviews();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحديث التقييم',
      });
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <SafeIcon
        key={index}
        name={index < rating ? 'star' : 'star-border'}
        size={16}
        color={index < rating ? '#FFD700' : theme.colors.textSecondary}
      />
    ));
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={[styles.reviewCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewInfo}>
          <Text style={[styles.reviewUser, { color: theme.colors.text }]}>
            {item.user?.name || 'مستخدم'}
          </Text>
          {item.package && (
            <Text style={[styles.reviewPackage, { color: theme.colors.textSecondary }]}>
              {item.package.title}
            </Text>
          )}
          <View style={styles.ratingContainer}>
            {renderStars(item.rating)}
          </View>
        </View>
        <View style={styles.badges}>
          {item.is_verified && (
            <View style={[styles.badge, { backgroundColor: theme.colors.success + '20' }]}>
              <Text style={[styles.badgeText, { color: theme.colors.success }]}>متحقق</Text>
            </View>
          )}
          {item.is_featured && (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: theme.colors.primary }]}>مميز</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={[styles.reviewComment, { color: theme.colors.text }]}>{item.comment}</Text>

      <View style={styles.actions}>
        {!item.is_verified && (
          <TouchableOpacity
            style={[styles.actionButton, dynamicStyles.successActionButton]}
            onPress={() => handleVerifyReview(item.id)}
          >
            <SafeIcon name="verified" size={18} color={theme.colors.success} />
            <Text style={[styles.actionText, dynamicStyles.successActionText]}>تحقق</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.is_featured ? dynamicStyles.primaryActionButton : dynamicStyles.neutralActionButton,
          ]}
          onPress={() => handleFeatureReview(item.id, !item.is_featured)}
        >
          <SafeIcon
            name={item.is_featured ? 'star' : 'star-border'}
            size={18}
            color={item.is_featured ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.actionText,
                item.is_featured
                  ? dynamicStyles.primaryActionText
                  : dynamicStyles.neutralActionText,
            ]}
          >
            {item.is_featured ? 'إلغاء التميز' : 'تمييز'}
          </Text>
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة التقييمات</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {reviews.length} تقييم
        </Text>
      </View>

      {statistics && (
        <View style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>إجمالي التقييمات</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {statistics.totalReviews || 0}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>متوسط التقييم</Text>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {statistics.averageRating ? statistics.averageRating.toFixed(1) : '0.0'} ⭐
            </Text>
          </View>
        </View>
      )}

      <View style={styles.filterContainer}>
        {(['all', 'verified', 'unverified', 'featured'] as const).map((key) => {
          const isActive = filter === key;
          const label =
            key === 'all'
              ? 'الكل'
              : key === 'verified'
              ? 'متحقق'
              : key === 'unverified'
              ? 'غير متحقق'
              : 'مميز';
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterButton,
                isActive ? dynamicStyles.filterButtonActive : null,
              ]}
              onPress={() => setFilter(key)}
            >
              <Text
                style={[
                  styles.filterText,
                  isActive
                    ? dynamicStyles.filterTextActive
                    : dynamicStyles.filterTextInactive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadReviews();
            }}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="star-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد تقييمات
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
  statsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
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
  reviewCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewUser: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewPackage: {
    fontSize: 12,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
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
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
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
  },
});

const createDynamicStyles = (theme: any) =>
  StyleSheet.create({
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    filterTextActive: {
      color: '#FFFFFF',
    },
    filterTextInactive: {
      color: theme.colors.text,
    },
    successActionButton: {
      backgroundColor: `${theme.colors.success}20`,
    },
    successActionText: {
      color: theme.colors.success,
    },
    primaryActionButton: {
      backgroundColor: `${theme.colors.primary}20`,
    },
    primaryActionText: {
      color: theme.colors.primary,
    },
    neutralActionButton: {
      backgroundColor: '#F5F5F5',
    },
    neutralActionText: {
      color: theme.colors.textSecondary,
    },
  });

