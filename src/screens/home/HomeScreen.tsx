import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePackageStore } from '../../stores/packageStore';
import { useAuthStore } from '../../stores/authStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AnimatedCard } from '../../components/animations/AnimatedCard';
import { FloatingActionButton } from '../../components/animations/FloatingActionButton';
import { LanguageSelector } from '../../components/common/LanguageSelector';
import { QRCodeGenerator } from '../../components/common/QRCodeGenerator';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const { packages, isLoading, fetchPackages } = usePackageStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

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
      onPress={() => navigation.navigate('PackageDetails' as never, { packageId: item.id } as never)}
    >
      <Image source={{ uri: item.images[0] || 'https://via.placeholder.com/300x200' }} style={styles.packageImage} />
      <View style={styles.packageContent}>
        <Text style={styles.packageTitle}>{item.title}</Text>
        <Text style={styles.packageDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.packageFooter}>
          <View style={styles.packageInfo}>
            <Icon name="schedule" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.packageDuration}>{item.duration} أيام</Text>
          </View>
          <Text style={styles.packagePrice}>{item.price} ريال</Text>
        </View>
      </View>
    </AnimatedCard>
  );

  const features = [
    {
      id: 1,
      icon: 'flight',
      title: 'رحلات جوية',
      description: 'احجز رحلتك بأفضل الأسعار',
    },
    {
      id: 2,
      icon: 'hotel',
      title: 'فنادق',
      description: 'اختر من أفضل الفنادق',
    },
    {
      id: 3,
      icon: 'restaurant',
      title: 'مطاعم',
      description: 'اكتشف أفضل المطاعم',
    },
    {
      id: 4,
      icon: 'local-activity',
      title: 'أنشطة',
      description: 'استمتع بأروع الأنشطة',
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    qrButton: {
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      marginTop: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    seeAllText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    featureCard: {
      width: '48%',
      alignItems: 'center',
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    featureDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
    packageCard: {
      width: screenWidth * 0.8,
      marginRight: theme.spacing.md,
    },
    packageImage: {
      width: '100%',
      height: 200,
      borderTopLeftRadius: theme.borderRadius.md,
      borderTopRightRadius: theme.borderRadius.md,
    },
    packageContent: {
      padding: theme.spacing.md,
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
      marginBottom: theme.spacing.md,
    },
    packageFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    packagePrice: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.xl,
    },
    quickAction: {
      alignItems: 'center',
      flex: 1,
    },
    quickActionButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    quickActionText: {
      fontSize: 12,
      color: theme.colors.text,
      textAlign: 'center',
    },
  });

  if (isLoading && packages.length === 0) {
    return <LoadingSpinner text="جاري التحميل..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.welcomeText}>
              {t('home.welcome', { name: user?.name || 'عزيزي العميل' })}
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.qrButton}
                onPress={() => setShowQRCode(true)}
              >
                <Icon name="qr-code" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <LanguageSelector />
            </View>
          </View>
          <Text style={styles.subtitle}>
            {t('home.discoverMessage')}
          </Text>
          
          <TouchableOpacity style={styles.searchBar}>
            <Icon name="search" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.searchInput}>{t('home.searchPlaceholder')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الخدمات السريعة</Text>
            </View>
            <View style={styles.featuresGrid}>
              {features.map((feature) => (
                <TouchableOpacity
                  key={feature.id}
                  style={styles.featureCard}
                  onPress={() => navigation.navigate('Services' as never)}
                >
                  <Icon name={feature.icon} size={40} color={theme.colors.primary} />
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.featuredPackages')}</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={packages.slice(0, 5)}
              renderItem={renderPackageCard}
              keyExtractor={(item: any) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              snapToInterval={screenWidth * 0.8 + 16}
              decelerationRate="fast"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الأنشطة السريعة</Text>
            </View>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('Bookings' as never)}
              >
                <View style={styles.quickActionButton}>
                  <Icon name="book-online" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.quickActionText}>حجوزاتي</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('Trips' as never)}
              >
                <View style={styles.quickActionButton}>
                  <Icon name="route" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.quickActionText}>رحلاتي</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('Reviews' as never)}
              >
                <View style={styles.quickActionButton}>
                  <Icon name="star" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.quickActionText}>تقييماتي</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('Profile' as never)}
              >
                <View style={styles.quickActionButton}>
                  <Icon name="person" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.quickActionText}>الملف الشخصي</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <FloatingActionButton
        onPress={() => navigation.navigate('Packages' as never)}
        icon="search"
        label="البحث"
        animated
      />
      
      <QRCodeGenerator
        visible={showQRCode}
        onClose={() => setShowQRCode(false)}
        apkUrl="https://altayar-app.com/download"
      />
    </View>
  );
};
