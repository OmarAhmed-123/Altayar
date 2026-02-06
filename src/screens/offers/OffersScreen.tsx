import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { API } from './../../services/apiClient';
// Mock data removed - using real backend data only
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { ExpressiveEmptyState } from './../../components/common/ExpressiveEmptyState';
import { ensureStringUri } from './../../utils/imageUriHelper';
import { SafeIcon } from './../../utils/iconHelper';

export const OffersScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setIsLoading(true);
    try {
      // Load packages as offers - use real backend API
      const packagesResponse = await API.package.getPackages();
      const packages = Array.isArray(packagesResponse) 
        ? packagesResponse 
        : ((packagesResponse as any).data || []);
      
      // Filter active packages and format as offers
      const activeOffers = packages
        .filter((pkg: any) => pkg.is_active !== false)
        .slice(0, 10)
        .map((pkg: any) => ({
          id: pkg.id,
          title: pkg.title || pkg.name,
          description: pkg.description,
          image: pkg.imageUrl || pkg.images?.[0],
          price: pkg.price,
          discount: pkg.discount || 0,
        }));
      
      setOffers(activeOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOffers();
    setRefreshing(false);
  };

  if (isLoading) {
    return <LoadingSpinner text="جاري التحميل..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>العروض المتاحة</Text>
        {offers.length > 0 ? (
          offers.map((offer) => (
            <TouchableOpacity 
              key={offer.id} 
              style={[styles.offerCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => {
                // Navigate to package details through HomeStack
                (navigation as any).navigate('Home', {
                  screen: 'PackageDetails',
                  params: { packageId: offer.id.toString() },
                });
              }}
            >
              {(() => {
                const imageUri = ensureStringUri(offer.image);
                return imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.offerImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.offerImage, { backgroundColor: theme.colors.primary + '20', justifyContent: 'center', alignItems: 'center' }]}>
                    <SafeIcon name="local-offer" size={40} color={theme.colors.primary} />
                  </View>
                );
              })()}
              <View style={styles.offerContent}>
                <Text style={[styles.offerTitle, { color: theme.colors.text }]}>{offer.title}</Text>
                <Text style={[styles.offerDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                  {offer.description}
                </Text>
                <View style={styles.offerFooter}>
                  <Text style={[styles.offerPrice, { color: theme.colors.primary }]}>
                    ${offer.price}
                  </Text>
                  {offer.discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>-{offer.discount}%</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <ExpressiveEmptyState
            title="لا توجد عروض متاحة حالياً"
            message="سيتم إضافة عروض جديدة قريباً"
            imageCategory="offers"
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  offerCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offerImage: {
    width: '100%',
    height: 200,
  },
  offerContent: {
    padding: 16,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  offerDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  discountBadge: {
    backgroundColor: '#00C853',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
