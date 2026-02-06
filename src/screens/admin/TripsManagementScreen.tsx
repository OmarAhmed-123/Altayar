import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { tripAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const TripsManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(theme), [theme]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted' | 'approved'>('all');

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tripAPI.getAllTrips();
      const tripsData = response.data || response || [];
      let filteredTrips = Array.isArray(tripsData) ? tripsData : [];
      
      if (filter !== 'all') {
        filteredTrips = filteredTrips.filter((trip: any) => trip.status === filter);
      }
      
      setTrips(filteredTrips);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل الرحلات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleUpdateStatus = async (tripId: number, newStatus: string) => {
    try {
      await tripAPI.updateTripStatus(tripId.toString(), newStatus);
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم تحديث حالة الرحلة بنجاح',
      });
      loadTrips();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحديث حالة الرحلة',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return theme.colors.success;
      case 'submitted':
        return '#FF9800';
      case 'draft':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'موافق';
      case 'submitted':
        return 'مقدم';
      case 'draft':
        return 'مسودة';
      default:
        return status;
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة الرحلات</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'draft', 'submitted', 'approved'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              filter === status ? dynamicStyles.tabActive : null,
            ]}
            onPress={() => setFilter(status)}
          >
            <Text
              style={[
                styles.filterText,
                filter === status
                  ? dynamicStyles.tabTextActive
                  : dynamicStyles.tabTextInactive,
              ]}
            >
              {status === 'all' ? 'الكل' : status === 'draft' ? 'مسودة' : status === 'submitted' ? 'مقدم' : 'موافق'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadTrips();
            }}
            colors={[theme.colors.primary]}
          />
        }
      >
        {trips.map((trip) => (
          <View key={trip.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{trip.title}</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  {trip.user?.firstName} {trip.user?.lastName} • {trip.user?.email}
                </Text>
                {trip.start_date && trip.end_date && (
                  <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                    {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(trip.status) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(trip.status) },
                  ]}
                >
                  {getStatusLabel(trip.status)}
                </Text>
              </View>
            </View>

            {trip.destinations && trip.destinations.length > 0 && (
              <View style={styles.destinationsContainer}>
                <Text style={[styles.destinationsLabel, { color: theme.colors.textSecondary }]}>
                  الوجهات:
                </Text>
                <Text style={[styles.destinationsText, { color: theme.colors.text }]}>
                  {Array.isArray(trip.destinations) ? trip.destinations.join(', ') : trip.destinations}
                </Text>
              </View>
            )}

            <View style={styles.cardActions}>
              {trip.status === 'submitted' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.success + '20' }]}
                    onPress={() => {
                      Alert.alert(
                        'الموافقة على الرحلة',
                        'هل أنت متأكد من الموافقة على هذه الرحلة?',
                        [
                          { text: 'إلغاء', style: 'cancel' },
                          {
                            text: 'موافقة',
                            onPress: () => handleUpdateStatus(trip.id, 'approved'),
                          },
                        ]
                      );
                    }}
                  >
                    <SafeIcon name="checkmark-circle" size={18} color={theme.colors.success} />
                    <Text style={[styles.actionText, { color: theme.colors.success }]}>موافقة</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.error + '20' }]}
                    onPress={() => {
                      Alert.alert(
                        'رفض الرحلة',
                        'هل أنت متأكد من رفض هذه الرحلة?',
                        [
                          { text: 'إلغاء', style: 'cancel' },
                          {
                            text: 'رفض',
                            style: 'destructive',
                            onPress: () => handleUpdateStatus(trip.id, 'draft'),
                          },
                        ]
                      );
                    }}
                  >
                    <SafeIcon name="close-circle" size={18} color={theme.colors.error} />
                    <Text style={[styles.actionText, { color: theme.colors.error }]}>رفض</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 2,
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
  destinationsContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  destinationsLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  destinationsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

const createDynamicStyles = (theme: any) =>
  StyleSheet.create({
    tabActive: {
      backgroundColor: theme.colors.primary,
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
    tabTextInactive: {
      color: theme.colors.text,
    },
  });

