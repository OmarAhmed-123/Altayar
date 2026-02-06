import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { geolocationService, type VisitedLocation } from '../../services/geolocationService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SafeIcon } from '../../utils/iconHelper';
import Toast from 'react-native-toast-message';

export const VisitedLocationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locations, setLocations] = useState<VisitedLocation[]>([]);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await geolocationService.getVisitedLocations();
      if (response.success) {
        setLocations(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: error.message || t('failed_to_load_locations'),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLocations();
  };

  const renderLocation = ({ item }: { item: VisitedLocation }) => (
    <View style={[styles.locationCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.locationHeader}>
        <View style={[styles.locationIcon, { backgroundColor: theme.colors.primary + '20' }]}>
          <SafeIcon name="location" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.locationInfo}>
          <Text style={[styles.locationName, { color: theme.colors.text }]}>
            {item.location_name}
          </Text>
          <Text style={[styles.locationAddress, { color: theme.colors.textSecondary }]}>
            {item.city ? `${item.city}, ` : ''}{item.country}
          </Text>
        </View>
      </View>

      {item.visit_date && (
        <View style={styles.locationDetail}>
          <SafeIcon name="calendar" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.locationDetailText, { color: theme.colors.textSecondary }]}>
            {new Date(item.visit_date).toLocaleDateString()}
          </Text>
        </View>
      )}

      {item.notes && (
        <Text style={[styles.locationNotes, { color: theme.colors.textSecondary }]}>
          {item.notes}
        </Text>
      )}
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
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <SafeIcon name="map" size={32} color="#FFFFFF" />
        <Text style={styles.headerTitle}>{t('visited_locations')}</Text>
        <Text style={styles.headerSubtitle}>{t('your_travel_history')}</Text>
      </View>

      <FlatList
        data={locations}
        renderItem={renderLocation}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="location-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('no_locations_found')}
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
  locationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
  },
  locationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationDetailText: {
    fontSize: 14,
  },
  locationNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
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

