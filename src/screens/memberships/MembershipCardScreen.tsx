import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { AnimatedCard } from './../../components/animations/AnimatedCard';
import { membershipService } from './../../services/membershipService';
// Mock data removed - using real backend data only
import { SafeIcon } from './../../utils/iconHelper';
import { fileManagementAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { Linking } from 'react-native';

interface MembershipDetails {
  id: string;
  name: string;
  description: string;
  level: number;
  benefits: string[];
  pointsMultiplier: number;
  cashbackRate: number;
  price: number;
  isActive: boolean;
  features: {
    id: string;
    title: string;
    description: string;
    icon: string;
  }[];
  terms: string[];
}

export const MembershipCardScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [membership, setMembership] = useState<MembershipDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { membershipId } = route.params as { membershipId: string };

  useEffect(() => {
    loadMembershipDetails();
  }, [membershipId]);

  const loadMembershipDetails = async () => {
    setIsLoading(true);
    try {
      // Use real backend API
      const membershipData: any = await membershipService.getMembershipById(membershipId);
      
      const pointsMultiplier = membershipData.points_multiplier || membershipData.pointsMultiplier || 1.0;
      const cashbackRate = membershipData.cashback_rate || membershipData.cashbackRate || 0;
      
      // Transform backend data to frontend format
      const transformedMembership: MembershipDetails = {
        id: membershipData.id.toString(),
        name: membershipData.name || 'عضوية',
        description: membershipData.description || 'عضوية متميزة مع جميع المزايا الحصرية',
        level: membershipData.level || 1,
        benefits: membershipData.benefits || [
          'خصم 15% على جميع الحجوزات',
          'دعم العملاء 24/7',
          'ترقية مجانية للغرف',
          'وصول مبكر للعروض',
        ],
        pointsMultiplier,
        cashbackRate,
        price: membershipData.price || 0,
        isActive: membershipData.is_active !== undefined ? membershipData.is_active : true,
        features: [
          {
            id: '1',
            title: 'خصومات حصرية',
            description: `احصل على خصومات تصل إلى ${cashbackRate}% على جميع الحجوزات`,
            icon: 'local-offer',
          },
          {
            id: '2',
            title: 'دعم متميز',
            description: 'دعم العملاء المتاح 24/7 مع أولوية في الاستجابة',
            icon: 'support-agent',
          },
          {
            id: '3',
            title: 'نقاط مكافآت',
            description: `احصل على ${pointsMultiplier}x نقاط على كل عملية شراء`,
            icon: 'stars',
          },
          {
            id: '4',
            title: 'عروض مبكرة',
            description: 'وصول مبكر للعروض والخصومات الجديدة',
            icon: 'access-time',
          },
        ],
        terms: [
          'العضوية صالحة لمدة سنة واحدة من تاريخ الشراء',
          'يمكن إلغاء العضوية في أي وقت مع استرداد المبلغ المتبقي',
          'المزايا غير قابلة للتحويل أو البيع',
          'يجب الالتزام بشروط وأحكام الخدمة',
        ],
      };
      
      setMembership(transformedMembership);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في تحميل تفاصيل العضوية');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    Alert.alert(
      'شراء العضوية',
      `هل تريد شراء عضوية ${membership?.name} مقابل ${membership?.price} ريال؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'شراء', 
          onPress: async () => {
            try {
              // Use real backend API
              await membershipService.subscribeToMembership(membershipId);
              Alert.alert('نجاح', 'تم شراء العضوية بنجاح!');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('خطأ', error.message || 'فشل في شراء العضوية');
            }
          }
        },
      ]
    );
  };

  const resolveCardId = () => {
    const numericId = Number(membershipId);
    if (!isNaN(numericId)) {
      return numericId;
    }
    if (membership?.id) {
      const parsed = Number(membership.id);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    return 1;
  };

  const openUrlIfAvailable = async (url?: string | null) => {
    if (!url) {
      return false;
    }
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fileManagementAPI.downloadMembershipCard();
      const data = response?.data || response || {};
      const url = data.url || data.file_url;

      if (await openUrlIfAvailable(url)) {
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'جاري تحميل بطاقة العضوية',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'خطأ',
          text2: 'لا يمكن فتح ملف البطاقة حالياً',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل بطاقة العضوية',
      });
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fileManagementAPI.getMembershipCardQR(resolveCardId());
      const data = response?.data || response || {};
      const url = data.url || data.qr_url;

      if (await openUrlIfAvailable(url)) {
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'جاري تحميل رمز QR',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'خطأ',
          text2: 'لا يمكن فتح رمز QR حالياً',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل رمز QR',
      });
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return '#CD7F32'; // Bronze
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#FFD700'; // Gold
      default:
        return theme.colors.primary;
    }
  };

  const renderFeatureCard = ({ item, index }: { item: any; index: number }) => (
    <AnimatedCard
      style={styles.featureCard}
      animationType="slide"
      delay={index * 100}
    >
      <View style={styles.featureIcon}>
        <SafeIcon name={item.icon} size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{item.title}</Text>
        <Text style={styles.featureDescription}>{item.description}</Text>
      </View>
    </AnimatedCard>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    backButton: {
      marginRight: theme.spacing.md,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    membershipHeader: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    levelBadge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: getLevelColor(membership?.level || 1),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    levelText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    membershipName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    membershipDescription: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
    },
    price: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    priceUnit: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.xs,
    },
    content: {
      padding: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    benefitsList: {
      marginBottom: theme.spacing.lg,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    benefitIcon: {
      marginRight: theme.spacing.sm,
    },
    benefitText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    featureCard: {
      width: '48%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      alignItems: 'center',
    },
    featureIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    featureContent: {
      alignItems: 'center',
    },
    featureTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
    featureDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
    },
    termsList: {
      marginBottom: theme.spacing.lg,
    },
    termItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    termBullet: {
      marginRight: theme.spacing.sm,
      marginTop: 6,
    },
    termText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
      flex: 1,
    },
    purchaseButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    purchaseButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    downloadButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    downloadButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    downloadButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (isLoading || !membership) {
    return <LoadingSpinner text="جاري تحميل تفاصيل العضوية..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <SafeIcon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>تفاصيل العضوية</Text>
        </View>

        <View style={styles.membershipHeader}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{membership.level}</Text>
          </View>
          <Text style={styles.membershipName}>{membership.name}</Text>
          <Text style={styles.membershipDescription}>{membership.description}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{membership.price}</Text>
            <Text style={styles.priceUnit}>ريال</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المزايا</Text>
            <View style={styles.benefitsList}>
              {membership.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <SafeIcon
                    name="check-circle"
                    size={20}
                    color={theme.colors.success}
                    style={styles.benefitIcon}
                  />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المميزات الحصرية</Text>
            <View style={styles.featuresGrid}>
              {membership.features.map((feature, index) => (
                <View key={feature.id}>
                  {renderFeatureCard({ item: feature, index })}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الشروط والأحكام</Text>
            <View style={styles.termsList}>
              {membership.terms.map((term, index) => (
                <View key={index} style={styles.termItem}>
                  <Text style={styles.termBullet}>•</Text>
                  <Text style={styles.termText}>{term}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Download Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تحميل بطاقة العضوية</Text>
            <View style={styles.downloadButtons}>
              <TouchableOpacity
                style={[styles.downloadButton, { backgroundColor: theme.colors.error }]}
                onPress={handleDownloadPDF}
              >
                <SafeIcon name="picture-as-pdf" size={24} color="#FFFFFF" />
                <Text style={styles.downloadButtonText}>تحميل PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.downloadButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleDownloadQR}
              >
                <SafeIcon name="qr-code" size={24} color="#FFFFFF" />
                <Text style={styles.downloadButtonText}>تحميل QR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.purchaseButton}>
        <TouchableOpacity onPress={handlePurchase}>
          <Text style={styles.purchaseButtonText}>شراء العضوية</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};