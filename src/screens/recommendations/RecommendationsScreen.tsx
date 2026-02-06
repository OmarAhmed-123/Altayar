import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { recommendationService } from './../../services/recommendationService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

interface Package {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  location?: string;
  duration?: number;
}

export const RecommendationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const nav = navigation as any;
  const { theme } = useTheme();
  const [trendingPackages, setTrendingPackages] = useState<Package[]>([]);
  const [personalizedPackages, setPersonalizedPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'trending' | 'personalized'>('trending');

  useEffect(() => {
    loadRecommendations();
  }, [activeTab]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      if (activeTab === 'trending') {
        const response = await recommendationService.getTrendingPackages();
        const packagesData = response.data || response || [];
        setTrendingPackages(Array.isArray(packagesData) ? packagesData : []);
      } else {
        const response = await recommendationService.getPersonalizedRecommendations();
        const packagesData = response.data || response || [];
        setPersonalizedPackages(Array.isArray(packagesData) ? packagesData : []);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل التوصيات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const renderPackageItem = ({ item }: { item: Package }) => (
    <TouchableOpacity
      style={[styles.packageCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => nav.navigate('PackageDetails', { packageId: item.id.toString() })}
    >
      {item.imageUrl && (
        <View style={styles.imageContainer}>
          <Text style={[styles.imagePlaceholder, { color: theme.colors.textSecondary }]}>
            {item.imageUrl.substring(0, 50)}...
          </Text>
        </View>
      )}
      <View style={styles.packageInfo}>
        <Text style={[styles.packageTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description && (
          <Text style={[styles.packageDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.packageFooter}>
          {item.location && (
            <View style={styles.locationContainer}>
              <SafeIcon name="location-on" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.locationText, { color: theme.colors.textSecondary }]}>
                {item.location}
              </Text>
            </View>
          )}
          <Text style={[styles.packagePrice, { color: theme.colors.primary }]}>
            {formatCurrency(item.price)}
          </Text>
        </View>
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

  const packages = activeTab === 'trending' ? trendingPackages : personalizedPackages;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>التوصيات</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          اكتشف أفضل الباقات المناسبة لك
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'trending' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('trending')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'trending' ? '#FFFFFF' : theme.colors.text },
            ]}
          >
            الرائجة
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'personalized' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('personalized')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'personalized' ? '#FFFFFF' : theme.colors.text },
            ]}
          >
            مخصصة لك
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={packages}
        renderItem={renderPackageItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadRecommendations();
            }}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="star-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {activeTab === 'trending'
                ? 'لا توجد باقات رائجة حالياً'
                : 'لا توجد توصيات مخصصة لك'}
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
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  packageCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    height: 200,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 12,
  },
  packageInfo: {
    padding: 16,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

