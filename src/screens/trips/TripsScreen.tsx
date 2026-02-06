import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { AnimatedCard } from './../../components/animations/AnimatedCard';
import { ExpressiveEmptyState } from './../../components/common/ExpressiveEmptyState';
import { tripService } from './../../services/tripService';
// Mock data removed - using real backend data only
import { Trip } from './../../types';
import { getIconImageUrls } from './../../utils/imageUtils';
import { ensureStringUri } from './../../utils/imageUriHelper';
import { SafeIcon } from './../../utils/iconHelper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Icon = MaterialIcons;

export const TripsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [iconImages, setIconImages] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTrips();
    loadIconImages();
  }, []);

  const loadIconImages = async () => {
    try {
      const icons = ['add', 'place', 'calendar-today', 'public', 'lock'];
      const images = await getIconImageUrls(icons, 24, 24);
      setIconImages(images);
    } catch (error) {
      console.error('Error loading icon images:', error);
    }
  };

  const loadTrips = async () => {
    setIsLoading(true);
    try {
      // Use real backend API
      const response = await tripService.getMyTrips();
      // Transform backend trip data to frontend format
      const transformedTrips: Trip[] = Array.isArray(response) ? response.map(trip => ({
        ...trip,
        startDate: trip.start_date || trip.startDate || '',
        endDate: trip.end_date || trip.endDate || '',
        isPublic: trip.isPublic !== undefined ? trip.isPublic : true,
      })) : [];
      
      setTrips(transformedTrips);
    } catch (error: any) {
      Alert.alert('خطأ', 'فشل في تحميل الرحلات');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const renderTripCard = ({ item, index }: { item: Trip; index: number }) => (
    <AnimatedCard
      style={styles.tripCard}
      animationType="slide"
      delay={index * 100}
      onPress={() => console.log('View trip details')}
    >
      <Image
        source={{ uri: 'https://via.placeholder.com/300x200' }}
        style={styles.tripImage}
      />
      <View style={styles.tripContent}>
        <View style={styles.tripHeader}>
          <Text style={styles.tripTitle}>{item.title}</Text>
          <View style={styles.visibilityBadge}>
            {(() => {
              const iconKey = item.isPublic ? 'public' : 'lock';
              const iconUri = ensureStringUri(iconImages[iconKey]);
              return iconUri ? (
                <Image source={{ uri: iconUri }} style={{ width: 16, height: 16 }} resizeMode="contain" />
              ) : (
                <Icon
                  name={item.isPublic ? 'public' : 'lock'}
                  size={16}
                  color={theme.colors.textSecondary}
                />
              );
            })()}
          </View>
        </View>
        
        <Text style={styles.tripDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.destinationsContainer}>
          {iconImages['place'] ? (
            <Image source={{ uri: iconImages['place'] }} style={{ width: 16, height: 16, marginRight: 8 }} resizeMode="contain" />
          ) : (
            <SafeIcon name="place" size={16} color={theme.colors.primary} />
          )}
          <Text style={styles.destinationsText}>
            {Array.isArray(item.destinations) && item.destinations.length > 0
              ? item.destinations.join(' • ')
              : ((item as any).destination || (item as any).location || '')}
          </Text>
        </View>
        
        <View style={styles.tripFooter}>
          <View style={styles.dateContainer}>
            {iconImages['calendar-today'] ? (
              <Image source={{ uri: iconImages['calendar-today'] }} style={{ width: 16, height: 16, marginRight: 8 }} resizeMode="contain" />
            ) : (
              <SafeIcon name="calendar-today" size={16} color={theme.colors.textSecondary} />
            )}
            <Text style={styles.dateText}>
              {item.startDate ? new Date(item.startDate).toLocaleDateString('ar-SA') : 'غير محدد'} -{' '}
              {item.endDate ? new Date(item.endDate).toLocaleDateString('ar-SA') : 'غير محدد'}
            </Text>
          </View>
          <View style={styles.durationContainer}>
            {iconImages[item.isPublic ? 'public' : 'lock'] ? (
              <Image source={{ uri: iconImages[item.isPublic ? 'public' : 'lock'] }} style={{ width: 16, height: 16, marginRight: 4 }} resizeMode="contain" />
            ) : (
              <SafeIcon name={item.isPublic ? 'public' : 'lock'} size={16} color={theme.colors.textSecondary} />
            )}
            <Text style={styles.durationText}>
              {item.startDate && item.endDate
                ? Math.max(
                    1,
                    Math.ceil(
                      (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    ),
                  )
                : 'غير محدد'}{' '}
              أيام
            </Text>
          </View>
        </View>
      </View>
    </AnimatedCard>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    flatList: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    tripCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.lg,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    tripImage: {
      width: '100%',
      height: 200,
    },
    tripContent: {
      padding: theme.spacing.lg,
    },
    tripHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    tripTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    visibilityBadge: {
      padding: theme.spacing.xs,
    },
    tripDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: theme.spacing.md,
    },
    destinationsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    destinationsText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
      flex: 1,
    },
    tripFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    dateText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    durationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    durationText: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل الرحلات..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>رحلاتي</Text>
          <TouchableOpacity style={styles.addButton}>
            {iconImages['add'] ? (
              <Image source={{ uri: iconImages['add'] }} style={{ width: 24, height: 24 }} resizeMode="contain" />
            ) : (
              <SafeIcon name="add" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>إدارة وتتبع رحلاتك الشخصية</Text>
      </View>

      {trips.length > 0 ? (
        <FlatList
          style={styles.flatList}
          data={trips}
          renderItem={renderTripCard}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ExpressiveEmptyState
          title="لا توجد رحلات"
          message="ابدأ بإنشاء رحلتك الأولى"
          imageCategory="trip"
        />
      )}
    </View>
  );
};