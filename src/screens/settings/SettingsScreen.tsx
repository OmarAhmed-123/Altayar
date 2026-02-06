import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { AnimatedCard } from './../../components/animations/AnimatedCard';
import { LogoutButton } from './../../components/common/LogoutButton';
import { SafeIcon } from './../../utils/iconHelper';

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  icon: string;
  type: 'navigation' | 'switch' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [settings, setSettings] = useState({
    notifications: true,
    location: true,
    analytics: false,
    autoUpdate: true,
  });

  const handleToggle = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLanguageChange = () => {
    const newLanguage = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLanguage);
  };

  const handleClearCache = () => {
    Alert.alert(
      'مسح الذاكرة المؤقتة',
      'هل تريد مسح الذاكرة المؤقتة؟ هذا قد يحسن أداء التطبيق.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'مسح', onPress: () => console.log('Cache cleared') },
      ]
    );
  };

  const openStaticPage = (screenName: string) => {
    try {
      (navigation as any).navigate(screenName);
    } catch (error) {
      const parentNavigator = (navigation as any).getParent?.();
      if (parentNavigator?.navigate) {
        parentNavigator.navigate(screenName);
      } else {
        console.warn('[SettingsScreen] Unable to navigate to', screenName, error);
      }
    }
  };

  const settingItems: SettingItem[] = [
    {
      id: 'notifications',
      title: 'الإشعارات',
      description: 'تلقي إشعارات حول الحجوزات والعروض',
      icon: 'notifications',
      type: 'switch',
      value: settings.notifications,
      onToggle: (value) => handleToggle('notifications', value),
    },
    {
      id: 'location',
      title: 'الموقع',
      description: 'السماح للتطبيق بالوصول إلى موقعك',
      icon: 'location-on',
      type: 'switch',
      value: settings.location,
      onToggle: (value) => handleToggle('location', value),
    },
    {
      id: 'theme',
      title: 'المظهر',
      description: 'تغيير مظهر التطبيق',
      icon: 'palette',
      type: 'navigation',
      onPress: () => navigation.navigate('ColorTheme' as never),
    },
    {
      id: 'language',
      title: 'اللغة',
      description: 'تغيير لغة التطبيق',
      icon: 'language',
      type: 'action',
      onPress: handleLanguageChange,
    },
    {
      id: 'analytics',
      title: 'التحليلات',
      description: 'مساعدة في تحسين التطبيق',
      icon: 'analytics',
      type: 'switch',
      value: settings.analytics,
      onToggle: (value) => handleToggle('analytics', value),
    },
    {
      id: 'auto-update',
      title: 'التحديث التلقائي',
      description: 'تحديث التطبيق تلقائياً',
      icon: 'system-update',
      type: 'switch',
      value: settings.autoUpdate,
      onToggle: (value) => handleToggle('autoUpdate', value),
    },
    {
      id: 'clear-cache',
      title: 'مسح الذاكرة المؤقتة',
      description: 'تحسين أداء التطبيق',
      icon: 'storage',
      type: 'action',
      onPress: handleClearCache,
    },
    {
      id: 'privacy',
      title: 'سياسة الخصوصية',
      description: 'قراءة سياسة الخصوصية',
      icon: 'privacy-tip',
      type: 'navigation',
      onPress: () => openStaticPage('PrivacyPolicy'),
    },
    {
      id: 'terms',
      title: 'الشروط والأحكام',
      description: 'قراءة الشروط والأحكام',
      icon: 'description',
      type: 'navigation',
      onPress: () => openStaticPage('Terms'),
    },
    {
      id: 'support',
      title: 'الدعم الفني',
      description: 'الحصول على المساعدة',
      icon: 'support',
      type: 'navigation',
      onPress: () => openStaticPage('Contact'),
    },
    {
      id: 'about',
      title: 'حول التطبيق',
      description: 'معلومات عن التطبيق',
      icon: 'info',
      type: 'navigation',
      onPress: () => openStaticPage('About'),
    },
  ];

  const renderSettingItem = ({ item, index }: { item: SettingItem; index: number }) => (
    <AnimatedCard
      style={styles.settingItem}
      animationType="slide"
      delay={index * 50}
      onPress={item.onPress}
    >
      <View style={styles.settingContent}>
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <SafeIcon name={item.icon} size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.description && (
              <Text style={styles.settingDescription}>{item.description}</Text>
            )}
          </View>
        </View>
        <View style={styles.settingRight}>
          {item.type === 'switch' && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={item.value ? '#FFFFFF' : theme.colors.textSecondary}
            />
          )}
          {item.type === 'navigation' && (
            <SafeIcon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          )}
          {item.type === 'action' && (
            <SafeIcon name="arrow-forward" size={24} color={theme.colors.primary} />
          )}
        </View>
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
    content: {
      padding: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    settingItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    settingContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    settingInfo: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    settingDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    settingRight: {
      marginLeft: theme.spacing.md,
    },
  });

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
          <Text style={styles.title}>الإعدادات</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>عام</Text>
            {settingItems.slice(0, 6).map((item, index) => (
              <View key={item.id}>
                {renderSettingItem({ item, index })}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الخصوصية والأمان</Text>
            {settingItems.slice(6, 9).map((item, index) => (
              <View key={item.id}>
                {renderSettingItem({ item, index })}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المساعدة</Text>
            {settingItems.slice(9).map((item, index) => (
              <View key={item.id}>
                {renderSettingItem({ item, index })}
              </View>
            ))}
          </View>

          <LogoutButton />
        </View>
      </ScrollView>
    </View>
  );
};