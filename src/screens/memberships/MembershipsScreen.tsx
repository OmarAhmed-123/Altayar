import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { AnimatedCard } from './../../components/animations/AnimatedCard';
import { ExpressiveEmptyState } from './../../components/common/ExpressiveEmptyState';
import { membershipService } from './../../services/membershipService';
// Mock data removed - using real backend data only
import { Membership } from './../../types';
import { SafeIcon } from './../../utils/iconHelper';

export const MembershipsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMemberships();
  }, []);

  const loadMemberships = async () => {
    setIsLoading(true);
    try {
      // Use real backend API
      const response = await membershipService.getMemberships();
      // Transform backend membership data to frontend format
      const transformedMemberships: Membership[] = Array.isArray(response) ? response.map(membership => ({
        ...membership,
        isActive: membership.is_active || membership.isActive !== undefined ? membership.isActive : true,
      })) : [];
      
      setMemberships(transformedMemberships);
    } catch (error: any) {
      Alert.alert('خطأ', 'فشل في تحميل العضويات');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMemberships();
    setRefreshing(false);
  };

  const handleUpgrade = (membership: Membership) => {
    // Navigate to membership card screen
    try {
      // Try to navigate through Drawer navigator first
      const drawerParent = (navigation as any).getParent('drawer');
      if (drawerParent) {
        drawerParent.navigate('MembershipCard', { membershipId: membership.id.toString() });
        return;
      }
      
      // Try to navigate through Profile tab
      const profileParent = (navigation as any).getParent('tab');
      if (profileParent) {
        profileParent.navigate('Profile', {
          screen: 'MembershipCard',
          params: { membershipId: membership.id.toString() },
        });
        return;
      }
      
      // Fallback: direct navigation
      (navigation as any).navigate('MembershipCard', { membershipId: membership.id.toString() });
    } catch (error: any) {
      console.error('Navigation error:', error);
      // Try direct navigation as last resort
      try {
        (navigation as any).navigate('MembershipCard', { membershipId: membership.id.toString() });
      } catch (fallbackError) {
        Alert.alert('خطأ', 'فشل في الانتقال إلى صفحة العضوية');
      }
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

  const renderMembershipCard = ({ item, index }: { item: Membership; index: number }) => (
    <AnimatedCard
      style={styles.membershipCard}
      animationType="slide"
      delay={index * 100}
    >
      <View style={styles.membershipHeader}>
        <View style={styles.membershipInfo}>
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.level) }]}>
            <Text style={styles.levelText}>{item.level}</Text>
          </View>
          <View style={styles.membershipDetails}>
            <Text style={styles.membershipName}>{item.name}</Text>
            <Text style={styles.membershipDescription}>{item.description}</Text>
          </View>
        </View>
      </View>

      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>المزايا:</Text>
        {item.benefits.map((benefit, benefitIndex) => (
          <View key={benefitIndex} style={styles.benefitItem}>
            <SafeIcon name="check-circle" size={16} color={theme.colors.success} />
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>

      <View style={styles.membershipFooter}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.pointsMultiplier}x</Text>
            <Text style={styles.statLabel}>نقاط</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.cashbackRate}%</Text>
            <Text style={styles.statLabel}>استرداد</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => handleUpgrade(item)}
        >
          <Text style={styles.upgradeButtonText}>
            {item.price === 0 ? 'تطبيق مجاني' : `ترقية - ${item.price} ريال`}
          </Text>
        </TouchableOpacity>
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
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
    },
    flatList: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    membershipCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    currentMembership: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    membershipHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.lg,
    },
    membershipInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    levelBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    levelText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    membershipDetails: {
      flex: 1,
    },
    membershipName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    membershipDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    currentBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    currentText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    benefitsContainer: {
      marginBottom: theme.spacing.lg,
    },
    benefitsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    benefitText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
      flex: 1,
    },
    membershipFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statsContainer: {
      flexDirection: 'row',
      flex: 1,
    },
    statItem: {
      alignItems: 'center',
      marginRight: theme.spacing.lg,
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    upgradeButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    upgradeButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
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
    return <LoadingSpinner text="جاري تحميل العضويات..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>العضويات</Text>
        <Text style={styles.subtitle}>اختر العضوية المناسبة لك واستمتع بالمزايا الحصرية</Text>
      </View>

      <FlatList
        style={styles.flatList}
        data={memberships}
        renderItem={renderMembershipCard}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ExpressiveEmptyState
            title="لا توجد عضويات متاحة"
            message="سيتم إضافة عضويات جديدة قريباً"
            imageCategory="membership"
          />
        }
      />
    </View>
  );
};