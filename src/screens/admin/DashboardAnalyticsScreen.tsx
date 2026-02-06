import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { dashboardAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';

export const DashboardAnalyticsScreen: React.FC = () => {
  const { theme } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(theme), [theme]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState<'sales' | 'bookings' | 'users' | 'reviews' | 'package_views'>('sales');
  const [period, setPeriod] = useState<number>(12);
  const [chartData, setChartData] = useState<any>(null);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [engagementPeriod, setEngagementPeriod] = useState<number>(30);

  const loadChartData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getChartData(chartType, period);
      const data = response.data || response || [];
      setChartData(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل بيانات الرسم البياني',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [chartType, period]);

  const loadEngagementData = useCallback(async () => {
    try {
      const response = await dashboardAPI.getUserEngagement(engagementPeriod);
      const data = response.data || response || {};
      setEngagementData(data);
    } catch (error: any) {
      console.error('Error loading engagement data:', error);
    }
  }, [engagementPeriod]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  useEffect(() => {
    loadEngagementData();
  }, [loadEngagementData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadChartData(), loadEngagementData()]);
  };

  const getChartTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sales: 'المبيعات',
      bookings: 'الحجوزات',
      users: 'المستخدمين',
      reviews: 'التقييمات',
      package_views: 'مشاهدات الباقات',
    };
    return labels[type] || type;
  };

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toLocaleString('ar-EG');
    }
    return value || 0;
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>تحليلات متقدمة</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Chart Type Selection */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>نوع الرسم البياني</Text>
          <View style={styles.filterContainer}>
            {(['sales', 'bookings', 'users', 'reviews', 'package_views'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterTab,
                  chartType === type ? dynamicStyles.filterTabActive : null,
                ]}
                onPress={() => setChartType(type)}
              >
                <Text
                  style={[
                    styles.filterText,
                    chartType === type
                      ? dynamicStyles.filterTextActive
                      : dynamicStyles.filterTextInactive,
                  ]}
                >
                  {getChartTypeLabel(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Period Selection */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>الفترة الزمنية</Text>
          <View style={styles.filterContainer}>
            {[3, 6, 12, 24].map((months) => (
              <TouchableOpacity
                key={months}
                style={[
                  styles.filterTab,
                  period === months ? dynamicStyles.filterTabActive : null,
                ]}
                onPress={() => setPeriod(months)}
              >
                <Text
                  style={[
                    styles.filterText,
                    period === months
                      ? dynamicStyles.filterTextActive
                      : dynamicStyles.filterTextInactive,
                  ]}
                >
                  {months} شهر
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Chart Data Display */}
        {chartData && chartData.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              بيانات {getChartTypeLabel(chartType)}
            </Text>
            {chartData.map((item: any, index: number) => (
              <View key={index} style={[styles.dataRow, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.dataInfo}>
                  <Text style={[styles.dataLabel, { color: theme.colors.text }]}>
                    {item.year}/{item.month}
                  </Text>
                  <Text style={[styles.dataValue, { color: theme.colors.primary }]}>
                    {formatValue(item.totalSales || item.totalBookings || item.newUsers || item.totalReviews || item.totalViews)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* User Engagement Section */}
        {engagementData && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>مشاركة المستخدمين</Text>
            
            {/* Engagement Period Selection */}
            <View style={styles.filterContainer}>
              {[7, 30, 90].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.filterTab,
                  engagementPeriod === days ? dynamicStyles.filterTabActive : null,
                  ]}
                  onPress={() => setEngagementPeriod(days)}
                >
                  <Text
                    style={[
                      styles.filterText,
                    engagementPeriod === days
                      ? dynamicStyles.filterTextActive
                      : dynamicStyles.filterTextInactive,
                    ]}
                  >
                    {days} يوم
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Retention Rate */}
            {engagementData.retention_rate !== undefined && (
              <View style={[styles.statCard, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  معدل الاحتفاظ
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {engagementData.retention_rate.toFixed(2)}%
                </Text>
              </View>
            )}

            {/* Activity Breakdown */}
            {engagementData.activity_breakdown && engagementData.activity_breakdown.length > 0 && (
              <View style={styles.breakdownContainer}>
                <Text style={[styles.breakdownTitle, { color: theme.colors.text }]}>
                  توزيع الأنشطة
                </Text>
                {engagementData.activity_breakdown.map((item: any, index: number) => (
                  <View key={index} style={[styles.breakdownItem, { borderBottomColor: theme.colors.border }]}>
                    <Text style={[styles.breakdownLabel, { color: theme.colors.text }]}>
                      {item.action}
                    </Text>
                    <Text style={[styles.breakdownValue, { color: theme.colors.primary }]}>
                      {formatValue(item.count)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Most Active Users */}
            {engagementData.most_active_users && engagementData.most_active_users.length > 0 && (
              <View style={styles.usersContainer}>
                <Text
                  style={[
                    styles.sectionTitle,
                    styles.usersSectionTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  أكثر المستخدمين نشاطاً
                </Text>
                {engagementData.most_active_users.slice(0, 5).map((item: any, index: number) => (
                  <View key={index} style={[styles.userItem, { borderBottomColor: theme.colors.border }]}>
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: theme.colors.text }]}>
                        {item.user?.name || item.user?.email || 'مستخدم'}
                      </Text>
                      <Text style={[styles.userActivity, { color: theme.colors.textSecondary }]}>
                        {formatValue(item.activity_count)} نشاط
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dataRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dataInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  dataValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statCard: {
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  breakdownContainer: {
    marginTop: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  breakdownLabel: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  usersContainer: {
    marginTop: 16,
  },
  usersSectionTitle: {
    marginTop: 16,
  },
  userItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  userActivity: {
    fontSize: 12,
  },
});

const createDynamicStyles = (theme: any) =>
  StyleSheet.create({
    filterTabActive: {
      backgroundColor: theme.colors.primary,
    },
    filterTextActive: {
      color: '#FFFFFF',
    },
    filterTextInactive: {
      color: theme.colors.text,
    },
  });

