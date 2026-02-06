import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { marketingAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const MarketingCampaignsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      // Note: This endpoint might need to be added to backend for users to get available campaigns
      // For now, using getCampaigns with user filter
      const response = await marketingAPI.getCampaigns({ status: 'active' });
      const campaignsData = response.data || response || [];
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل الحملات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>الحملات التسويقية</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadCampaigns();
            }}
            colors={[theme.colors.primary]}
          />
        }
      >
        {campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <View key={campaign.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                    {campaign.name}
                  </Text>
                  {campaign.description && (
                    <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
                      {campaign.description}
                    </Text>
                  )}
                  <View style={styles.campaignMeta}>
                    <View style={styles.metaItem}>
                      <SafeIcon name="megaphone" size={16} color={theme.colors.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                        {campaign.type}
                      </Text>
                    </View>
                    {campaign.startDate && (
                      <View style={styles.metaItem}>
                        <SafeIcon name="calendar" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                          {new Date(campaign.startDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: campaign.isActive ? theme.colors.success + '20' : theme.colors.error + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: campaign.isActive ? theme.colors.success : theme.colors.error },
                    ]}
                  >
                    {campaign.isActive ? 'نشط' : 'غير نشط'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <SafeIcon name="megaphone" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد حملات متاحة
            </Text>
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
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  campaignMeta: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});

