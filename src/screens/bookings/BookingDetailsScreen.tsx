import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { bookingService } from './../../services/bookingService';
import { SafeIcon } from './../../utils/iconHelper';

interface BookingDetails {
  id: string;
  packageId: string;
  package: {
    id: string;
    title: string;
    description: string;
    images: string[];
    location: string;
    duration: number;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmount: number;
  participants: number;
  startDate: string;
  endDate: string;
  specialRequests?: string;
  createdAt: string;
  bookingReference: string;
}

export const BookingDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const nav = navigation as any;
  const { theme } = useTheme();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { bookingId } = route.params as { bookingId: string };

  const loadBookingDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const bookingData = await bookingService.getBookingById(bookingId);
      // Transform backend booking data to frontend format
      const transformedBooking: BookingDetails = {
        id: bookingData.id.toString(),
        packageId: bookingData.details?.packageId?.toString() || '',
        package: {
          id: (bookingData.package?.id || bookingData.details?.packageId || 0).toString(),
          title: bookingData.package?.name || bookingData.details?.packageName || 'باقة سياحية',
          description: bookingData.package?.description || bookingData.details?.description || '',
          images: bookingData.package?.images || bookingData.details?.images || ['https://via.placeholder.com/400x300'],
          location: bookingData.package?.location || bookingData.details?.location || 'الموقع',
          duration: bookingData.package?.days || bookingData.details?.duration || 0,
        },
        status: bookingData.status || 'pending',
        totalAmount: bookingData.total_price || 0,
        participants: bookingData.details?.participants || bookingData.participants || 1,
        startDate: bookingData.details?.startDate || bookingData.startDate || '',
        endDate: bookingData.details?.endDate || bookingData.endDate || '',
        specialRequests: bookingData.details?.specialRequests || bookingData.specialRequests,
        createdAt: bookingData.created_at || '',
        bookingReference: bookingData.invoice_id || `AT-${bookingData.id}`,
      };
      
      setBooking(transformedBooking);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في تحميل تفاصيل الحجز');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBookingDetails();
  }, [loadBookingDetails]);

  const handleCancelBooking = async () => {
    Alert.alert(
      'إلغاء الحجز',
      'هل أنت متأكد من إلغاء هذا الحجز؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            try {
              await bookingService.cancelBooking(bookingId);
              Alert.alert('نجح', 'تم إلغاء الحجز بنجاح', [
                { text: 'حسناً', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              Alert.alert('خطأ', error.message || 'فشل في إلغاء الحجز');
            }
          },
        },
      ]
    );
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    backButton: {
      marginRight: theme.spacing.md,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: getStatusColor(booking?.status || ''),
    },
    statusText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    content: {
      padding: theme.spacing.lg,
    },
    imageContainer: {
      marginBottom: theme.spacing.lg,
    },
    packageImage: {
      width: '100%',
      height: 200,
      borderRadius: theme.borderRadius.md,
    },
    packageTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    packageLocation: {
      fontSize: 16,
      color: theme.colors.primary,
      marginBottom: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    infoLabel: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    infoValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    priceLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    priceValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    specialRequests: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
      fontStyle: 'italic',
    },
    actions: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    cancelButton: {
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    cancelButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    paymentIcon: {
      marginRight: theme.spacing.sm,
    },
    invoiceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.md,
      gap: 8,
    },
    invoiceButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (isLoading || !booking) {
    return <LoadingSpinner text="جاري تحميل تفاصيل الحجز..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <SafeIcon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>تفاصيل الحجز</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: booking.package.images[0] || 'https://via.placeholder.com/400x300' }}
              style={styles.packageImage}
            />
          </View>

          <Text style={styles.packageTitle}>{booking.package.title}</Text>
          <Text style={styles.packageLocation}>{booking.package.location}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات الحجز</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>رقم الحجز</Text>
              <Text style={styles.infoValue}>{booking.bookingReference}</Text>
            </View>
            <TouchableOpacity
              style={[styles.invoiceButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => nav.navigate('Invoice', { bookingId: booking.id })}
            >
              <SafeIcon name="receipt" size={20} color="#FFFFFF" />
              <Text style={styles.invoiceButtonText}>عرض الفاتورة</Text>
            </TouchableOpacity>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>تاريخ البداية</Text>
              <Text style={styles.infoValue}>
                {new Date(booking.startDate).toLocaleDateString('ar-SA')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>تاريخ النهاية</Text>
              <Text style={styles.infoValue}>
                {new Date(booking.endDate).toLocaleDateString('ar-SA')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>المدة</Text>
              <Text style={styles.infoValue}>{booking.package.duration} أيام</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>عدد المشاركين</Text>
              <Text style={styles.infoValue}>{booking.participants} شخص</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>المبلغ الإجمالي</Text>
              <Text style={styles.priceValue}>{booking.totalAmount} ريال</Text>
            </View>
          </View>

          {booking.specialRequests && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>طلبات خاصة</Text>
              <Text style={styles.specialRequests}>{booking.specialRequests}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        {booking.status === 'pending' && (
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: theme.colors.primary, marginBottom: theme.spacing.sm }]} 
            onPress={() => {
              // Navigate to PaymentStepsScreen
              (navigation as any).navigate('PaymentSteps', {
                bookingId: parseInt(booking.id, 10),
                amount: booking.totalAmount,
                type: 'booking',
              });
            }}
          >
            <SafeIcon name="payment" size={20} color="#FFFFFF" style={styles.paymentIcon} />
            <Text style={styles.cancelButtonText}>دفع الآن</Text>
          </TouchableOpacity>
        )}
        {booking.status === 'confirmed' && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBooking}>
            <Text style={styles.cancelButtonText}>إلغاء الحجز</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};