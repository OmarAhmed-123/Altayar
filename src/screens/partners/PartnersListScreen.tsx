import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { partnerService, type Partner } from '../../services/partnerService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SafeIcon } from '../../utils/iconHelper';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../stores/authStore';

export const PartnersListScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadPartners();
  }, [filter]);

  const loadPartners = async () => {
    try {
      const response = await partnerService.getPartners({
        status: filter !== 'all' ? filter : undefined,
      });
      if (response.success) {
        setPartners(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: error.message || t('failed_to_load_partners'),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPartners();
  };

  const handleApprove = async (id: number) => {
    Alert.alert(
      t('confirm'),
      t('are_you_sure_approve_partner'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('approve'),
          onPress: async () => {
            try {
              const response = await partnerService.approvePartner(id);
              if (response.success) {
                Toast.show({
                  type: 'success',
                  text1: t('success'),
                  text2: t('partner_approved_successfully'),
                });
                loadPartners();
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: t('error'),
                text2: error.message || t('failed_to_approve_partner'),
              });
            }
          },
        },
      ]
    );
  };

  const handleSuspend = async (id: number) => {
    Alert.alert(
      t('confirm'),
      t('are_you_sure_suspend_partner'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('suspend'),
          onPress: async () => {
            try {
              const response = await partnerService.suspendPartner(id);
              if (response.success) {
                Toast.show({
                  type: 'success',
                  text1: t('success'),
                  text2: t('partner_suspended_successfully'),
                });
                loadPartners();
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: t('error'),
                text2: error.message || t('failed_to_suspend_partner'),
              });
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'suspended':
        return theme.colors.error;
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderPartner = ({ item }: { item: Partner }) => (
    <View style={[styles.partnerCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.partnerHeader}>
        <View style={styles.partnerInfo}>
          <Text style={[styles.partnerName, { color: theme.colors.text }]}>
            {item.company_name}
          </Text>
          <Text style={[styles.partnerContact, { color: theme.colors.textSecondary }]}>
            {item.contact_person}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {t(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.partnerDetails}>
        <View style={styles.detailRow}>
          <SafeIcon name="mail" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            {item.email}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <SafeIcon name="call" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            {item.phone}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <SafeIcon name="business" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            {t(item.business_type)}
          </Text>
        </View>
      </View>

      {user?.role === 'super_admin' || user?.role === 'admin' ? (
        <View style={styles.actions}>
          {item.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                onPress={() => handleApprove(item.id)}
              >
                <SafeIcon name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>{t('approve')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                onPress={() => handleSuspend(item.id)}
              >
                <SafeIcon name="close-circle" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>{t('reject')}</Text>
              </TouchableOpacity>
            </>
          )}
          {item.status === 'approved' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
              onPress={() => handleSuspend(item.id)}
            >
              <SafeIcon name="pause-circle" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{t('suspend')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </View>
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
      <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface }]}>
        {['all', 'pending', 'approved', 'suspended'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === status ? theme.colors.primary : theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setFilter(status)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === status ? '#FFFFFF' : theme.colors.text },
              ]}
            >
              {t(status)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={partners}
        renderItem={renderPartner}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="business-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('no_partners_found')}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  partnerCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  partnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  partnerContact: {
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
  partnerDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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

