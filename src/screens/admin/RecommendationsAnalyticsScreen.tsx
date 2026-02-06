import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { recommendationAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';

export const RecommendationsAnalyticsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [userInsights, setUserInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserInsights();
  }, []);

  const loadUserInsights = async () => {
    try {
      setLoading(true);
      const response = await recommendationAPI.getUserInsights();
      setUserInsights(response.data || response || {});
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل الإحصائيات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>تحليلات التوصيات</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadUserInsights();
            }}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* User Insights */}
        {userInsights && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              رؤى المستخدمين
            </Text>
            
            <View style={styles.insightRow}>
              <View style={styles.insightItem}>
                <Text style={[styles.insightLabel, { color: theme.colors.textSecondary }]}>
                  إجمالي المشاهدات
                </Text>
                <Text style={[styles.insightValue, { color: theme.colors.text }]}>
                  {userInsights.totalViews || 0}
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={[styles.insightLabel, { color: theme.colors.textSecondary }]}>
                  معدل التحويل
                </Text>
                <Text style={[styles.insightValue, { color: theme.colors.text }]}>
                  {userInsights.conversionRate || '0%'}
                </Text>
              </View>
            </View>

            <View style={styles.insightRow}>
              <View style={styles.insightItem}>
                <Text style={[styles.insightLabel, { color: theme.colors.textSecondary }]}>
                  الباقات المفضلة
                </Text>
                <Text style={[styles.insightValue, { color: theme.colors.text }]}>
                  {userInsights.favoriteCategories?.length || 0}
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={[styles.insightLabel, { color: theme.colors.textSecondary }]}>
                  متوسط التقييم
                </Text>
                <Text style={[styles.insightValue, { color: theme.colors.text }]}>
                  {userInsights.averageRating || '0.0'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Popular Categories */}
        {userInsights?.popularCategories && userInsights.popularCategories.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              الفئات الشائعة
            </Text>
            {userInsights.popularCategories.map((category: any, index: number) => (
              <View key={index} style={[styles.categoryItem, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                  {category.name || category}
                </Text>
                <Text style={[styles.categoryCount, { color: theme.colors.primary }]}>
                  {category.count || 0}
                </Text>
              </View>
            ))}
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
    fontWeight: 'bold',
    marginBottom: 16,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  insightItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  insightLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analyticsItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  analyticsLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

