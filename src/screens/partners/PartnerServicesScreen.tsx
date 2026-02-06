import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { partnerService, type PartnerService as PartnerServiceType } from '../../services/partnerService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SafeIcon } from '../../utils/iconHelper';
import Toast from 'react-native-toast-message';

export const PartnerServicesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<PartnerServiceType[]>([]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await partnerService.getAvailableServices();
      if (response.success) {
        setServices(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: error.message || t('failed_to_load_services'),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const renderService = ({ item }: { item: PartnerServiceType }) => (
    <TouchableOpacity
      style={[styles.serviceCard, { backgroundColor: theme.colors.surface }]}
      activeOpacity={0.7}
    >
      <View style={styles.serviceHeader}>
        <View style={[styles.serviceIcon, { backgroundColor: theme.colors.primary + '20' }]}>
          <SafeIcon name="star" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          {item.category && (
            <Text style={[styles.serviceCategory, { color: theme.colors.textSecondary }]}>
              {t(item.category)}
            </Text>
          )}
        </View>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: theme.colors.primary }]}>
            {item.price} {t('currency')}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={[styles.serviceDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.serviceFooter}>
        {item.duration && (
          <View style={styles.serviceDetail}>
            <SafeIcon name="time" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.serviceDetailText, { color: theme.colors.textSecondary }]}>
              {item.duration} {t('hours')}
            </Text>
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: item.is_active ? theme.colors.success + '20' : theme.colors.error + '20' }]}>
          <Text style={[styles.statusText, { color: item.is_active ? theme.colors.success : theme.colors.error }]}>
            {item.is_active ? t('available') : t('unavailable')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <SafeIcon name="business" size={24} color="#FFFFFF" />
        <Text style={styles.headerTitle}>{t('partner_services')}</Text>
        <Text style={styles.headerSubtitle}>{t('available_services_from_partners')}</Text>
      </View>

      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="business-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('no_services_available')}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  serviceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 14,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  serviceDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceDetailText: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});

