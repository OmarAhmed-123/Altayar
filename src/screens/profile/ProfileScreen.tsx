import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from './../../stores/authStore';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { AnimatedCard } from './../../components/animations/AnimatedCard';
import { LogoutButton } from './../../components/common/LogoutButton';
import { DownloadReportButton } from './../../components/common/DownloadReportButton';
import { bookingService, tripService, reviewService, imageService, notificationService } from './../../services';
import { SafeIcon } from './../../utils/iconHelper';
import { getFallbackAvatarUri, resolveUserAvatarUri } from '../../utils/avatarHelper';
import { buildProfilePictureUrl } from '../../utils/imageUrlBuilder';

interface ProfileMenuItem {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
  showBadge?: boolean;
  badgeCount?: number;
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useAuthStore();
  const [profileStats, setProfileStats] = useState({
    totalBookings: 0,
    totalTrips: 0,
    totalReviews: 0,
    loyaltyPoints: user?.points || 0,
  });
  const [menuImages, setMenuImages] = useState<Record<string, string>>({});
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const fallbackAvatarUri = useMemo(
    () => getFallbackAvatarUri(user, theme.colors.primary),
    [user?.name, user?.firstName, user?.lastName, theme.colors.primary]
  );
  const [displayAvatarUri, setDisplayAvatarUri] = useState(
    resolveUserAvatarUri(user?.avatar, fallbackAvatarUri)
  );

  useEffect(() => {
    // Build full URL for avatar if it exists
    let avatarUri = user?.avatar;
    if (avatarUri) {
      avatarUri = buildProfilePictureUrl(avatarUri) || avatarUri;
    }
    setDisplayAvatarUri(resolveUserAvatarUri(avatarUri, fallbackAvatarUri));
  }, [user?.avatar, fallbackAvatarUri]);

  // Initialize with user points immediately
  useEffect(() => {
    if (user?.points) {
      setProfileStats(prev => ({
        ...prev,
        loyaltyPoints: user.points || 0,
      }));
    }
  }, [user?.points]);

  // Only reload stats if user ID changes (not on every user update)
  useEffect(() => {
    if (user?.id) {
      // Only reload if points changed significantly
      const currentPoints = profileStats.loyaltyPoints;
      const newPoints = user.points || 0;
      if (Math.abs(currentPoints - newPoints) > 10) {
        setProfileStats(prev => ({
          ...prev,
          loyaltyPoints: newPoints,
        }));
      }
    }
  }, [user?.id]);

  const loadUnreadNotificationCount = useCallback(async () => {
    if (notificationsLoading) return;
    
    setNotificationsLoading(true);
    try {
      // Add timeout to prevent hanging
      const response = await Promise.race([
        notificationService.getUnreadCount(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as any;
      
      const count = response?.data?.unreadCount || response?.unreadCount || 0;
      setUnreadNotificationCount(count);
    } catch (error: any) {
      // Don't log timeout errors - they're expected
      if (error?.message !== 'Timeout') {
        console.warn('Error loading unread notification count:', error?.message || error);
      }
      setUnreadNotificationCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  }, [notificationsLoading]);

  const loadMenuImages = useCallback(async () => {
    // Don't block UI - load images in background
    if (imagesLoading) return;
    
    setImagesLoading(true);
    try {
      const categories = ['edit', 'card-membership', 'notifications', 'star', 'settings', 'help', 'info'];
      // Use timeout to prevent hanging
      const images = await Promise.race([
        imageService.getImageUrls(categories, 40, 40),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
      ]) as Record<string, string>;
      
      setMenuImages(images || {});
    } catch (error: any) {
      // Don't log timeout errors - images are optional
      if (error?.message !== 'Timeout') {
        console.warn('Error loading menu images:', error?.message || error);
      }
      // Keep empty images - icons will be used as fallback
    } finally {
      setImagesLoading(false);
    }
  }, [imagesLoading]);

  const loadProfileStats = useCallback(async () => {
    if (statsLoading) return;
    
    setStatsLoading(true);
    try {
      // Fetch stats with individual timeouts to prevent one slow API from blocking all
      const timeout = 8000; // 8 seconds max per API
      
      const bookingsPromise = Promise.race([
        bookingService.getMyBookings(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]).catch(() => []);

      const tripsPromise = Promise.race([
        tripService.getMyTrips(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]).catch(() => []);

      const reviewsPromise = Promise.race([
        reviewService.getMyReviews(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]).catch(() => []);

      // Fetch all in parallel but don't wait for all - update as they come
      const [bookings, trips, reviews] = await Promise.allSettled([
        bookingsPromise,
        tripsPromise,
        reviewsPromise,
      ]);

      // Update stats with results (handle both success and failure)
      setProfileStats(prev => ({
        totalBookings: bookings.status === 'fulfilled' && Array.isArray(bookings.value) 
          ? bookings.value.length 
          : prev.totalBookings,
        totalTrips: trips.status === 'fulfilled' && Array.isArray(trips.value) 
          ? trips.value.length 
          : prev.totalTrips,
        totalReviews: reviews.status === 'fulfilled' && Array.isArray(reviews.value) 
          ? reviews.value.length 
          : prev.totalReviews,
        loyaltyPoints: user?.points || prev.loyaltyPoints,
      }));
    } catch (error: any) {
      // Don't log timeout errors - they're expected
      if (error?.message !== 'Timeout') {
        console.warn('Error loading profile stats:', error?.message || error);
      }
      // Keep existing stats on error
    } finally {
      setStatsLoading(false);
    }
  }, [statsLoading, user?.points]);

  // Load data on mount - non-blocking
  useEffect(() => {
    loadUnreadNotificationCount();
    loadProfileStats();
    loadMenuImages();
  }, [loadUnreadNotificationCount, loadProfileStats, loadMenuImages]);


  const profileMenuItems: ProfileMenuItem[] = useMemo(() => [
    {
      id: 'edit-profile',
      title: 'تعديل الملف الشخصي',
      icon: 'edit',
      onPress: () => navigation.navigate('EditProfile' as never),
    },
    {
      id: 'memberships',
      title: 'العضويات',
      icon: 'card-membership',
      onPress: () => navigation.navigate('Memberships' as never),
    },
    {
      id: 'notifications',
      title: 'الإشعارات',
      icon: 'notifications',
      onPress: () => navigation.navigate('Notifications' as never),
      showBadge: unreadNotificationCount > 0,
      badgeCount: unreadNotificationCount,
    },
    {
      id: 'reviews',
      title: 'تقييماتي',
      icon: 'star',
      onPress: () => navigation.navigate('Reviews' as never),
    },
    {
      id: 'settings',
      title: 'الإعدادات',
      icon: 'settings',
      onPress: () => navigation.navigate('Settings' as never),
    },
    {
      id: 'preferences',
      title: 'اللغة والعملة',
      icon: 'language',
      onPress: () => navigation.navigate('UserPreferences' as never),
    },
    {
      id: 'vouchers',
      title: 'كوبوناتي',
      icon: 'card-giftcard',
      onPress: () => navigation.navigate('Vouchers' as never),
    },
    {
      id: 'transactions',
      title: 'سجل المعاملات',
      icon: 'receipt',
      onPress: () => navigation.navigate('TransactionsHistory' as never),
    },
    {
      id: 'oauth',
      title: 'ربط الحسابات',
      icon: 'link',
      onPress: () => navigation.navigate('OAuthProviders' as never),
    },
    {
      id: 'affiliate-earnings',
      title: 'أرباح الإحالة',
      icon: 'trending-up',
      onPress: () => navigation.navigate('AffiliateEarnings' as never),
    },
    {
      id: 'recommendations',
      title: 'التوصيات',
      icon: 'star',
      onPress: () => navigation.navigate('Recommendations' as never),
    },
    {
      id: 'downloads',
      title: 'التحميلات',
      icon: 'file-download',
      onPress: () => navigation.navigate('FileDownloads' as never),
    },
    {
      id: 'payment-methods',
      title: 'طرق الدفع',
      icon: 'payment',
      onPress: () => navigation.navigate('PaymentMethods' as never),
    },
    {
      id: 'user-report',
      title: 'تقرير المستخدم',
      icon: 'assessment',
      onPress: () => navigation.navigate('UserReport' as never),
    },
    {
      id: 'file-upload',
      title: 'رفع ملف',
      icon: 'cloud-upload',
      onPress: () => navigation.navigate('FileUpload' as never),
    },
    {
      id: 'travel-itineraries',
      title: 'البرامج السياحية',
      icon: 'flight',
      onPress: () => navigation.navigate('TravelItineraries' as never),
    },
    {
      id: 'travel-documents',
      title: 'مستندات السفر',
      icon: 'document',
      onPress: () => navigation.navigate('TravelDocuments' as never),
    },
    {
      id: 'travel-checklist',
      title: 'قوائم المهام',
      icon: 'checkmark-circle',
      onPress: () => navigation.navigate('TravelChecklist' as never),
    },
    {
      id: 'affiliate-payout',
      title: 'طلبات السحب',
      icon: 'cash',
      onPress: () => navigation.navigate('AffiliatePayoutRequests' as never),
    },
    {
      id: 'recommendation-preferences',
      title: 'تفضيلات التوصيات',
      icon: 'tune',
      onPress: () => navigation.navigate('RecommendationPreferences' as never),
    },
    {
      id: 'partner-services',
      title: 'خدمات الشركاء',
      icon: 'business',
      onPress: () => navigation.navigate('PartnerServicesBooking' as never),
    },
    {
      id: 'partner-bookings',
      title: 'حجوزات الشركاء',
      icon: 'calendar',
      onPress: () => navigation.navigate('PartnerBookings' as never),
    },
    {
      id: 'marketing-campaigns',
      title: 'الحملات التسويقية',
      icon: 'megaphone',
      onPress: () => navigation.navigate('MarketingCampaigns' as never),
    },
    {
      id: 'external-services',
      title: 'خدمات خارجية',
      icon: 'public',
      onPress: () => navigation.navigate('ExternalApiServices' as never),
    },
    {
      id: 'reels',
      title: 'الريلز',
      icon: 'videocam',
      onPress: () => navigation.navigate('Reels' as never),
    },
    {
      id: 'additionals',
      title: 'الخدمات الإضافية',
      icon: 'add-circle',
      onPress: () => navigation.navigate('Additionals' as never),
    },
    {
      id: 'help',
      title: 'المساعدة والدعم',
      icon: 'help',
      onPress: () => console.log('Help pressed'),
    },
    {
      id: 'about',
      title: 'حول التطبيق',
      icon: 'info',
      onPress: () => console.log('About pressed'),
    },
  ], [navigation, unreadNotificationCount]);

  const renderProfileMenuItem = ({ item, index }: { item: ProfileMenuItem; index: number }) => (
    <AnimatedCard
      style={styles.menuItem}
      animationType="slide"
      delay={index * 50}
      onPress={item.onPress}
    >
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemLeft}>
          <View style={styles.menuItemIcon}>
            {menuImages[item.icon] ? (
              <Image
                source={{ uri: menuImages[item.icon] }}
                style={{ width: 24, height: 24, borderRadius: 12 }}
                resizeMode="cover"
              />
            ) : (
              <SafeIcon name={item.icon} size={24} color={theme.colors.primary} />
            )}
          </View>
          <Text style={styles.menuItemTitle}>{item.title}</Text>
        </View>
        <View style={styles.menuItemRight}>
          {item.showBadge && item.badgeCount && item.badgeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badgeCount}</Text>
            </View>
          )}
          <SafeIcon name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </View>
      </View>
    </AnimatedCard>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      backgroundColor: theme.colors.primary,
      paddingTop: 50,
      paddingBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
    },
    profileSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.md,
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: theme.spacing.xs,
    },
    userEmail: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginHorizontal: theme.spacing.lg,
      marginTop: -theme.spacing.xl,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    content: {
      padding: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    menuItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuItemIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    menuItemTitle: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    menuItemRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    badge: {
      backgroundColor: theme.colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.sm,
    },
    badgeText: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    reportSection: {
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    reportButton: {
      marginHorizontal: 0,
    },
  });

  // Don't block UI - show screen immediately with default data
  // Only show loading if auth is still loading (first time)
  if (authLoading && !user) {
    return <LoadingSpinner text="جاري تحميل الملف الشخصي..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
            <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Image
                source={{ uri: displayAvatarUri }}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={() => {
                  setDisplayAvatarUri(fallbackAvatarUri);
                }}
              />
            </View>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {statsLoading && profileStats.totalBookings === 0 ? '...' : profileStats.totalBookings}
            </Text>
            <Text style={styles.statLabel}>حجوزات</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {statsLoading && profileStats.totalTrips === 0 ? '...' : profileStats.totalTrips}
            </Text>
            <Text style={styles.statLabel}>رحلات</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {statsLoading && profileStats.totalReviews === 0 ? '...' : profileStats.totalReviews}
            </Text>
            <Text style={styles.statLabel}>تقييمات</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileStats.loyaltyPoints}</Text>
            <Text style={styles.statLabel}>نقاط</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>الحساب</Text>
          {profileMenuItems.map((item, index) => (
            <View key={item.id}>
              {renderProfileMenuItem({ item, index })}
            </View>
          ))}

          <View style={styles.reportSection}>
            <DownloadReportButton 
              showText={true}
              style={styles.reportButton}
              navigation={navigation}
            />
          </View>

          <LogoutButton />
        </View>
      </ScrollView>
    </View>
  );
};