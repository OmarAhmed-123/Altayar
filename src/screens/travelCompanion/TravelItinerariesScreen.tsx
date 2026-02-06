import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { travelCompanionAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';
import type { ProfileScreenProps } from './../../types/navigation';

interface Itinerary {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  destinations?: string[];
  status?: 'upcoming' | 'current' | 'past';
  isShared?: boolean;
  shareCode?: string;
  created_at?: string;
}

type Props = ProfileScreenProps<'TravelItineraries'>;

export const TravelItinerariesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'current'>('all');

  useEffect(() => {
    loadItineraries();
  }, [filter]);

  const loadItineraries = async () => {
    try {
      setLoading(true);
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
  };

  const handleShareItinerary = async (itinerary: Itinerary) => {
    try {
      await travelCompanionAPI.shareItinerary(itinerary.id, !itinerary.isShared);
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: itinerary.isShared ? 'تم إلغاء مشاركة البرنامج' : 'تم مشاركة البرنامج بنجاح',
      });
      loadItineraries();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحديث حالة المشاركة',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      upcoming: theme.colors.primary,
      current: theme.colors.success,
      past: theme.colors.textSecondary,
    };
    return colors[status || 'upcoming'] || theme.colors.textSecondary;
  };

  const getStatusName = (status?: string) => {
    const names: Record<string, string> = {
      upcoming: 'قادم',
      current: 'جاري',
      past: 'منتهي',
    };
    return names[status || 'upcoming'] || 'غير محدد';
  };

  const renderItineraryItem = ({ item }: { item: Itinerary }) => (
  <TouchableOpacity
    style={[styles.itineraryCard, { backgroundColor: theme.colors.surface }]}
    onPress={() => {
      Alert.alert('قريباً', 'تفاصيل البرنامج ستكون متاحة قريباً.');
    }}
  >
      <View style={styles.itineraryHeader}>
        <View style={styles.itineraryInfo}>
          <Text style={[styles.itineraryTitle, { color: theme.colors.text }]}>{item.title}</Text>
          {item.description && (
            <Text style={[styles.itineraryDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusName(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.itineraryDetails}>
        <View style={styles.detailRow}>
          <SafeIcon name="calendar-today" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </Text>
        </View>
        {item.destinations && item.destinations.length > 0 && (
          <View style={styles.detailRow}>
            <SafeIcon name="location-on" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.destinations.join(', ')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: item.isShared ? theme.colors.success + '20' : '#F5F5F5' },
          ]}
          onPress={() => handleShareItinerary(item)}
        >
          <SafeIcon
            name={item.isShared ? 'share' : 'share-outline'}
            size={18}
            color={item.isShared ? theme.colors.success : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.actionText,
              { color: item.isShared ? theme.colors.success : theme.colors.textSecondary },
            ]}
          >
            {item.isShared ? 'مشارك' : 'مشاركة'}
          </Text>
        </TouchableOpacity>
        {item.shareCode && (
          <View style={styles.shareCodeContainer}>
            <Text style={[styles.shareCodeLabel, { color: theme.colors.textSecondary }]}>
              كود: {item.shareCode}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>البرامج السياحية</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {itineraries.length} برنامج
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === 'all' ? '#FFFFFF' : theme.colors.text },
            ]}
          >
            الكل
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'upcoming' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setFilter('upcoming')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === 'upcoming' ? '#FFFFFF' : theme.colors.text },
            ]}
          >
            قادمة
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'current' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setFilter('current')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === 'current' ? '#FFFFFF' : theme.colors.text },
            ]}
          >
            جارية
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'past' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setFilter('past')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === 'past' ? '#FFFFFF' : theme.colors.text },
            ]}
          >
            منتهية
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() =>
          navigation.navigate('CreateItinerary', {
            suggestedDestinations:
              filter !== 'all' && itineraries.length > 0 ? itineraries[0].destinations : undefined,
          })
        }
      >
        <SafeIcon name="add" size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>برنامج جديد</Text>
      </TouchableOpacity>

      <FlatList
        data={itineraries}
        renderItem={renderItineraryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="flight" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد برامج سياحية
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  itineraryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itineraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itineraryInfo: {
    flex: 1,
  },
  itineraryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  itineraryDescription: {
    fontSize: 14,
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
  itineraryDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  shareCodeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shareCodeLabel: {
    fontSize: 12,
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

