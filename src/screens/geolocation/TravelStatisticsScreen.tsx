import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { geolocationService, type TravelStatistics } from '../../services/geolocationService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SafeIcon } from '../../utils/iconHelper';
import Toast from 'react-native-toast-message';

export const TravelStatisticsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<TravelStatistics | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await geolocationService.getTravelStatistics();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: error.message || t('failed_to_load_statistics'),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStatistics();
  };

  const StatCard = ({ icon, label, value, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <SafeIcon name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
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
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <SafeIcon name="stats-chart" size={32} color="#FFFFFF" />
        <Text style={styles.headerTitle}>{t('travel_statistics')}</Text>
        <Text style={styles.headerSubtitle}>{t('your_travel_insights')}</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          icon="location"
          label={t('total_locations')}
          value={stats?.totalLocations || 0}
          color={theme.colors.primary}
        />
        <StatCard
          icon="flag"
          label={t('countries_visited')}
          value={stats?.countriesVisited || 0}
          color={theme.colors.success}
        />
        <StatCard
          icon="business"
          label={t('cities_visited')}
          value={stats?.citiesVisited || 0}
          color={theme.colors.info}
        />
        <StatCard
          icon="airplane"
          label={t('total_distance')}
          value={`${(stats?.totalDistance || 0).toFixed(0)} km`}
          color={theme.colors.warning}
        />
      </View>

      {stats?.favoriteDestinations && stats.favoriteDestinations.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('favorite_destinations')}
          </Text>
          {stats.favoriteDestinations.map((dest, index) => (
            <View
              key={index}
              style={[styles.destinationCard, { backgroundColor: theme.colors.surface }]}
            >
              <View style={styles.destinationRank}>
                <Text style={[styles.rankText, { color: theme.colors.primary }]}>
                  #{index + 1}
                </Text>
              </View>
              <View style={styles.destinationInfo}>
                <Text style={[styles.destinationName, { color: theme.colors.text }]}>
                  {dest.location}
                </Text>
                <Text style={[styles.destinationCount, { color: theme.colors.textSecondary }]}>
                  {dest.visitCount} {t('visits')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  destinationRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  destinationCount: {
    fontSize: 14,
  },
});

