import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { useAuthStore } from './../../stores/authStore';
import { AnimatedCard } from './../../components/animations/AnimatedCard';
import { SafeIcon } from './../../utils/iconHelper';

interface DebugInfo {
  id: string;
  title: string;
  value: string;
  type: 'text' | 'action';
  onPress?: () => void;
}

export const DebugScreen: React.FC = () => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { user, isAuthenticated, token } = useAuthStore();
  const [debugInfo, setDebugInfo] = useState<DebugInfo[]>([]);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'مسح الذاكرة المؤقتة',
      'هل تريد مسح الذاكرة المؤقتة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'مسح', onPress: () => console.log('Cache cleared') },
      ]
    );
  }, []);

  const handleResetApp = useCallback(() => {
    Alert.alert(
      'إعادة تعيين التطبيق',
      'هل تريد إعادة تعيين التطبيق؟ سيتم حذف جميع البيانات المحلية.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'إعادة تعيين', onPress: () => console.log('App reset') },
      ]
    );
  }, []);

  const handleExportLogs = useCallback(async () => {
    try {
      const logs = {
        timestamp: new Date().toISOString(),
        appVersion: '1.0.0',
        reactNativeVersion: '0.76.3',
        language,
        theme: theme.colors.background === '#FFFFFF' ? 'light' : 'dark',
        isAuthenticated,
        userId: user?.id,
        userEmail: user?.email,
        hasToken: !!token,
      };

      await Share.share({
        message: JSON.stringify(logs, null, 2),
        title: 'سجلات التطبيق',
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      Alert.alert('خطأ', 'فشل في تصدير السجلات');
    }
  }, [language, theme.colors.background, isAuthenticated, user?.id, user?.email, token]);

  const loadDebugInfo = useCallback(() => {
    const info: DebugInfo[] = [
      {
        id: 'app-version',
        title: 'إصدار التطبيق',
        value: '1.0.0',
        type: 'text',
      },
      {
        id: 'react-native-version',
        title: 'إصدار React Native',
        value: '0.76.3',
        type: 'text',
      },
      {
        id: 'language',
        title: 'اللغة الحالية',
        value: language === 'ar' ? 'العربية' : 'English',
        type: 'text',
      },
      {
        id: 'theme',
        title: 'المظهر الحالي',
        value: theme.colors.background === '#FFFFFF' ? 'فاتح' : 'داكن',
        type: 'text',
      },
      {
        id: 'auth-status',
        title: 'حالة المصادقة',
        value: isAuthenticated ? 'مسجل الدخول' : 'غير مسجل',
        type: 'text',
      },
      {
        id: 'user-id',
        title: 'معرف المستخدم',
        value: user?.id ? user.id.toString() : 'غير متوفر',
        type: 'text',
      },
      {
        id: 'user-email',
        title: 'البريد الإلكتروني',
        value: user?.email || 'غير متوفر',
        type: 'text',
      },
      {
        id: 'token-status',
        title: 'حالة الرمز المميز',
        value: token ? 'موجود' : 'غير موجود',
        type: 'text',
      },
      {
        id: 'clear-cache',
        title: 'مسح الذاكرة المؤقتة',
        value: 'اضغط للمسح',
        type: 'action',
        onPress: handleClearCache,
      },
      {
        id: 'reset-app',
        title: 'إعادة تعيين التطبيق',
        value: 'اضغط للإعادة',
        type: 'action',
        onPress: handleResetApp,
      },
      {
        id: 'export-logs',
        title: 'تصدير السجلات',
        value: 'اضغط للتصدير',
        type: 'action',
        onPress: handleExportLogs,
      },
    ];

    setDebugInfo(info);
  }, [
    language,
    theme.colors.background,
    isAuthenticated,
    user,
    token,
    handleClearCache,
    handleResetApp,
    handleExportLogs,
  ]);

  useEffect(() => {
    loadDebugInfo();
  }, [loadDebugInfo]);

  const renderDebugItem = ({ item, index }: { item: DebugInfo; index: number }) => (
    <AnimatedCard
      style={styles.debugItem}
      animationType="slide"
      delay={index * 50}
      onPress={item.onPress}
    >
      <View style={styles.debugContent}>
        <View style={styles.debugLeft}>
          <Text style={styles.debugTitle}>{item.title}</Text>
          <Text style={styles.debugValue}>{item.value}</Text>
        </View>
        {item.type === 'action' && (
          <SafeIcon name="chevron-right" size={24} color={theme.colors.textSecondary} />
        )}
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
    debugItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    debugContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
    },
    debugLeft: {
      flex: 1,
    },
    debugTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    debugValue: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    warningCard: {
      backgroundColor: theme.colors.warning,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      alignItems: 'center',
    },
    warningText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>وضع التطوير</Text>
        <Text style={styles.subtitle}>معلومات التطبيق وإعدادات التطوير</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.warningCard}>
            <SafeIcon name="warning" size={32} color="#FFFFFF" />
            <Text style={styles.warningText}>
              هذا الوضع مخصص للمطورين فقط
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات التطبيق</Text>
            {debugInfo.slice(0, 4).map((item, index) => (
              <View key={item.id}>
                {renderDebugItem({ item, index })}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات المستخدم</Text>
            {debugInfo.slice(4, 8).map((item, index) => (
              <View key={item.id}>
                {renderDebugItem({ item, index })}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>أدوات التطوير</Text>
            {debugInfo.slice(8).map((item, index) => (
              <View key={item.id}>
                {renderDebugItem({ item, index })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};