import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { settingsService } from './../../services/settingsService';
import { SafeIcon } from './../../utils/iconHelper';

const PRIVACY_SLUG = 'privacy-policy';

const translations = {
  ar: {
    title: 'سياسة الخصوصية',
    intro:
      'نلتزم بحماية بياناتك الشخصية عبر التشفير، صلاحيات الأدوار، وعمليات التدقيق المستمرة على جميع الخدمات والواجهات.',
    sections: [
      {
        title: '1. البيانات التي نجمعها',
        body: 'معلومات الهوية، بيانات التواصل، تفضيلات السفر، وسجلات الحجوزات. لا نطلب أي بيانات غير ضرورية للتجربة.',
      },
      {
        title: '2. استخدام المعلومات',
        body: 'تحسين العروض، إصدار فواتير آمنة، تخصيص محتوى الواجهة الأمامية، وإرسال تنبيهات مرتبطة بالحجز أو العضوية.',
      },
      {
        title: '3. التخزين والأمان',
        body: 'تُخزن البيانات في خوادم مشفرة (MySQL + S3) مع جدران حماية، مراقبة دخول، ونسخ احتياطي دوري.',
      },
      {
        title: '4. حقوق المستخدم',
        body: 'يمكنك تحديث بياناتك، طلب تصدير السجل، أو حذف الحساب من خلال الدعم أو إعدادات الخصوصية.',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    intro:
      'We protect your personal data with encryption, strict role-based permissions, and continuous audits across every service and interface.',
    sections: [
      {
        title: '1. Data we collect',
        body: 'Identity information, contact details, travel preferences, and booking logs. We never request data that is not essential to the experience.',
      },
      {
        title: '2. How we use it',
        body: 'To personalize offers, generate secure invoices, tailor front pages, and send contextual alerts tied to bookings or memberships.',
      },
      {
        title: '3. Storage & security',
        body: 'Data lives inside encrypted infrastructure (MySQL + S3) protected by firewalls, access monitoring, and scheduled backups.',
      },
      {
        title: '4. User rights',
        body: 'You can update your data, request a full export, or delete the account through support or the privacy settings area.',
      },
    ],
  },
};

const sanitizeContent = (raw: string) =>
  raw
    .replace(/<[^>]+>/g, '\n')
    .split(/\n+/)
    .map(block => block.trim())
    .filter(Boolean);

export const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [paragraphs, setParagraphs] = useState<string[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const t = useMemo(() => translations[language as 'ar' | 'en'] || translations.ar, [language]);

  const loadPrivacy = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await settingsService.getPageBySlug(PRIVACY_SLUG);
      const page = (response as any)?.data || response;
      if (page?.content) {
        setParagraphs(sanitizeContent(page.content));
      } else {
        setParagraphs(null);
      }
    } catch (error: any) {
      console.warn('[PrivacyPolicyScreen] Unable to load CMS content:', error?.message || error);
      setParagraphs(null);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPrivacy();
  }, [loadPrivacy, language]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => (navigation as any).goBack()}>
          <SafeIcon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadPrivacy} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.introCard, { backgroundColor: theme.colors.primary + '12' }]}>
          <SafeIcon name="shield-checkmark" size={28} color={theme.colors.primary} />
          <Text style={[styles.introText, { color: theme.colors.text }]}>{t.intro}</Text>
        </View>

        {(paragraphs || t.sections).map((section, index) => {
          if (typeof section === 'string') {
            return (
              <View key={`cms-${index}`} style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionBody, { color: theme.colors.text }]}>{section}</Text>
              </View>
            );
          }

          return (
            <View key={section.title} style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{section.title}</Text>
              <Text style={[styles.sectionBody, { color: theme.colors.textSecondary }]}>{section.body}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  introCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  introText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export default PrivacyPolicyScreen;

