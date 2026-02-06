import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { AnimatedCard } from './../../components/animations/AnimatedCard';
import { ExpressiveEmptyState } from './../../components/common/ExpressiveEmptyState';
import { reviewService } from './../../services/reviewService';
// Mock data removed - using real backend data only
import { Review } from './../../types';
import { SafeIcon } from './../../utils/iconHelper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Icon = MaterialIcons;

export const ReviewsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      // Use real backend API
      const response = await reviewService.getMyReviews();
      // Transform backend review data to frontend format
      const transformedReviews: Review[] = Array.isArray(response) ? response.map(review => ({
        ...review,
        packageId: review.package_id?.toString() || review.packageId || '',
      })) : [];
      
      setReviews(transformedReviews);
    } catch (error: any) {
      Alert.alert('خطأ', 'فشل في تحميل التقييمات');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

    const handleHelpful = async (reviewId: string) => {
      try {
        const review = reviews.find(r => r.id.toString() === reviewId);
        const newHelpfulState = review ? !review.isHelpful : true;
        await reviewService.markReviewHelpfulness(reviewId, newHelpfulState);
        setReviews(prev =>
          prev.map(r => {
            if (r.id.toString() !== reviewId) {
              return r;
            }
            const currentCount = r.helpfulCount ?? 0;
            const nextCount = newHelpfulState
              ? currentCount + 1
              : Math.max(0, currentCount - 1);
            return {
              ...r,
              isHelpful: newHelpfulState,
              helpfulCount: nextCount,
            };
          }),
        );
      } catch (error: any) {
        Alert.alert('خطأ', 'فشل في تحديث حالة التقييم');
      }
    };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Icon
          key={i}
          name={i <= rating ? 'star' : 'star-border'}
          size={16}
          color={i <= rating ? theme.colors.accent : theme.colors.border}
        />
      );
    }
    return stars;
  };

  const renderReviewItem = ({ item, index }: { item: Review; index: number }) => (
    <AnimatedCard
      style={styles.reviewItem}
      animationType="slide"
      delay={index * 100}
    >
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: 'https://via.placeholder.com/300x200' }}
          style={styles.packageImage}
        />
        <View style={styles.packageInfo}>
          <Text style={styles.packageTitle}>الباقة #{item.package_id}</Text>
          <Text style={styles.packageLocation}>تقييم</Text>
          <View style={styles.ratingContainer}>
            {renderStars(item.rating)}
            <Text style={styles.ratingText}>{item.rating}/5</Text>
          </View>
        </View>
        {item.isVerified && (
          <View style={styles.verifiedBadge}>
            <SafeIcon name="verified" size={16} color={theme.colors.success} />
          </View>
        )}
      </View>

      <View style={styles.reviewContent}>
        <Text style={styles.reviewComment}>{item.comment}</Text>
        <Text style={styles.reviewDate}>
          {new Date(item.created_at).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.reviewFooter}>
        <TouchableOpacity
          style={styles.helpfulButton}
          onPress={() => handleHelpful(item.id.toString())}
        >
          <Icon
            name={item.isHelpful ? 'thumb-up' : 'thumb-up-off-alt'}
            size={16}
            color={item.isHelpful ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text style={[
            styles.helpfulText,
            { color: item.isHelpful ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            مفيد ({item.helpfulCount ?? 0})
          </Text>
        </TouchableOpacity>
      </View>
    </AnimatedCard>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
    },
    flatList: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    reviewItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    reviewHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.md,
    },
    packageImage: {
      width: 60,
      height: 60,
      borderRadius: theme.borderRadius.md,
      marginRight: theme.spacing.md,
    },
    packageInfo: {
      flex: 1,
    },
    packageTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    packageLocation: {
      fontSize: 14,
      color: theme.colors.primary,
      marginBottom: theme.spacing.sm,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    verifiedBadge: {
      marginLeft: theme.spacing.sm,
    },
    reviewContent: {
      marginBottom: theme.spacing.md,
    },
    reviewComment: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: theme.spacing.sm,
    },
    reviewDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    reviewFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    helpfulButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.background,
    },
    helpfulText: {
      fontSize: 14,
      marginLeft: theme.spacing.xs,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل التقييمات..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>تقييماتي</Text>
        <Text style={styles.subtitle}>مراجعة تقييماتك للرحلات</Text>
      </View>

      {reviews.length > 0 ? (
        <FlatList
          style={styles.flatList}
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ExpressiveEmptyState
          title="لا توجد تقييمات"
          message="ابدأ بتقييم رحلاتك"
          imageCategory="review"
        />
      )}
    </View>
  );
};