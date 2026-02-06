import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { AnimatedCard } from './../../components/animations/AnimatedCard';
import { ExpressiveEmptyState } from './../../components/common/ExpressiveEmptyState';
import { bookingService } from './../../services/bookingService';
// Mock data removed - using real backend data only
import { Booking } from './../../types';
import { getIconImageUrls } from './../../utils/imageUtils';
import { ensureStringUri } from './../../utils/imageUriHelper';
import { buildImageUrl } from './../../utils/imageUrlBuilder';
import { SafeIcon } from './../../utils/iconHelper';

export const BookingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [iconImages, setIconImages] = useState<Record<string, string>>({});

  useEffect(() => {
    loadBookings();
    loadIconImages();
  }, []);

  const loadIconImages = async () => {
    try {
      const icons = ['calendar-today', 'people'];
      const images = await getIconImageUrls(icons, 16, 16);
      setIconImages(images);
    } catch (error) {
      console.error('Error loading icon images:', error);
    }
  };

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      // Use real backend API
      const response = await bookingService.getMyBookings();
      // Transform backend booking data to frontend format
      const transformedBookings: Booking[] = Array.isArray(response) ? response.map(booking => ({
        ...booking,
        package: booking.package || {
          id: booking.details?.packageId || 0,
          name: booking.details?.packageName || 'باقة سياحية',
          description: '',
          days: 0,
          nights: 0,
          price: booking.total_price || 0,
          services: [],
          images: booking.details?.images || ['https://via.placeholder.com/300x200'],
          is_exclusive: false,
          is_active: true,
          created_at: '',
          updated_at: '',
          title: booking.details?.packageName || 'باقة سياحية',
          location: booking.details?.location || 'الموقع',
        },
        totalAmount: booking.total_price || booking.totalAmount || 0,
        participants: booking.details?.participants || booking.participants || 1,
        startDate: booking.details?.startDate || booking.startDate || '',
        endDate: booking.details?.endDate || booking.endDate || '',
        specialRequests: booking.details?.specialRequests || booking.specialRequests,
      })) : [];
      
      setBookings(transformedBookings);
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      Alert.alert('خطأ', 'فشل في تحميل الحجوزات');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'cancelled':
        return theme.colors.error;
      case 'completed':
        return theme.colors.info;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'مؤكد';
      case 'pending':
        return 'في الانتظار';
      case 'cancelled':
        return 'ملغي';
      case 'completed':
        return 'مكتمل';
      default:
        return status;
    }
  };

  const renderBookingCard = ({ item, index }: { item: Booking; index: number }) => (
    <AnimatedCard
      style={styles.bookingCard}
      animationType="slide"
      delay={index * 100}
      onPress={() => {
        const nav = navigation as any;
        nav.navigate('BookingDetails', { bookingId: item.id.toString() });
      }}
    >
      {(() => {
        const rawImageUri = ensureStringUri(item.package?.images?.[0]);
        const imageUri = rawImageUri ? (buildImageUrl(rawImageUri) || rawImageUri) : null;
        return imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.bookingImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.bookingImage, styles.bookingImagePlaceholder]}>
            <SafeIcon name="image" size={40} color={theme.colors.primary} />
          </View>
        );
      })()}
      <View style={styles.bookingContent}>
        <Text style={styles.bookingTitle}>{item.package?.title || 'باقة سياحية'}</Text>
        <Text style={styles.bookingLocation}>{item.package?.location || 'الموقع'}</Text>
        
        <View style={styles.bookingDetails}>
          {item.startDate && item.endDate && (
            <View style={styles.detailRow}>
              {(() => {
                const iconUri = ensureStringUri(iconImages['calendar-today']);
                if (iconUri) {
                  return <Image source={{ uri: iconUri }} style={styles.detailIcon} resizeMode="contain" />;
                }
                return <SafeIcon name="calendar-today" size={16} color={theme.colors.textSecondary} style={styles.detailIcon} />;
              })()}
              <Text style={styles.detailText}>
                {new Date(item.startDate).toLocaleDateString('ar-SA')} - {new Date(item.endDate).toLocaleDateString('ar-SA')}
              </Text>
            </View>
          )}
          {item.participants && (
            <View style={styles.detailRow}>
              {(() => {
                const iconUri = ensureStringUri(iconImages.people);
                if (iconUri) {
                  return <Image source={{ uri: iconUri }} style={styles.detailIcon} resizeMode="contain" />;
                }
                return <SafeIcon name="people" size={16} color={theme.colors.textSecondary} style={styles.detailIcon} />;
              })()}
              <Text style={styles.detailText}>{item.participants} شخص</Text>
            </View>
          )}
        </View>

        <View style={styles.bookingFooter}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
          <Text style={styles.bookingPrice}>{item.totalAmount} ريال</Text>
        </View>
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
    flatList: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    bookingCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.lg,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    bookingImage: {
      width: '100%',
      height: 200,
    },
    bookingImagePlaceholder: {
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bookingContent: {
      padding: theme.spacing.lg,
    },
    bookingTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    bookingLocation: {
      fontSize: 14,
      color: theme.colors.primary,
      marginBottom: theme.spacing.md,
    },
    bookingDetails: {
      marginBottom: theme.spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    detailText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    detailIcon: {
      width: 16,
      height: 16,
      marginRight: theme.spacing.sm,
    },
    bookingFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusContainer: {
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    bookingPrice: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
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
    return <LoadingSpinner text="جاري تحميل الحجوزات..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>حجوزاتي</Text>
      </View>

      {bookings.length > 0 ? (
        <FlatList
          style={styles.flatList}
          data={bookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ExpressiveEmptyState
          title="لا توجد حجوزات"
          message="ابدأ بحجز رحلتك الأولى"
          imageCategory="booking"
        />
      )}
    </View>
  );
};