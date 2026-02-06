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
import { fileManagementAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const FileManagementStatisticsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [statistics, setStatistics] = useState<any>(null);
  const [popularDownloads, setPopularDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsResponse, popularResponse] = await Promise.all([
        fileManagementAPI.getDownloadStatistics(),
        fileManagementAPI.getPopularDownloads(),
      ]);
      
      setStatistics(statsResponse.data || statsResponse || {});
      const popularData = popularResponse.data || popularResponse || [];
      setPopularDownloads(Array.isArray(popularData) ? popularData : []);
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إحصائيات إدارة الملفات</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <SafeIcon name="download" size={32} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {statistics?.totalDownloads || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              إجمالي التحميلات
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <SafeIcon name="people" size={32} color={theme.colors.secondary} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {statistics?.uniqueUsers || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              مستخدمين فريدين
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <SafeIcon name="document" size={32} color="#FF9800" />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {statistics?.fileTypes || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              أنواع الملفات
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <SafeIcon name="trending-up" size={32} color={theme.colors.success} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {statistics?.growthRate || '0%'}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              معدل النمو
            </Text>
          </View>
        </View>

        {/* Popular Downloads */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            التحميلات الشائعة
          </Text>
          {popularDownloads.length > 0 ? (
            popularDownloads.map((item, index) => (
              <View key={index} style={[styles.popularItem, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.popularInfo}>
                  <Text style={[styles.popularName, { color: theme.colors.text }]}>
                    {item.fileName || item.file_type || 'ملف'}
                  </Text>
                  <Text style={[styles.popularCount, { color: theme.colors.textSecondary }]}>
                    {item.downloadCount || 0} تحميل
                  </Text>
                </View>
                <SafeIcon name="download" size={20} color={theme.colors.primary} />
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد تحميلات شائعة
            </Text>
          )}
        </View>

        {/* File Type Breakdown */}
        {statistics?.fileTypeBreakdown && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              توزيع أنواع الملفات
            </Text>
            {Object.entries(statistics.fileTypeBreakdown).map(([type, count]: [string, any]) => (
              <View key={type} style={[styles.typeItem, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.typeName, { color: theme.colors.text }]}>{type}</Text>
                <Text style={[styles.typeCount, { color: theme.colors.primary }]}>{count}</Text>
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
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
  popularItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  popularInfo: {
    flex: 1,
  },
  popularName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  popularCount: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  typeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

