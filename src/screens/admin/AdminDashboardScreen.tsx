import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { useAuthStore } from './../../stores/authStore';
import { dashboardService } from './../../services/dashboardService';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
// Mock data removed - using real backend data only
import { SafeIcon } from './../../utils/iconHelper';
import { useNavigation } from '@react-navigation/native';

// Alias for backward compatibility

interface AdminStats {
  users: {
    total: number;
    new: number;
    growth: number;
  };
  bookings: {
    total: number;
    recent: number;
    by_status: any[];
    average_value: number;
  };
  revenue: {
    total: number;
    recent: number;
    growth: number;
  };
  packages: {
    total: number;
    popular: any[];
  };
  reviews: {
    total: number;
    average_rating: number;
  };
  conversion: {
    rate: number;
    views: number;
    bookings: number;
  };
}

export const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const managementItems = [
    { id: 'users', title: 'إدارة المستخدمين', icon: 'people', screen: 'UsersManagement' },
    { id: 'packages', title: 'إدارة الباقات', icon: 'local-offer', screen: 'PackagesManagement' },
    { id: 'bookings', title: 'إدارة الحجوزات', icon: 'book-online', screen: 'BookingsManagement' },
    { id: 'memberships', title: 'إدارة العضويات', icon: 'card-membership', screen: 'MembershipsManagement' },
    { id: 'blogs', title: 'إدارة المدونات', icon: 'article', screen: 'BlogsManagement' },
    { id: 'reviews', title: 'إدارة التقييمات', icon: 'star', screen: 'ReviewsManagement' },
    { id: 'ads', title: 'إدارة الإعلانات', icon: 'campaign', screen: 'AdsManagement' },
    { id: 'comments', title: 'إدارة التعليقات', icon: 'comment', screen: 'CommentsManagement' },
    { id: 'transactions', title: 'إدارة المعاملات', icon: 'receipt', screen: 'TransactionsManagement' },
    { id: 'vouchers', title: 'إدارة الكوبونات', icon: 'card-giftcard', screen: 'VouchersManagement' },
    { id: 'settings', title: 'إدارة الإعدادات', icon: 'settings', screen: 'SettingsManagement' },
    { id: 'localization', title: 'إدارة التوطين', icon: 'language', screen: 'LocalizationManagement' },
    { id: 'marketing', title: 'التسويق الآلي', icon: 'megaphone', screen: 'MarketingAutomation' },
    { id: 'externalApi', title: 'تكاملات API', icon: 'code', screen: 'ExternalApiIntegrations' },
    { id: 'fileStats', title: 'إحصائيات الملفات', icon: 'stats-chart', screen: 'FileManagementStatistics' },
    { id: 'recommendations', title: 'تحليلات التوصيات', icon: 'trending-up', screen: 'RecommendationsAnalytics' },
    { id: 'affiliateCampaigns', title: 'حملات الإحالة', icon: 'people', screen: 'AffiliateCampaignsManagement' },
    { id: 'partnerServices', title: 'خدمات الشركاء', icon: 'business', screen: 'PartnerServicesManagement' },
    { id: 'trips', title: 'إدارة الرحلات', icon: 'airplane', screen: 'TripsManagement' },
    { id: 'documents', title: 'إدارة المستندات', icon: 'document', screen: 'DocumentsManagement' },
    { id: 'chat', title: 'إدارة المحادثات', icon: 'chatbubbles', screen: 'ChatConversationsManagement' },
    { id: 'notifications', title: 'إدارة الإشعارات', icon: 'notifications', screen: 'NotificationsManagement' },
    { id: 'travelCompanion', title: 'إدارة البرامج السياحية', icon: 'map', screen: 'TravelCompanionItinerariesManagement' },
    { id: 'analytics', title: 'تحليلات متقدمة', icon: 'analytics', screen: 'DashboardAnalytics' },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Use real backend API calls
      const [statsResponse, realtimeResponse, activitiesResponse] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRealtimeAnalytics(),
        dashboardService.getRecentActivities(),
      ]);

        if (statsResponse.data) {
          // Transform DashboardStats to AdminStats format
          const dashboardData = statsResponse.data as any;
          setStats({
            users: dashboardData.users || { total: 0, new: 0, growth: 0 },
            bookings: dashboardData.bookings || { total: 0, recent: 0, by_status: [], average_value: 0 },
            revenue: dashboardData.revenue || { total: 0, recent: 0, growth: 0 },
            packages: dashboardData.packages || { total: 0, popular: [] },
            reviews: dashboardData.reviews || { total: 0, average_rating: 0 },
            conversion: dashboardData.conversion || { rate: 0, views: 0, bookings: 0 },
          });
        }
        if (realtimeResponse.data) {
          setRealtimeData(realtimeResponse.data);
        }
        if (activitiesResponse.data) {
          setRecentActivities(Array.isArray(activitiesResponse.data) ? activitiesResponse.data : []);
        }
    } catch (error: any) {
      console.error('Error loading admin dashboard:', error);
      Alert.alert('خطأ', 'فشل في تحميل بيانات الأدمن');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return 'book-online';
      case 'user':
        return 'person-add';
      case 'payment':
        return 'payment';
      case 'review':
        return 'star';
      default:
        return 'info';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'booking':
        return theme.colors.primary;
      case 'user':
        return theme.colors.success;
      case 'payment':
        return theme.colors.warning;
      case 'review':
        return theme.colors.secondary;
      default:
        return theme.colors.textSecondary;
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
    content: {
      padding: theme.spacing.lg,
    },
    centeredContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    centeredTitle: {
      textAlign: 'center',
      marginTop: theme.spacing.lg,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    centeredSubtitle: {
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
    welcomeCard: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    welcomeText: {
      fontSize: 18,
      color: '#FFFFFF',
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    welcomeSubtext: {
      fontSize: 14,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.lg,
    },
    statCard: {
      width: '48%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      marginRight: '2%',
    },
    statCardFull: {
      width: '100%',
      marginRight: 0,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    statIcon: {
      marginRight: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    statChange: {
      fontSize: 12,
      color: theme.colors.success,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    activityContent: {
      flex: 1,
    },
    activityDescription: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    activityTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    realtimeCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    realtimeLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    realtimeValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    managementGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    managementCard: {
      width: '48%',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 100,
    },
    managementCardPrimaryBackground: {
      backgroundColor: `${theme.colors.primary}10`,
    },
    managementTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginTop: 8,
      textAlign: 'center',
      color: theme.colors.text,
    },
    emptyActivitiesText: {
      textAlign: 'center',
      padding: theme.spacing.lg,
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل لوحة الأدمن..." />;
  }

  // Check if user is admin
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <View style={styles.container}>
        <View style={[styles.content, styles.centeredContent]}>
          <SafeIcon name="lock" size={64} color={theme.colors.error} />
          <Text style={[styles.title, styles.centeredTitle]}>غير مصرح بالوصول</Text>
          <Text style={[styles.subtitle, styles.centeredSubtitle]}>هذه الصفحة متاحة فقط للأدمن</Text>
        </View>
      </View>
    );
  }

  if (!stats) {
    return <LoadingSpinner text="جاري تحميل البيانات..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>لوحة تحكم الأدمن</Text>
          <Text style={styles.subtitle}>نظرة شاملة على جميع البيانات والإحصائيات</Text>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>مرحباً {user?.name || 'الأدمن'} 👋</Text>
          <Text style={styles.welcomeSubtext}>آخر تحديث: {new Date().toLocaleString('ar-EG')}</Text>
        </View>

        {/* Real-time Stats */}
        {realtimeData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>البيانات الفورية</Text>
            <View style={styles.statsGrid}>
              <View style={styles.realtimeCard}>
                <Text style={styles.realtimeLabel}>المستخدمون النشطون</Text>
                <Text style={styles.realtimeValue}>{realtimeData.active_users || 0}</Text>
              </View>
              <View style={styles.realtimeCard}>
                <Text style={styles.realtimeLabel}>الحجوزات الأخيرة</Text>
                <Text style={styles.realtimeValue}>{realtimeData.recent_bookings || 0}</Text>
              </View>
              <View style={styles.realtimeCard}>
                <Text style={styles.realtimeLabel}>الإيرادات الأخيرة</Text>
                <Text style={styles.realtimeValue}>
                  {(realtimeData.recent_revenue || 0).toLocaleString()} EGP
                </Text>
              </View>
              <View style={styles.realtimeCard}>
                <Text style={styles.realtimeLabel}>مشاهدات الباقات</Text>
                <Text style={styles.realtimeValue}>{realtimeData.package_views || 0}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Main Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الإحصائيات الرئيسية</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <SafeIcon name="people" size={20} color={theme.colors.primary} style={styles.statIcon} />
                <Text style={styles.statLabel}>إجمالي المستخدمين</Text>
              </View>
              <Text style={styles.statValue}>{(stats.users?.total || 0).toLocaleString()}</Text>
              <Text style={styles.statChange}>
                +{stats.users?.new || 0} جديد ({((stats.users?.growth ?? 0)).toFixed(1)}%)
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <SafeIcon name="book-online" size={20} color={theme.colors.primary} style={styles.statIcon} />
                <Text style={styles.statLabel}>إجمالي الحجوزات</Text>
              </View>
              <Text style={styles.statValue}>{(stats.bookings?.total || 0).toLocaleString()}</Text>
              <Text style={styles.statChange}>
                +{stats.bookings?.recent || 0} حديثة
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <SafeIcon name="attach-money" size={20} color={theme.colors.primary} style={styles.statIcon} />
                <Text style={styles.statLabel}>إجمالي الإيرادات</Text>
              </View>
              <Text style={styles.statValue}>{(stats.revenue?.total || 0).toLocaleString()} EGP</Text>
              <Text style={styles.statChange}>
                +{((stats.revenue?.growth ?? 0)).toFixed(1)}% نمو
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <SafeIcon name="local-offer" size={20} color={theme.colors.primary} style={styles.statIcon} />
                <Text style={styles.statLabel}>الباقات النشطة</Text>
              </View>
              <Text style={styles.statValue}>{stats.packages?.total || 0}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <SafeIcon name="star" size={20} color={theme.colors.primary} style={styles.statIcon} />
                <Text style={styles.statLabel}>التقييمات</Text>
              </View>
              <Text style={styles.statValue}>{stats.reviews?.total || 0}</Text>
              <Text style={styles.statChange}>
                متوسط: {((stats.reviews?.average_rating ?? 0)).toFixed(1)} ⭐
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <SafeIcon name="trending-up" size={20} color={theme.colors.primary} style={styles.statIcon} />
                <Text style={styles.statLabel}>معدل التحويل</Text>
              </View>
              <Text style={styles.statValue}>{((stats.conversion?.rate ?? 0)).toFixed(1)}%</Text>
              <Text style={styles.statChange}>
                {stats.conversion?.views || 0} مشاهدة → {stats.conversion?.bookings || 0} حجز
              </Text>
            </View>
          </View>
        </View>

        {/* Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>أدوات الإدارة</Text>
          <View style={styles.managementGrid}>
            {managementItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.managementCard, styles.managementCardPrimaryBackground]}
                onPress={() => {
                  // Navigate to Profile stack through MainTabs
                  try {
                    // First navigate to MainTabs, then to Profile, then to the specific screen
                    (navigation as any).navigate('MainTabs', {
                      screen: 'Profile',
                      params: {
                        screen: item.screen,
                      },
                    });
                  } catch (navigationError) {
                    console.warn(`MainTabs navigation failed for ${item.screen}:`, navigationError);
                    // Fallback: try navigating directly to Profile stack
                    try {
                      (navigation as any).navigate('Profile', {
                        screen: item.screen,
                      });
                    } catch (profileNavigationError) {
                      console.warn(`Profile stack navigation failed for ${item.screen}:`, profileNavigationError);
                      // Last fallback: try direct navigation
                      try {
                        (navigation as any).navigate(item.screen);
                      } catch (err) {
                        console.error(`Failed to navigate to ${item.screen}:`, err);
                        Alert.alert('خطأ', `لا يمكن الوصول إلى ${item.title} حالياً`);
                      }
                    }
                  }
                }}
              >
                <SafeIcon name={item.icon} size={32} color={theme.colors.primary} />
                <Text style={styles.managementTitle}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الأنشطة الأخيرة</Text>
          {recentActivities.length === 0 ? (
            <Text style={[styles.subtitle, styles.emptyActivitiesText]}>
              لا توجد أنشطة حديثة
            </Text>
          ) : (
            recentActivities.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View
                  style={[
                    styles.activityIcon,
                    { backgroundColor: getActivityColor(activity.type) + '20' },
                  ]}
                >
                  <SafeIcon
                    name={getActivityIcon(activity.type)}
                    size={20}
                    color={getActivityColor(activity.type)}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                  <Text style={styles.activityTime}>
                    {formatDate(activity.timestamp)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

