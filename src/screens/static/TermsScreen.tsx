import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { settingsService } from './../../services/settingsService';
import { SafeIcon } from './../../utils/iconHelper';

const TERMS_SLUG = 'terms-and-conditions';

const translations = {
  ar: {
    title: 'الشروط والأحكام',
    lastUpdated: 'آخر تحديث',
    sections: [
      {
        title: '1. التزامات العضوية',
        body: 'يجب أن تكون بيانات العضو صحيحة ومحدثة. يحق للفريق إيقاف الحساب عند إساءة الاستخدام أو مشاركة البطاقة مع أطراف أخرى.',
      },
      {
        title: '2. الحجوزات والمدفوعات',
        body: 'جميع الأسعار قابلة للتحديث. يتم إصدار فاتورة PDF لكل حجز، ولا يعد الحجز مؤكداً إلا بعد استلام الدفعة أو الموافقة المكتوبة.',
      },
      {
        title: '3. النقاط والفوتشرات',
        body: 'تضاف النقاط تلقائياً عند إتمام الاشتراك أو الحجز. تنتهي صلاحية الفوتشرات في تاريخها المحدد ولا يمكن استبدالها نقداً.',
      },
      {
        title: '4. سياسة الإلغاء',
        body: 'يُسمح بإلغاء أو تعديل الحجز وفق سياسة المزود. قد تُفرض رسوم عند الإلغاء المتأخر أو عدم الحضور.',
      },
    ],
  },
  en: {
    title: 'Terms & Conditions',
    lastUpdated: 'Last updated',
    sections: [
      {
        title: '1. Membership obligations',
        body: 'Members must keep their profile data accurate. The team may pause accounts in case of misuse or sharing digital cards with third parties.',
      },
      {
        title: '2. Bookings & payments',
        body: 'Prices are dynamic. Each booking receives a PDF invoice. Reservations are only confirmed once the payment or written approval is received.',
      },
      {
        title: '3. Points & vouchers',
        body: 'Points are added automatically after memberships or bookings. Vouchers expire on their stated date and cannot be converted to cash.',
      },
      {
        title: '4. Cancellation policy',
        body: 'Changes or cancellations follow the supplier’s policy. Late cancellations or no-shows may incur additional fees.',
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

export const TermsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [paragraphs, setParagraphs] = useState<string[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const t = useMemo(() => translations[language as 'ar' | 'en'] || translations.ar, [language]);

  const loadTerms = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await settingsService.getPageBySlug(TERMS_SLUG);
      const page = (response as any)?.data || response;
      if (page?.content) {
        setParagraphs(sanitizeContent(page.content));
        setLastUpdated(page.updated_at || page.created_at || null);
      } else {
        setParagraphs(null);
        setLastUpdated(null);
      }
    } catch (error: any) {
      console.warn('[TermsScreen] Unable to load CMS content:', error?.message || error);
      setParagraphs(null);
      setLastUpdated(null);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTerms();
  }, [loadTerms, language]);

  const formattedDate = useMemo(() => {
    if (!lastUpdated) {
      return null;
    }
    try {
      return new Date(lastUpdated).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return lastUpdated;
    }
  }, [lastUpdated, language]);

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadTerms} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {formattedDate && (
          <View style={[styles.badge, { backgroundColor: theme.colors.primary + '15' }]}>
            <SafeIcon name="time" size={16} color={theme.colors.primary} />
            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
              {t.lastUpdated}: {formattedDate}
            </Text>
          </View>
        )}

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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
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

export default TermsScreen;

