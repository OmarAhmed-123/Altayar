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
import { travelCompanionAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const TravelCompanionItinerariesManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(theme), [theme]);
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'current' | 'past'>('all');

  const loadItineraries = useCallback(async () => {
    try {
      setLoading(true);
      // Note: This endpoint might need to be added to backend for admin to get all itineraries
      // For now, using getUserItineraries as a placeholder
      const filters: any = {};
      if (filter !== 'all') {
        filters.status = filter;
      }
      const response = await travelCompanionAPI.getUserItineraries(filters);
      const itinerariesData = response.data || response || [];
      setItineraries(Array.isArray(itinerariesData) ? itinerariesData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل البرامج السياحية',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadItineraries();
  }, [loadItineraries]);

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة البرامج السياحية</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'upcoming', 'current', 'past'] as const).map((status) => (
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
              {status === 'all' ? 'الكل' : status === 'upcoming' ? 'قادمة' : status === 'current' ? 'جارية' : 'ماضية'}
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
              loadItineraries();
            }}
            colors={[theme.colors.primary]}
          />
        }
      >
        {itineraries.map((itinerary) => (
          <View key={itinerary.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {itinerary.title}
                </Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  {itinerary.user?.firstName} {itinerary.user?.lastName} • {itinerary.user?.email}
                </Text>
                {itinerary.startDate && itinerary.endDate && (
                  <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                    {new Date(itinerary.startDate).toLocaleDateString()} - {new Date(itinerary.endDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: theme.colors.primary + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: theme.colors.primary },
                  ]}
                >
                  {itinerary.status || 'قادمة'}
                </Text>
              </View>
            </View>

            {itinerary.destinations && itinerary.destinations.length > 0 && (
              <View style={styles.destinationsContainer}>
                <Text style={[styles.destinationsLabel, { color: theme.colors.textSecondary }]}>
                  الوجهات:
                </Text>
                <Text style={[styles.destinationsText, { color: theme.colors.text }]}>
                  {Array.isArray(itinerary.destinations) ? itinerary.destinations.join(', ') : itinerary.destinations}
                </Text>
              </View>
            )}

            {itinerary.isShared && (
              <View style={styles.shareContainer}>
                <SafeIcon name="share" size={16} color={theme.colors.primary} />
                <Text style={[styles.shareText, { color: theme.colors.primary }]}>
                  مشارك • {itinerary.shareCode || 'N/A'}
                </Text>
              </View>
            )}
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
  shareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  shareText: {
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

