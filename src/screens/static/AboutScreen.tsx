import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { settingsService } from './../../services/settingsService';
import { SafeIcon } from './../../utils/iconHelper';

const ABOUT_PAGE_SLUG = 'about-altayar-vip';

const fallbackContent = {
  ar: {
    heroTitle: 'Altayar VIP',
    heroSubtitle: 'منصة متكاملة للعضويات المميزة، الرحلات المخصصة، والمكافآت الذكية.',
    stats: [
      { label: 'الأعضاء النشطون', value: '120K+' },
      { label: 'حجوزات ناجحة', value: '48K+' },
      { label: 'شركاء موثوقون', value: '320+' },
    ],
    sections: [
      {
        title: 'رؤيتنا',
        body: 'نصمم تجارب سفر فاخرة مع خدمات متعددة المنصات، دعم مباشر، ونظام ولاء متطور يحفّز على الاستكشاف.',
      },
      {
        title: 'لماذا Altayar VIP؟',
        body: 'واجهة ثنائية اللغة، تطبيقات iOS/Android، موقع ويب مرن، ولوحات تحكم متخصصة للعضويات، المبيعات، والمحاسبة.',
      },
      {
        title: 'ما الذي نقدمه؟',
        body: 'باقات مدروسة، صانع رحلات ذكي، قسائم حصرية، برامج إحالة، ولوحة تحكم عملاء تعرض الحجوزات، النقاط، والكاش باك.',
      },
    ],
  },
  en: {
    heroTitle: 'Altayar VIP',
    heroSubtitle: 'Premium memberships, curated trips, and intelligent loyalty in one platform.',
    stats: [
      { label: 'Active members', value: '120K+' },
      { label: 'Confirmed bookings', value: '48K+' },
      { label: 'Trusted partners', value: '320+' },
    ],
    sections: [
      {
        title: 'Our Vision',
        body: 'Deliver elevated travel moments with cross-platform access, real-time support, and a rewards engine that keeps customers engaged.',
      },
      {
        title: 'Why Altayar VIP?',
        body: 'Bilingual UX, native mobile apps, responsive web, and specialized consoles for memberships, sales, and accounting teams.',
      },
      {
        title: 'What We Deliver',
        body: 'Tailored packages, an AI-assisted trip maker, exclusive vouchers, referral rewards, and a customer dashboard for bookings, points, and cashback.',
      },
    ],
  },
};

const sanitizeContent = (raw: string) =>
  raw
    .replace(/<[^>]+>/g, '\n')
    .split(/\n+/)
    .map(chunk => chunk.trim())
    .filter(Boolean);

export const AboutScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [cmsParagraphs, setCmsParagraphs] = useState<string[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPageContent = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await settingsService.getPageBySlug(ABOUT_PAGE_SLUG);
      const page = (response as any)?.data || response;
      if (page?.content) {
        setCmsParagraphs(sanitizeContent(page.content));
      } else {
        setCmsParagraphs(null);
      }
    } catch (error: any) {
      console.warn('[AboutScreen] Unable to load CMS page:', error?.message || error);
      setCmsParagraphs(null);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPageContent();
  }, [loadPageContent, language]);

  const dictionary = useMemo(() => fallbackContent[language as 'ar' | 'en'] || fallbackContent.ar, [language]);

  const headerTitle = language === 'ar' ? 'من نحن' : 'About Altayar VIP';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => (navigation as any).goBack()}>
          <SafeIcon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{headerTitle}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={loadPageContent} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: theme.colors.primary + '15' }]}>
          <Text style={[styles.heroTitle, { color: theme.colors.primary }]}>{dictionary.heroTitle}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.text }]}>{dictionary.heroSubtitle}</Text>
        </View>

        <View style={styles.statsRow}>
          {dictionary.stats.map(stat => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {(cmsParagraphs || dictionary.sections).map((section, index) => {
          if (typeof section === 'string') {
            return (
              <View key={`cms-${index}`} style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionBody, { color: theme.colors.text }]}>{section}</Text>
              </View>
            );
          }

          return (
            <View key={`section-${section.title}`} style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
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
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export default AboutScreen;

