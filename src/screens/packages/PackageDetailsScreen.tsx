import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePackageStore } from './../../stores/packageStore';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { AnimatedCard } from './../../components/animations/AnimatedCard';
import { API } from './../../services/apiClient';
import { Linking, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeIcon } from './../../utils/iconHelper';
import { commentService } from './../../services/commentService';
import Toast from 'react-native-toast-message';
import { buildImageUrl } from './../../utils/imageUrlBuilder';

const { width: screenWidth } = Dimensions.get('window');

export const PackageDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { fetchPackageById, isLoading } = usePackageStore();
  const [packageData, setPackageData] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const { packageId } = route.params as { packageId: string };

  useEffect(() => {
    const loadPackage = async () => {
      try {
        const data = await fetchPackageById(packageId);
        setPackageData(data);
      } catch (error) {
        Alert.alert('خطأ', 'فشل في تحميل تفاصيل الباقة');
      }
    };

    loadPackage();
    loadComments();
  }, [packageId, fetchPackageById]);

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const response = await commentService.getCommentsByResource('Package', packageId);
      const commentsData = Array.isArray(response) ? response : (response.data || []);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      await commentService.addComment({
        resourceType: 'Package',
        resourceId: packageId,
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
        text2: error.message || 'فشل إضافة التعليق',
      });
    }
  };

  const handleBookNow = async () => {
    if (!packageData) {
      Alert.alert('خطأ', 'بيانات الباقة غير متوفرة');
      return;
    }

    try {
      // Navigate to PaymentStepsScreen with package details
      (navigation as any).navigate('PaymentSteps', {
        bookingId: null, // Will be created in PaymentStepsScreen
        packageId: packageData.id,
        amount: packageData.price || 0,
        type: 'booking',
        packageData: packageData,
      });
    } catch (error: any) {
      console.error('Navigation error:', error);
      Alert.alert('خطأ', 'فشل في الانتقال إلى صفحة الدفع');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    imageContainer: {
      position: 'relative',
    },
    mainImage: {
      width: screenWidth,
      height: 300,
    },
    imageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 20,
      padding: 10,
    },
    imageIndicators: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      marginHorizontal: 4,
    },
    activeIndicator: {
      backgroundColor: '#FFFFFF',
    },
    content: {
      padding: theme.spacing.lg,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    location: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    price: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    priceUnit: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.xs,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    rating: {
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: theme.spacing.xs,
    },
    reviewCount: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.sm,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    description: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
    },
    featuresList: {
      marginTop: theme.spacing.md,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    featureIcon: {
      marginRight: theme.spacing.sm,
    },
    featureText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    bookButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    bookButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    commentInputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      gap: 8,
    },
    commentInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      padding: 12,
      maxHeight: 100,
      fontSize: 14,
    },
    commentButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    commentsLoading: {
      padding: 20,
      alignItems: 'center',
    },
    noComments: {
      textAlign: 'center',
      padding: 20,
      fontSize: 14,
    },
    commentsList: {
      gap: 12,
    },
    commentItem: {
      borderRadius: 12,
      padding: 12,
    },
    commentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    commentAuthor: {
      fontSize: 14,
      fontWeight: '600',
    },
    commentDate: {
      fontSize: 12,
    },
    commentContent: {
      fontSize: 14,
      lineHeight: 20,
    },
  });

  if (isLoading || !packageData) {
    return <LoadingSpinner text="جاري تحميل تفاصيل الباقة..." />;
  }

  const features = [
    'رحلات جوية ذهاب وإياب',
    'الإقامة في فندق 5 نجوم',
    'وجبات الإفطار',
    'جولات سياحية',
    'تأمين السفر',
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {(() => {
            if (!packageData) {
              return (
                <>
                  <View style={[styles.mainImage, { backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                    <LoadingSpinner text="جاري تحميل الصورة..." />
                  </View>
                  <View style={styles.imageOverlay} />
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                  >
                    <SafeIcon name="arrow-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              );
            }
            const images = packageData.images || packageData.image ? 
              (Array.isArray(packageData.images) ? packageData.images : [packageData.image || packageData.imageUrl]) : 
              [];
            const imageUri = images[selectedImageIndex] || packageData.imageUrl || packageData.image || 'https://via.placeholder.com/400x300';
            // Build full URL if it's a relative path
            const safeUri = typeof imageUri === 'string' ? (buildImageUrl(imageUri) || imageUri) : 'https://via.placeholder.com/400x300';
            return (
              <>
                <Image
                  source={{ uri: safeUri }}
                  style={styles.mainImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay} />
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <SafeIcon name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                {images.length > 1 && (
                  <View style={styles.imageIndicators}>
                    {images.map((_: any, index: number) => (
                      <View
                        key={index}
                        style={[
                          styles.indicator,
                          index === selectedImageIndex && styles.activeIndicator,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            );
          })()}
        </View>

        {packageData ? (
          <View style={styles.content}>
            <Text style={styles.title}>{packageData.title || packageData.name || 'باقة سياحية'}</Text>
            <Text style={styles.location}>{packageData.location || packageData.destination || ''}</Text>

            <View style={styles.priceContainer}>
              <Text style={styles.price}>{packageData.price || 0}</Text>
              <Text style={styles.priceUnit}>ريال</Text>
            </View>

            <View style={styles.ratingContainer}>
              <SafeIcon name="star" size={20} color={theme.colors.accent} />
              <Text style={styles.rating}>{packageData.rating || 0}</Text>
              <Text style={styles.reviewCount}>({packageData.reviewCount || 0} تقييم)</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>الوصف</Text>
              <Text style={styles.description}>{packageData.description || packageData.details || 'لا يوجد وصف متاح'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>المميزات</Text>
              <View style={styles.featuresList}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <SafeIcon
                      name="check-circle"
                      size={20}
                      color={theme.colors.success}
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Comments Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>التعليقات ({comments.length})</Text>
              
              <View style={[styles.commentInputContainer, { backgroundColor: theme.colors.surface }]}>
                <TextInput
                  style={[styles.commentInput, { color: theme.colors.text }]}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="أضف تعليقاً..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.commentButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  <SafeIcon name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {loadingComments ? (
                <View style={styles.commentsLoading}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : comments.length === 0 ? (
                <Text style={[styles.noComments, { color: theme.colors.textSecondary }]}>
                  لا توجد تعليقات بعد
                </Text>
              ) : (
                <View style={styles.commentsList}>
                  {comments.map((comment: any) => (
                    <View key={comment.id} style={[styles.commentItem, { backgroundColor: theme.colors.surface }]}>
                      <View style={styles.commentHeader}>
                        <Text style={[styles.commentAuthor, { color: theme.colors.text }]}>
                          {comment.user?.name || 'مستخدم'}
                        </Text>
                        <Text style={[styles.commentDate, { color: theme.colors.textSecondary }]}>
                          {comment.created_at
                            ? new Date(comment.created_at).toLocaleDateString('ar-EG')
                            : ''}
                        </Text>
                      </View>
                      <Text style={[styles.commentContent, { color: theme.colors.text }]}>
                        {comment.content}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            <LoadingSpinner text="جاري تحميل تفاصيل الباقة..." />
          </View>
        )}
      </ScrollView>

      {packageData && (
        <View style={styles.bookButton}>
          <TouchableOpacity onPress={handleBookNow}>
            <Text style={styles.bookButtonText}>احجز الآن</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};