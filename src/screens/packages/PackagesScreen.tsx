import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePackageStore } from './../../stores/packageStore';
// Mock data removed - using real backend data only
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { AnimatedCard } from './../../components/animations/AnimatedCard';
import { ExpressiveEmptyState } from './../../components/common/ExpressiveEmptyState';
import { getIconImageUrls } from './../../utils/imageUtils';
import { ensureStringUri } from './../../utils/imageUriHelper';
import { SafeIcon } from './../../utils/iconHelper';

export const PackagesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { packages, isLoading, fetchPackages } = usePackageStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filteredPackages, setFilteredPackages] = useState(packages);
  const [iconImages, setIconImages] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPackages();
    loadIconImages();
  }, [fetchPackages]);

  const loadIconImages = async () => {
    try {
      const icons = ['search', 'schedule', 'star'];
      const images = await getIconImageUrls(icons, 20, 20);
      setIconImages(images);
    } catch (error) {
      console.error('Error loading icon images:', error);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPackages(packages);
    } else {
      const filtered = packages.filter(
        (pkg) =>
          (pkg.title || pkg.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (pkg.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (pkg.location || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPackages(filtered);
    }
  }, [searchQuery, packages]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPackages();
    setRefreshing(false);
  };

  const renderPackageCard = ({ item, index }: { item: any; index: number }) => (
    <AnimatedCard
      style={styles.packageCard}
      animationType="slide"
      delay={index * 100}
      onPress={() => {
        const nav = navigation as any;
        nav.navigate('PackageDetails', { packageId: item.id.toString() });
      }}
    >
      {(() => {
        const imageUri = ensureStringUri(
          (item.images && item.images[0]) || item.image || item.imageUrl,
          'https://via.placeholder.com/300x200'
        );
        return imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.packageImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.packageImage, { backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
            <SafeIcon name="image" size={40} color={theme.colors.textSecondary} />
          </View>
        );
      })()}
      <View style={styles.packageContent}>
        <Text style={styles.packageTitle}>{item.title || item.name || 'باقة سياحية'}</Text>
        <Text style={styles.packageDescription} numberOfLines={2}>
          {item.description || 'وصف الباقة'}
        </Text>
        <Text style={styles.packageLocation}>{item.location || 'موقع الباقة'}</Text>
        <View style={styles.packageFooter}>
          <View style={styles.packageInfo}>
            {(() => {
              const iconUri = ensureStringUri(iconImages['schedule']);
              return iconUri ? (
                <Image source={{ uri: iconUri }} style={{ width: 16, height: 16, marginRight: 4 }} resizeMode="contain" />
              ) : (
                <SafeIcon name="schedule" size={16} color={theme.colors.textSecondary} />
              );
            })()}
            <Text style={styles.packageDuration}>{item.duration || item.days || 0} أيام</Text>
          </View>
          <View style={styles.ratingContainer}>
            {(() => {
              const iconUri = ensureStringUri(iconImages['star']);
              return iconUri ? (
                <Image source={{ uri: iconUri }} style={{ width: 16, height: 16, marginRight: 4 }} resizeMode="contain" />
              ) : (
                <SafeIcon name="star" size={16} color={theme.colors.accent} />
              );
            })()}
            <Text style={styles.rating}>{item.rating || 0}</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.packagePrice}>{item.price || 0} ريال</Text>
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },
    flatList: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    packageCard: {
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
    packageImage: {
      width: '100%',
      height: 200,
    },
    packageContent: {
      padding: theme.spacing.lg,
    },
    packageTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    packageDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: theme.spacing.sm,
    },
    packageLocation: {
      fontSize: 14,
      color: theme.colors.primary,
      marginBottom: theme.spacing.md,
    },
    packageFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    packageInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    packageDuration: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.xs,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rating: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: theme.spacing.xs,
    },
    priceContainer: {
      alignItems: 'flex-end',
    },
    packagePrice: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
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

  if (isLoading && packages.length === 0) {
    return <LoadingSpinner text="جاري تحميل الباقات..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>الباقات السياحية</Text>
        <View style={styles.searchContainer}>
          {iconImages['search'] ? (
            <Image source={{ uri: iconImages['search'] }} style={{ width: 20, height: 20, marginRight: 8 }} resizeMode="contain" />
          ) : (
            <SafeIcon name="search" size={20} color={theme.colors.textSecondary} />
          )}
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن الباقات..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>
      </View>

      {filteredPackages.length > 0 ? (
        <FlatList
          style={styles.flatList}
          data={filteredPackages}
          renderItem={renderPackageCard}
          keyExtractor={(item: any) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ExpressiveEmptyState
          title={searchQuery ? "لا توجد نتائج للبحث" : "لا توجد باقات متاحة"}
          message={searchQuery ? "جرب البحث بكلمات مختلفة" : "سيتم إضافة باقات جديدة قريباً"}
          imageCategory={searchQuery ? "search-empty" : "package"}
        />
      )}
    </View>
  );
};