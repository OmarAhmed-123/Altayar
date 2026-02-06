import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeIcon } from '../../utils/iconHelper';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { dashboardService } from '../../services/dashboardService';
import type { User } from '../../types';
import type { DrawerParamList, TabParamList } from '../../types/navigation';

type ActionTarget =
  | { type: 'drawer'; screen: keyof DrawerParamList; params?: any }
  | { type: 'tab'; screen: keyof TabParamList; nestedScreen?: string; params?: any }
  | { type: 'stack'; screen: string; params?: any }
  | { type: 'link'; url: string };

interface QuickAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  color?: string;
  background?: string;
  target: ActionTarget;
}

interface RoleHomeConfig {
  title: string;
  description: string;
  accent: string;
  showStats?: boolean;
  quickActions: QuickAction[];
  secondaryActions?: QuickAction[];
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'سوبر أدمن',
  admin: 'أدمن',
  sales: 'مبيعات',
  agent: 'وكيل',
  accountant: 'محاسب',
  hr: 'موارد بشرية',
  data_entry: 'مدخل بيانات',
  reservations: 'موظف حجوزات',
  support: 'دعم',
  customer: 'عميل',
};

const ROLE_CONFIG: Record<string, RoleHomeConfig> = {
  super_admin: {
    title: 'لوحة السوبر أدمن',
    description: 'تحكم كامل بكل الأنظمة، الإعدادات، والتكاملات.',
    accent: '#2265c3',
    showStats: true,
    quickActions: [
      { id: 'admin-dashboard', title: 'لوحة التحكم', icon: 'space-dashboard', target: { type: 'drawer', screen: 'AdminDashboard' } },
      { id: 'users', title: 'إدارة المستخدمين', icon: 'supervisor-account', target: { type: 'tab', screen: 'Profile', nestedScreen: 'UsersManagement' } },
      { id: 'settings', title: 'إعدادات النظام', icon: 'settings-applications', target: { type: 'tab', screen: 'Profile', nestedScreen: 'SettingsManagement' } },
      { id: 'localization', title: 'التوطين', icon: 'language', target: { type: 'tab', screen: 'Profile', nestedScreen: 'LocalizationManagement' } },
      { id: 'ads', title: 'إدارة الإعلانات', icon: 'campaign', target: { type: 'tab', screen: 'Profile', nestedScreen: 'AdsManagement' } },
      { id: 'integrations', title: 'تكاملات API', icon: 'hub', target: { type: 'tab', screen: 'Profile', nestedScreen: 'ExternalApiIntegrations' } },
    ],
    secondaryActions: [
      { id: 'notifications', title: 'إدارة الإشعارات', icon: 'notifications-active', target: { type: 'drawer', screen: 'NotificationsManagement' } },
      { id: 'analytics', title: 'تحليلات متقدمة', icon: 'insights', target: { type: 'drawer', screen: 'DashboardAnalytics' } },
    ],
  },
  admin: {
    title: 'لوحة الأدمن',
    description: 'إدارة الحجوزات، العضويات، المحتوى، والقسائم.',
    accent: '#19b6e8',
    showStats: true,
    quickActions: [
      { id: 'bookings', title: 'الحجوزات', icon: 'event-available', target: { type: 'tab', screen: 'Profile', nestedScreen: 'BookingsManagement' } },
      { id: 'memberships', title: 'العضويات', icon: 'card-membership', target: { type: 'tab', screen: 'Profile', nestedScreen: 'MembershipsManagement' } },
      { id: 'packages', title: 'الباقات', icon: 'redeem', target: { type: 'tab', screen: 'Profile', nestedScreen: 'PackagesManagement' } },
      { id: 'vouchers', title: 'القسائم', icon: 'card-giftcard', target: { type: 'tab', screen: 'Profile', nestedScreen: 'VouchersManagement' } },
      { id: 'blogs', title: 'المحتوى', icon: 'article', target: { type: 'tab', screen: 'Profile', nestedScreen: 'BlogsManagement' } },
      { id: 'transactions', title: 'المعاملات', icon: 'request-quote', target: { type: 'tab', screen: 'Profile', nestedScreen: 'TransactionsManagement' } },
    ],
  },
  sales: {
    title: 'لوحة المبيعات',
    description: 'إضافة عملاء، إدارة الحجوزات والعروض والنقاط.',
    accent: '#ff8a00',
    showStats: false,
    quickActions: [
      { id: 'customers', title: 'عملائي', icon: 'people', target: { type: 'tab', screen: 'Profile', nestedScreen: 'UsersManagement' } },
      { id: 'quotations', title: 'عروض الأسعار', icon: 'request-quote', target: { type: 'drawer', screen: 'SalesQuotations' } },
      { id: 'bookings', title: 'الحجوزات', icon: 'event', target: { type: 'tab', screen: 'Profile', nestedScreen: 'BookingsManagement' } },
      { id: 'manual-gift', title: 'الهدايا اليدوية', icon: 'card-giftcard', target: { type: 'tab', screen: 'Profile', nestedScreen: 'UsersManagement' } },
      { id: 'wallet', title: 'سجل العملاء', icon: 'receipt', target: { type: 'tab', screen: 'Profile', nestedScreen: 'TransactionsHistory' } },
    ],
  },
  agent: {
    title: 'لوحة الوكلاء',
    description: 'تنفيذ الحجوزات، متابعة العملاء، وتسهيل نقاط الولاء.',
    accent: '#19b6e8',
    showStats: false,
    quickActions: [
      { id: 'agent-bookings', title: 'حجوزات العملاء', icon: 'assignment', target: { type: 'drawer', screen: 'AgentBookingsManagement' } },
      { id: 'agent-memberships', title: 'عضويات العملاء', icon: 'workspace-premium', target: { type: 'drawer', screen: 'AgentMembershipsManagement' } },
      { id: 'agent-vouchers', title: 'قسائم العملاء', icon: 'local-offer', target: { type: 'drawer', screen: 'AgentVouchersManagement' } },
      { id: 'sales-quotations', title: 'عروض الأسعار', icon: 'request-quote', target: { type: 'drawer', screen: 'SalesQuotations' } },
      { id: 'manual-gift-agent', title: 'الهدايا اليدوية', icon: 'card-giftcard', target: { type: 'tab', screen: 'Profile', nestedScreen: 'UsersManagement' } },
    ],
  },
  hr: {
    title: 'لوحة الموارد البشرية',
    description: 'إدارة الموظفين، المستندات، والتواصل الداخلي.',
    accent: '#9c27b0',
    showStats: false,
    quickActions: [
      { id: 'hr-users', title: 'الموظفون', icon: 'badge', target: { type: 'drawer', screen: 'HRUsersManagement' } },
      { id: 'documents', title: 'ملفات الموظفين', icon: 'folder-shared', target: { type: 'drawer', screen: 'DocumentsManagement' } },
      { id: 'reviews', title: 'التقييمات', icon: 'reviews', target: { type: 'tab', screen: 'Profile', nestedScreen: 'ReviewsManagement' } },
      { id: 'notifications', title: 'إشعارات داخلية', icon: 'notifications', target: { type: 'drawer', screen: 'NotificationsManagement' } },
    ],
  },
  accountant: {
    title: 'لوحة المحاسبة',
    description: 'حركة المعاملات، الفواتير، والتقارير المالية.',
    accent: '#2265c3',
    showStats: true,
    quickActions: [
      { id: 'accounting-transactions', title: 'حركة المعاملات', icon: 'calculate', target: { type: 'drawer', screen: 'AccountingTransactions' } },
      { id: 'sales-report', title: 'تقرير المبيعات', icon: 'leaderboard', target: { type: 'drawer', screen: 'AccountingTransactionsManagement' } },
      { id: 'transactions-mgmt', title: 'سجل المدفوعات', icon: 'receipt-long', target: { type: 'tab', screen: 'Profile', nestedScreen: 'TransactionsManagement' } },
      { id: 'analytics', title: 'التحليلات المالية', icon: 'insights', target: { type: 'drawer', screen: 'Analytics' } },
    ],
  },
  data_entry: {
    title: 'لوحة إدخال البيانات',
    description: 'إضافة وتحديث الباقات، المدونات، الرحلات، والمستندات.',
    accent: '#4caf50',
    showStats: false,
    quickActions: [
      { id: 'packages-entry', title: 'الباقات', icon: 'library-add', target: { type: 'drawer', screen: 'DataEntryPackages' } },
      { id: 'blogs-entry', title: 'المدونات', icon: 'post-add', target: { type: 'drawer', screen: 'DataEntryBlogs' } },
      { id: 'trips-entry', title: 'البرامج السياحية', icon: 'map', target: { type: 'drawer', screen: 'DataEntryTrips' } },
      { id: 'documents-entry', title: 'المستندات', icon: 'note-add', target: { type: 'drawer', screen: 'DataEntryDocuments' } },
    ],
  },
  reservations: {
    title: 'لوحة موظف الحجوزات',
    description: 'متابعة الحجوزات، العضويات، والقسائم.',
    accent: '#ff9800',
    showStats: false,
    quickActions: [
      { id: 'agent-bookings-nav', title: 'الحجوزات', icon: 'event-note', target: { type: 'drawer', screen: 'AgentBookingsManagement' } },
      { id: 'agent-memberships-nav', title: 'العضويات', icon: 'workspace-premium', target: { type: 'drawer', screen: 'AgentMembershipsManagement' } },
      { id: 'agent-vouchers-nav', title: 'القسائم', icon: 'local-offer', target: { type: 'drawer', screen: 'AgentVouchersManagement' } },
      { id: 'quotations-nav', title: 'عروض الأسعار', icon: 'request-quote', target: { type: 'drawer', screen: 'SalesQuotations' } },
    ],
  },
  support: {
    title: 'لوحة الدعم',
    description: 'المحادثات، الإشعارات، وإدارة المستندات.',
    accent: '#607d8b',
    showStats: false,
    quickActions: [
      { id: 'chat', title: 'المحادثات', icon: 'chat-bubble', target: { type: 'drawer', screen: 'ChatConversationsManagement' } },
      { id: 'notifications-support', title: 'الإشعارات', icon: 'notifications-active', target: { type: 'drawer', screen: 'NotificationsManagement' } },
      { id: 'documents-support', title: 'المستندات', icon: 'description', target: { type: 'drawer', screen: 'DocumentsManagement' } },
    ],
  },
  default: {
    title: 'لوحة الإدارة',
    description: 'استعرض مؤشرات الأداء وادخل إلى المهام اليومية.',
    accent: '#2265c3',
    showStats: true,
    quickActions: [
      { id: 'dashboard', title: 'لوحة التحكم', icon: 'dashboard', target: { type: 'drawer', screen: 'AdminDashboard' } },
      { id: 'users-default', title: 'المستخدمون', icon: 'people', target: { type: 'tab', screen: 'Profile', nestedScreen: 'UsersManagement' } },
    ],
  },
};

interface RoleHomeScreenProps {
  role: User['role'];
  user: User | null;
  navigation: any;
}

export const RoleHomeScreen: React.FC<RoleHomeScreenProps> = ({ role, user, navigation }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.default;
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(Boolean(config.showStats));
  const [refreshing, setRefreshing] = useState(false);

  const tabNavigator = navigation?.getParent?.();
  const drawerNavigator = tabNavigator?.getParent?.() ?? navigation?.getParent?.()?.getParent?.();

  const roleLabel = ROLE_LABELS[role] || ROLE_LABELS.customer;
  const greetingName = user?.firstName || user?.name || t('مرحبا');

  const loadStats = useCallback(async () => {
    if (!config.showStats) {
      return;
    }
    setLoadingStats(true);
    try {
      const response = await dashboardService.getStats();
      setStats(response.data || response);
    } catch (error) {
      console.warn('Failed to load dashboard stats:', (error as any)?.message || error);
    } finally {
      setLoadingStats(false);
    }
  }, [config.showStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const navigateToTarget = (target: ActionTarget) => {
    if (target.type === 'drawer' && drawerNavigator?.navigate) {
      drawerNavigator.navigate(target.screen as never, target.params as never);
      return;
    }
    if (target.type === 'tab' && tabNavigator?.navigate) {
      tabNavigator.navigate(
        target.screen as never,
        target.nestedScreen
          ? { screen: target.nestedScreen, params: target.params }
          : target.params,
      );
      return;
    }
    if (target.type === 'stack') {
      navigation.navigate(target.screen as never, target.params);
      return;
    }
    if (target.type === 'link') {
      Linking.openURL(target.url);
    }
  };

  const statsCards = useMemo(() => {
    if (!stats || !config.showStats) {
      return [];
    }

    const usersCount = stats.data?.users?.total ?? stats.users?.total ?? 0;
    const bookingsCount = stats.data?.bookings?.total ?? stats.bookings?.total ?? 0;
    const revenue = stats.data?.revenue?.total ?? stats.revenue?.total ?? 0;

    return [
      { id: 'users', label: 'المستخدمون', value: usersCount, icon: 'groups' },
      { id: 'bookings', label: 'الحجوزات', value: bookingsCount, icon: 'event-note' },
      { id: 'revenue', label: 'الإيرادات', value: revenue, icon: 'trending-up' },
    ];
  }, [stats, config.showStats]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={config.accent}
          />
        }
      >
        <View style={[styles.heroCard, { borderColor: config.accent + '40' }]}>
          <View>
            <Text style={[styles.heroTitle, { color: config.accent }]}>
              مرحباً، {greetingName}
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
              {config.description}
            </Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: config.accent + '15' }]}>
            <Text style={[styles.roleBadgeText, { color: config.accent }]}>
              {roleLabel}
            </Text>
          </View>
        </View>

        {config.showStats && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>الإحصائيات</Text>
            {loadingStats ? (
              <ActivityIndicator color={config.accent} />
            ) : (
              <View style={styles.statsRow}>
                {statsCards.map(card => (
                  <View key={card.id} style={[styles.statCard, { borderColor: config.accent + '30' }]}>
                    <SafeIcon name={card.icon} size={28} color={config.accent} />
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>{card.value}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{card.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>الاختصارات</Text>
          <View style={styles.quickGrid}>
            {config.quickActions.map(action => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.quickAction,
                  { backgroundColor: action.background || theme.colors.surface },
                ]}
                activeOpacity={0.85}
                onPress={() => navigateToTarget(action.target)}
              >
                <SafeIcon
                  name={action.icon}
                  size={28}
                  color={action.color || config.accent}
                />
                <Text style={[styles.quickTitle, { color: theme.colors.text }]}>{action.title}</Text>
                {action.subtitle && (
                  <Text style={[styles.quickSubtitle, { color: theme.colors.textSecondary }]}>
                    {action.subtitle}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {config.secondaryActions && config.secondaryActions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>أدوات إضافية</Text>
            <View style={styles.secondaryList}>
              {config.secondaryActions.map(action => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.secondaryAction, { borderColor: theme.colors.border }]}
                  onPress={() => navigateToTarget(action.target)}
                >
                  <SafeIcon
                    name={action.icon}
                    size={22}
                    color={action.color || theme.colors.primary}
                  />
                  <Text style={[styles.secondaryText, { color: theme.colors.text }]}>
                    {action.title}
                  </Text>
                  <SafeIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },
  heroCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  heroSubtitle: {
    fontSize: 14,
    marginTop: 6,
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flexBasis: '48%',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  secondaryList: {
    gap: 12,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  secondaryText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
  },
});

