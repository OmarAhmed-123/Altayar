import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { FastImage } from './../../components/common/FastImage';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from './../../stores/authStore';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { API } from './../../services/apiClient';
import { getIconImageUrl, getIconImageUrls } from './../../utils/imageUtils';
import { bookingService } from './../../services/bookingService';
import { membershipService } from './../../services/membershipService';
import { transactionService } from './../../services/transactionService';
import { getExpressiveImage, getExpressiveImages, getCardImage } from './../../services/expressiveImageService';
// Mock data removed - using real backend data only
import { ensureStringUri, getDefaultFallbackImage } from './../../utils/imageUriHelper';
import { SafeIcon } from './../../utils/iconHelper';
import { LiveChatWidget } from './../../components/chat/LiveChatWidget';
import { RoleHomeScreen } from './RoleHomeScreen';

const { width: screenWidth } = Dimensions.get('window');

interface MembershipCardData {
  membership_type?: string;
  membership_number?: string;
  subscription_date?: string;
  points_balance?: number;
  cashback_balance?: number;
  benefits?: string[];
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, loadUser } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [iconImages, setIconImages] = useState<Record<string, string>>({});
  const [bannerImage, setBannerImage] = useState<string>('');
  const [weekendOfferImage, setWeekendOfferImage] = useState<string>('');
  const [couponsImage, setCouponsImage] = useState<string>('');
  const [paymentCardImage, setPaymentCardImage] = useState<string>('');
  const [pointsCardImage, setPointsCardImage] = useState<string>('');
  const [cashbackCardImage, setCashbackCardImage] = useState<string>('');
  const [membershipCardImage, setMembershipCardImage] = useState<string>('');
  const [paymentDue, setPaymentDue] = useState<number>(0);
  const [membershipCard, setMembershipCard] = useState<MembershipCardData | null>(null);
  const [cashbackTotal, setCashbackTotal] = useState<number>(12288);
  const [cashbackLeft, setCashbackLeft] = useState<number>(0);
  const [daysToRenew, setDaysToRenew] = useState<number>(221);
  const [isLoading, setIsLoading] = useState(true);
  const role = user?.role ?? 'customer';
  const isCustomerHome = !user || role === 'customer';
  
  // Header animations
  const [headerFadeAnim] = useState(new Animated.Value(0));
  const [headerSlideAnim] = useState(new Animated.Value(-50));

  useEffect(() => {
    if (!isCustomerHome) {
      setIsLoading(false);
      return;
    }

    const initializeScreen = async () => {
      await loadData();
      await loadImages();
    };
    
    initializeScreen();
    
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(headerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isCustomerHome]);

  // Reload data when user changes (e.g., after profile update)
  // But don't reload images to prevent them from disappearing and reduce API calls
  useEffect(() => {
    if (!isCustomerHome || !user) {
      return;
    }
    loadData();
    if (Object.keys(iconImages).length === 0 && !bannerImage && !weekendOfferImage) {
      loadImages();
    }
  }, [user, isCustomerHome, iconImages, bannerImage, weekendOfferImage]);

  const loadImages = async () => {
    if (!isCustomerHome) {
      return;
    }
    try {
      // Only load if images are not already loaded (prevent re-loading on re-render)
      // This check prevents redundant API calls
      if (Object.keys(iconImages).length === 0) {
        // Load icons (cached automatically by imageService)
        const icons = ['search', 'menu', 'notifications', 'local-offer', 'weekend', 'percent', 'wallet', 'card-membership', 'manage', 'learn-more'];
        const images = await getIconImageUrls(icons, 24, 24);
        
        // Also load expressive button images (cached automatically)
        const buttonImages = await getExpressiveImages(['manage', 'learn-more'], 24, 24);
        setIconImages({ ...images, ...buttonImages });
      }

      // Load expressive images for cards and banners - only if not already loaded
      // This prevents redundant API calls on every render
      const needsCardImages = !paymentCardImage || !pointsCardImage || !weekendOfferImage || 
                             !couponsImage || !cashbackCardImage || !membershipCardImage;
      
      if (needsCardImages) {
        // Load all card images at once (cached automatically)
        const cardImages = await getExpressiveImages([
          'payments',
          'points',
          'weekend-offers',
          'coupons',
          'cashback',
          'membership-card',
        ], 300, 200);

        // Only set if not already set (prevent clearing on re-render)
        if (!paymentCardImage && cardImages['payments']) setPaymentCardImage(cardImages['payments']);
        if (!pointsCardImage && cardImages['points']) setPointsCardImage(cardImages['points']);
        if (!weekendOfferImage && cardImages['weekend-offers']) setWeekendOfferImage(cardImages['weekend-offers']);
        if (!couponsImage && cardImages['coupons']) setCouponsImage(cardImages['coupons']);
        if (!cashbackCardImage && cardImages['cashback']) setCashbackCardImage(cardImages['cashback']);
        if (!membershipCardImage && cardImages['membership-card']) setMembershipCardImage(cardImages['membership-card']);
      }

      // Load banner image (resort image) - only if not already loaded
      if (!bannerImage) {
        try {
          // This will use cache if available
          const bannerUrl = await getExpressiveImage('learn-more', 400, 200);
          setBannerImage(bannerUrl);
        } catch (error) {
          // Only use fallback if it's not a rate limit error
          if ((error as any)?.response?.status !== 429) {
            setBannerImage('https://source.unsplash.com/400x200/?resort+hotel+swimming+pool');
          }
        }
      }

      // Fallback for weekend and coupons if not loaded (only if not rate limited)
      if (!weekendOfferImage) {
        try {
          const weekendUrl = await getExpressiveImage('weekend-offers', 200, 150);
          setWeekendOfferImage(weekendUrl);
        } catch (error) {
          if ((error as any)?.response?.status !== 429) {
            setWeekendOfferImage('https://source.unsplash.com/200x150/?weekend+resort+vacation');
          }
        }
      }

      if (!couponsImage) {
        try {
          const couponsUrl = await getExpressiveImage('coupons', 200, 150);
          setCouponsImage(couponsUrl);
        } catch (error) {
          if ((error as any)?.response?.status !== 429) {
            setCouponsImage('https://source.unsplash.com/200x150/?city+skyline+sunset');
          }
        }
      }
    } catch (error) {
      // Don't log rate limit errors as errors (they're handled gracefully)
      if ((error as any)?.response?.status !== 429) {
        console.error('Error loading images:', error);
      }
    }
  };

  const loadData = async () => {
    if (!isCustomerHome) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Use real backend API - reload user data to get latest points and cashback
      await loadUser();

        // Load payment due from transactions (pending payments)
        try {
          const transactions = await transactionService.getUserTransactions();
          
          // Calculate pending payments (invoice_payment type with negative amount or pending status)
          const pendingPayments = transactions.filter((t: any) => 
            (t.type === 'invoice_payment' && t.amount < 0) || 
            (t.type === 'booking_payment' && t.amount < 0)
          );
          
          const totalDue = Math.abs(pendingPayments.reduce((sum: number, t: any) => sum + (t.amount || 0), 0));
          
          // Also check bookings for pending payments
          try {
            const bookingsResponse = await bookingService.getMyBookings();
            const bookings = Array.isArray(bookingsResponse) 
              ? bookingsResponse 
              : ((bookingsResponse as any).data || []);
            
            const unpaidBookings = bookings.filter((b: any) => 
              (b.status === 'pending' || b.status === 'confirmed') && !b.invoice_id
            );
            
            const bookingsDue = unpaidBookings.reduce((sum: number, b: any) => 
              sum + (b.total_price || b.totalAmount || 0), 0
            );
            
            setPaymentDue(totalDue + bookingsDue);
          } catch (error) {
            setPaymentDue(totalDue);
          }
        } catch (error: any) {
          // Don't log cached responses or successful cached responses as errors
          if (!error?.__CACHED_RESPONSE__ && error?.response?.status !== 200) {
            // Only log real errors
            if (error?.response?.status && error.response.status >= 400) {
              console.error('Error loading payment due:', error);
            }
          }
          setPaymentDue(0);
        }

        // Load membership card with real data (only once, cache 404 to prevent repeated requests)
        try {
          const membershipResponse = await membershipService.getMyMembershipCard();
          const membershipData = (membershipResponse as any).data || membershipResponse;
          
          if (membershipData && membershipData.success !== false) {
            setMembershipCard(membershipData);
            
            // Calculate days to renew from subscription date
            if (membershipData.subscription_date) {
              const subscriptionDate = new Date(membershipData.subscription_date);
              const oneYearLater = new Date(subscriptionDate);
              oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
              const today = new Date();
              const diffTime = oneYearLater.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              setDaysToRenew(diffDays > 0 ? diffDays : 0);
            }
          } else {
            // No membership found, set default
            setMembershipCard({
              membership_type: 'Silver Membership',
            });
          }
        } catch (error: any) {
          // If 404, user has no membership - set default and don't retry
          if (error?.response?.status === 404) {
            setMembershipCard({
              membership_type: 'Silver Membership',
            });
            // Don't log 404 errors as they're expected
          } else {
            console.error('Error loading membership:', error);
            setMembershipCard({
              membership_type: 'Silver Membership',
            });
          }
        }

        // Calculate cashback from user data
        if (user) {
          const userCashback = user.cashback || 0;
          // Use actual cashback from user or membership card
          const actualCashback = membershipCard?.cashback_balance ?? userCashback;
          const leftCashback = actualCashback > cashbackTotal ? cashbackTotal : actualCashback;
          setCashbackLeft(leftCashback > 0 ? leftCashback : 8331); // Default if 0
        }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await loadImages();
    setRefreshing(false);
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const cashbackProgress = cashbackTotal > 0 ? (cashbackLeft / cashbackTotal) * 100 : 0;

  // Navigation handlers
  const handleSearch = () => {
    (navigation as any).navigate('Packages');
  };

  const handleMenu = () => {
    (navigation as any).openDrawer();
  };

  const handleNotifications = () => {
    (navigation as any).navigate('Notifications');
  };

  const handleLearnMore = () => {
    (navigation as any).navigate('Packages');
  };

  const handleMembership = () => {
    (navigation as any).getParent()?.navigate('Memberships');
  };

  const handleManageCashback = () => {
    (navigation as any).navigate('Profile');
  };

  const handlePayments = () => {
    (navigation as any).getParent()?.navigate('Analytics');
  };

  const handleMyPoints = () => {
    (navigation as any).navigate('Profile');
  };

  const handleWeekendOffers = () => {
    (navigation as any).navigate('Offers');
  };

  const handleCoupons = () => {
    (navigation as any).navigate('Offers');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    header: {
      backgroundColor: '#0078D4',
      paddingTop: 50,
      paddingBottom: 16,
      paddingHorizontal: 16,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoIcon: {
      width: 40,
      height: 40,
      marginRight: 8,
    },
    logoText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    logoTagline: {
      color: '#FFFFFF',
      fontSize: 10,
      marginTop: -2,
    },
    headerIcons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconButton: {
      padding: 4,
    },
    greeting: {
      marginTop: 8,
      marginBottom: 4,
    },
    greetingText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingBottom: 100,
    },
    bannerContainer: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 12,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    bannerScrollView: {
      borderRadius: 12,
    },
    bannerSlide: {
      width: screenWidth - 32,
      height: 180,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    bannerImage: {
      width: '100%',
      height: 180,
      resizeMode: 'cover',
    },
    bannerOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bannerTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    bannerTagText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#0078D4',
      marginLeft: 4,
    },
    learnMoreButton: {
      backgroundColor: '#0078D4',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
    },
    learnMoreText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    bannerDots: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 8,
      gap: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    membershipButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E0E0E0',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 8,
      justifyContent: 'space-between',
      overflow: 'hidden',
      position: 'relative',
    },
    membershipCardImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.2,
      width: '100%',
      height: '100%',
    },
    membershipLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    membershipText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1A1A1A',
      marginLeft: 8,
    },
    cashbackCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: 'hidden',
      position: 'relative',
    },
    cashbackCardBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.15,
      width: '100%',
      height: '100%',
    },
    cashbackHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    cashbackTitle: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cashbackTitleText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1A1A1A',
      marginLeft: 8,
    },
    cashbackDots: {
      flexDirection: 'row',
      gap: 4,
    },
    cashbackDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
    },
    cashbackBalance: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#1A1A1A',
      marginBottom: 4,
    },
    cashbackSubtext: {
      fontSize: 12,
      color: '#666666',
      marginBottom: 8,
    },
    progressBar: {
      height: 6,
      backgroundColor: '#E0E0E0',
      borderRadius: 3,
      marginBottom: 8,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#0078D4',
      borderRadius: 3,
    },
    cashbackFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    renewText: {
      fontSize: 12,
      color: '#666666',
    },
    manageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#0078D4',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    manageButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    quickCardsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: 16,
      marginBottom: 16,
      gap: 12,
    },
    quickCard: {
      width: screenWidth / 2 - 22,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      minHeight: 120,
      overflow: 'hidden',
      position: 'relative',
    },
    quickCardBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.2,
      width: '100%',
      height: '100%',
    },
    quickCardContent: {
      position: 'relative',
      zIndex: 1,
    },
    quickCardImage: {
      width: '100%',
      height: 100,
      borderRadius: 8,
      marginBottom: 8,
      resizeMode: 'cover',
    },
    quickCardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1A1A1A',
      marginBottom: 4,
    },
    quickCardValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#0078D4',
      marginBottom: 4,
    },
    quickCardDue: {
      fontSize: 12,
      color: '#666666',
      marginBottom: 8,
    },
    activeButton: {
      backgroundColor: '#00C853',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    activeButtonText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
    imageCard: {
      width: screenWidth / 2 - 22,
      height: 120,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    imageCardOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      padding: 12,
    },
    imageCardText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    lastUpdated: {
      textAlign: 'center',
      fontSize: 12,
      color: '#666666',
      marginTop: 8,
      marginBottom: 16,
    },
  });

  if (!isCustomerHome) {
    return (
      <RoleHomeScreen
        role={role}
        user={user}
        navigation={navigation}
      />
    );
  }

  if (isLoading && !user) {
    return <LoadingSpinner text="جاري التحميل..." />;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerFadeAnim,
            transform: [{ translateY: headerSlideAnim }],
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <FastImage
              source={require('../../assets/images/altayarvip.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.logoText}>ALTAYARVIP</Text>
              <Text style={styles.logoTagline}>HERE, THERE, AND EVERYWHERE</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={handleSearch}>
              {(() => {
                const iconUri = ensureStringUri(iconImages['search']);
                return iconUri ? (
                  <FastImage source={iconUri} style={{ width: 24, height: 24 }} resizeMode="contain" />
                ) : (
                  <SafeIcon name="search" size={24} color="#FFFFFF" />
                );
              })()}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleMenu}>
              {(() => {
                const iconUri = ensureStringUri(iconImages['menu']);
                return iconUri ? (
                  <FastImage source={iconUri} style={{ width: 24, height: 24 }} resizeMode="contain" />
                ) : (
                  <SafeIcon name="menu" size={24} color="#FFFFFF" />
                );
              })()}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleNotifications}>
              {(() => {
                const iconUri = ensureStringUri(iconImages['notifications']);
                return iconUri ? (
                  <FastImage source={iconUri} style={{ width: 24, height: 24 }} resizeMode="contain" />
                ) : (
                  <SafeIcon name="notifications" size={24} color="#FFFFFF" />
                );
              })()}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            Hello {user?.firstName || user?.name?.split(' ')[0] || 'User'}! 😊
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Promotional Banner - Carousel */}
          <View style={styles.bannerContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.bannerScrollView}
            >
              {[bannerImage, bannerImage, bannerImage].map((img, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.bannerSlide}
                  onPress={handleLearnMore}
                >
                  <FastImage
                    source={img && typeof img === 'string' && img.trim() !== '' ? String(img) : getDefaultFallbackImage()}
                    style={styles.bannerImage}
                    resizeMode="cover"
                    fallback={getDefaultFallbackImage()}
                  />
                  <View style={styles.bannerOverlay}>
                    <View style={styles.bannerTag}>
                      {(() => {
                        const iconUri = ensureStringUri(iconImages['local-offer']);
                        return iconUri ? (
                          <FastImage source={iconUri} style={{ width: 16, height: 16 }} resizeMode="contain" />
                        ) : (
                          <SafeIcon name="local-offer" size={16} color="#0078D4" />
                        );
                      })()}
                      <Text style={styles.bannerTagText}>Pay 2 Now - Get 3</Text>
                    </View>
                    <TouchableOpacity style={styles.learnMoreButton} onPress={handleLearnMore}>
                      {(() => {
                        const iconUri = ensureStringUri(iconImages['learn-more']);
                        return iconUri ? (
                          <FastImage source={iconUri} style={{ width: 16, height: 16, marginLeft: 4 }} resizeMode="contain" />
                        ) : null;
                      })()}
                      <Text style={styles.learnMoreText}>Learn more {'>>'}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.bannerDots}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index <= 1 ? '#0078D4' : '#FFFFFF',
                  },
                ]}
              />
            ))}
          </View>

          {/* Membership Status */}
          <TouchableOpacity style={styles.membershipButton} onPress={handleMembership}>
            {(() => {
              const cardImageUri = ensureStringUri(membershipCardImage);
              return cardImageUri ? (
                <FastImage
                  source={cardImageUri}
                  style={styles.membershipCardImage}
                  resizeMode="cover"
                  fallback={getDefaultFallbackImage()}
                />
              ) : null;
            })()}
            <View style={styles.membershipLeft}>
              {(() => {
                const iconUri = ensureStringUri(iconImages['card-membership']);
                return iconUri ? (
                  <FastImage source={iconUri} style={{ width: 20, height: 20 }} resizeMode="contain" />
                ) : (
                  <SafeIcon name="card-membership" size={20} color="#1A1A1A" />
                );
              })()}
              <Text style={styles.membershipText}>
                {membershipCard?.membership_type || 'Silver Membership'}
              </Text>
            </View>
            <SafeIcon name="chevron-right" size={20} color="#666666" />
          </TouchableOpacity>

          {/* Cashback Balance */}
          <View style={styles.cashbackCard}>
            {(() => {
              const cardImageUri = ensureStringUri(cashbackCardImage);
              return cardImageUri ? (
                <FastImage
                  source={cardImageUri}
                  style={styles.cashbackCardBackground}
                  resizeMode="cover"
                  fallback={getDefaultFallbackImage()}
                />
              ) : null;
            })()}
            <View style={styles.cashbackHeader}>
              <View style={styles.cashbackTitle}>
                {(() => {
                  const iconUri = ensureStringUri(iconImages['wallet']);
                  return iconUri ? (
                    <FastImage source={iconUri} style={{ width: 20, height: 20 }} resizeMode="contain" />
                  ) : (
                    <SafeIcon name="account-balance-wallet" size={20} color="#1A1A1A" />
                  );
                })()}
                <Text style={styles.cashbackTitleText}>Cashback Balance</Text>
              </View>
              <View style={styles.cashbackDots}>
                {[0, 1, 2].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.cashbackDot,
                      {
                        backgroundColor: index === 0 ? '#0078D4' : '#E0E0E0',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.cashbackBalance}>
              {cashbackLeft.toLocaleString()}
            </Text>
            <Text style={styles.cashbackSubtext}>
              left of {cashbackTotal.toLocaleString()} USD
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(cashbackProgress, 100)}%` }]} />
            </View>
            <View style={styles.cashbackFooter}>
              <Text style={styles.renewText}>
                {daysToRenew} days to renew
              </Text>
              <TouchableOpacity style={styles.manageButton} onPress={handleManageCashback}>
                {(() => {
                  const iconUri = ensureStringUri(iconImages['manage']);
                  return iconUri ? (
                    <FastImage source={iconUri} style={{ width: 14, height: 14, marginRight: 4 }} resizeMode="contain" />
                  ) : (
                    <SafeIcon name="settings" size={14} color="#FFFFFF" />
                  );
                })()}
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Access Cards */}
          <View style={styles.quickCardsGrid}>
            {/* Payments Card */}
            <TouchableOpacity style={styles.quickCard} onPress={handlePayments}>
              {(() => {
                const cardImageUri = ensureStringUri(paymentCardImage);
                return cardImageUri ? (
                  <FastImage
                    source={cardImageUri}
                    style={styles.quickCardBackground}
                    resizeMode="cover"
                    fallback={getDefaultFallbackImage()}
                  />
                ) : null;
              })()}
              <View style={styles.quickCardContent}>
                <Text style={styles.quickCardTitle}>Payments</Text>
                <Text style={styles.quickCardDue}>Due: ${paymentDue.toLocaleString()}</Text>
                <View style={styles.activeButton}>
                  <Text style={styles.activeButtonText}>Active</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* My Points Card */}
            <TouchableOpacity style={styles.quickCard} onPress={handleMyPoints}>
              {(() => {
                const cardImageUri = ensureStringUri(pointsCardImage);
                return cardImageUri ? (
                  <FastImage
                    source={cardImageUri}
                    style={styles.quickCardBackground}
                    resizeMode="cover"
                    fallback={getDefaultFallbackImage()}
                  />
                ) : null;
              })()}
              <View style={styles.quickCardContent}>
                <View style={styles.cashbackTitle}>
                  {(() => {
                    const iconUri = ensureStringUri(iconImages['wallet']);
                    return iconUri ? (
                      <FastImage source={iconUri} style={{ width: 20, height: 20 }} resizeMode="contain" />
                    ) : (
                      <SafeIcon name="account-balance-wallet" size={20} color="#0078D4" />
                    );
                  })()}
                  <Text style={styles.quickCardTitle}>My Points</Text>
                </View>
                <Text style={styles.quickCardValue}>
                  {user?.points || membershipCard?.points_balance || 7500}
                </Text>
                <SafeIcon name="chevron-right" size={20} color="#666666" style={{ alignSelf: 'flex-end', marginTop: 'auto' }} />
              </View>
            </TouchableOpacity>

            {/* Weekend Offers Card */}
            <TouchableOpacity style={styles.imageCard} onPress={handleWeekendOffers}>
              {(() => {
                const imageUri = ensureStringUri(weekendOfferImage);
                return (
                  <FastImage
                    source={imageUri || getDefaultFallbackImage()}
                    style={styles.quickCardImage}
                    resizeMode="cover"
                    fallback={getDefaultFallbackImage()}
                  />
                );
              })()}
              <View style={styles.imageCardOverlay}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {(() => {
                    const iconUri = ensureStringUri(iconImages['weekend']);
                    return iconUri ? (
                      <FastImage source={iconUri} style={{ width: 16, height: 16, marginRight: 4 }} resizeMode="contain" />
                    ) : (
                      <SafeIcon name="weekend" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                    );
                  })()}
                  <Text style={styles.imageCardText}>Weekend Offers</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Coupons & Discounts Card */}
            <TouchableOpacity style={styles.imageCard} onPress={handleCoupons}>
              {(() => {
                const imageUri = ensureStringUri(couponsImage);
                return (
                  <FastImage
                    source={imageUri || getDefaultFallbackImage()}
                    style={styles.quickCardImage}
                    resizeMode="cover"
                    fallback={getDefaultFallbackImage()}
                  />
                );
              })()}
              <View style={styles.imageCardOverlay}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {(() => {
                    const iconUri = ensureStringUri(iconImages['percent']);
                    return iconUri ? (
                      <FastImage source={iconUri} style={{ width: 16, height: 16, marginRight: 4 }} resizeMode="contain" />
                    ) : (
                      <SafeIcon name="percent" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                    );
                  })()}
                  <Text style={styles.imageCardText}>Coupons & Discounts</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Last Updated */}
          <Text style={styles.lastUpdated}>Last updated: {getCurrentTime()}</Text>
        </View>
      </ScrollView>

      {/* Live Chat Widget - Vodafone Style */}
      <LiveChatWidget />
    </View>
  );
};
