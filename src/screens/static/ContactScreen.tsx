import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { settingsService, GeneralSettings } from './../../services/settingsService';
import { SafeIcon } from './../../utils/iconHelper';

const fallbackSettings: GeneralSettings = {
  site_name: 'Altayar VIP',
  site_description: 'Altayar VIP premium travel services',
  contact_email: 'support@altayar.vip',
  contact_phone: '+966 55 555 5555',
  address: 'Riyadh, Saudi Arabia',
  social_media: {
    instagram: 'https://instagram.com/altayarvip',
  },
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
  maintenance_mode: false,
};

const translations = {
  ar: {
    title: 'تواصل معنا',
    subtitle: 'نخدمك على مدار الساعة عبر القنوات التالية.',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    address: 'العنوان',
    liveChat: 'دردشة مباشرة',
    openChat: 'فتح الدردشة',
    copy: 'نسخ',
  },
  en: {
    title: 'Contact Us',
    subtitle: 'We are available 24/7 through the channels below.',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    liveChat: 'Live Chat',
    openChat: 'Start Chat',
    copy: 'Copy',
  },
};

const openLink = async (url: string) => {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    }
  } catch (error) {
    console.warn('[ContactScreen] Unable to open url:', url, error);
  }
};

export const ContactScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const t = useMemo(() => translations[language as 'ar' | 'en'] || translations.ar, [language]);

  const loadSettings = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await settingsService.getGeneralSettings();
      const generalSettings = (response as any)?.data || response;
      setSettings(generalSettings);
    } catch (error: any) {
      console.warn('[ContactScreen] Unable to load settings:', error?.message || error);
      setSettings(null);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const mergedSettings = settings || fallbackSettings;

  const contactItems = [
    {
      key: 'phone',
      icon: 'call',
      label: t.phone,
      value: mergedSettings.contact_phone,
      onPress: () => openLink(`tel:${mergedSettings.contact_phone}`),
    },
    {
      key: 'email',
      icon: 'mail',
      label: t.email,
      value: mergedSettings.contact_email,
      onPress: () => openLink(`mailto:${mergedSettings.contact_email}`),
    },
    {
      key: 'address',
      icon: 'location',
      label: t.address,
      value: mergedSettings.address,
      onPress: () => openLink(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mergedSettings.address)}`),
    },
  ];

  const headerTitle = language === 'ar' ? 'تواصل معنا' : 'Contact Altayar VIP';

  const handleOpenChat = () => {
    try {
      const parentNav = (navigation as any).getParent();
      if (parentNav?.navigate) {
        parentNav.navigate('Chat');
      } else {
        (navigation as any).navigate('Chat');
      }
    } catch (error) {
      console.warn('[ContactScreen] Unable to navigate to Chat:', error);
    }
  };

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSettings} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: theme.colors.primary + '15' }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t.title}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t.subtitle}</Text>
        </View>

        {contactItems.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[styles.contactCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            activeOpacity={0.9}
            onPress={item.onPress}
          >
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primary + '20' }]}>
              <SafeIcon name={item.icon} size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactLabel, { color: theme.colors.textSecondary }]}>{item.label}</Text>
              <Text style={[styles.contactValue, { color: theme.colors.text }]}>{item.value}</Text>
            </View>
            <SafeIcon name="open-in-new" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}

        <View style={[styles.chatCard, { borderColor: theme.colors.border }]}>
          <View>
            <Text style={[styles.chatTitle, { color: theme.colors.text }]}>{t.liveChat}</Text>
            <Text style={[styles.chatSubtitle, { color: theme.colors.textSecondary }]}>
              {language === 'ar' ? 'تواصل مع فريق الدعم خلال ثوانٍ.' : 'Reach our support heroes in seconds.'}
            </Text>
          </View>
          <TouchableOpacity style={[styles.chatButton, { backgroundColor: theme.colors.primary }]} onPress={handleOpenChat}>
            <SafeIcon name="chatbubbles" size={18} color="#FFFFFF" />
            <Text style={styles.chatButtonText}>{t.openChat}</Text>
          </TouchableOpacity>
        </View>
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
  heroCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    textTransform: 'uppercase',
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  chatCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  chatSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 8,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default ContactScreen;

