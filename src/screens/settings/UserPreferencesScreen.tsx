import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { localizationAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

interface Language {
  id: number;
  code: string;
  name: string;
  nativeName: string;
  flagEmoji?: string;
  isRtl?: boolean;
}

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchangeRate?: number;
}

export const UserPreferencesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currentCurrency, setCurrentCurrency] = useState<string>('EGP');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const [langsResponse, currenciesResponse, preferencesResponse] = await Promise.all([
        localizationAPI.getLanguages(),
        localizationAPI.getCurrencies(),
        localizationAPI.getUserPreferences().catch(() => null),
      ]);

      const langsData = langsResponse.data || langsResponse || [];
      const currenciesData = currenciesResponse.data || currenciesResponse || [];

      setLanguages(Array.isArray(langsData) ? langsData : []);
      setCurrencies(Array.isArray(currenciesData) ? currenciesData : []);

      if (preferencesResponse?.data) {
        const prefs = preferencesResponse.data;
        if (prefs.languageCode) {
          setLanguage(prefs.languageCode);
        }
        if (prefs.currencyCode) {
          setCurrentCurrency(prefs.currencyCode);
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل التفضيلات',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (langCode: string) => {
    try {
      setSaving(true);
      await localizationAPI.updateUserLanguage(langCode);
      setLanguage(langCode);
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم تحديث اللغة بنجاح',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحديث اللغة',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCurrencyChange = async (currencyCode: string) => {
    try {
      setSaving(true);
      await localizationAPI.updateUserCurrency(currencyCode);
      setCurrentCurrency(currencyCode);
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم تحديث العملة بنجاح',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحديث العملة',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Language Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <SafeIcon name="language" size={24} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>اللغة</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            اختر اللغة المفضلة للتطبيق
          </Text>

          <View style={styles.optionsList}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.optionItem,
                  language === lang.code && { backgroundColor: theme.colors.primary + '20' },
                ]}
                onPress={() => handleLanguageChange(lang.code)}
                disabled={saving}
              >
                <View style={styles.optionContent}>
                  {lang.flagEmoji && (
                    <Text style={styles.flagEmoji}>{lang.flagEmoji}</Text>
                  )}
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                      {lang.nativeName}
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>
                      {lang.name}
                    </Text>
                  </View>
                </View>
                {language === lang.code && (
                  <SafeIcon name="check-circle" size={24} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Currency Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <SafeIcon name="attach-money" size={24} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>العملة</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            اختر العملة المفضلة للعرض
          </Text>

          <View style={styles.optionsList}>
            {currencies.map((currency) => (
              <TouchableOpacity
                key={currency.id}
                style={[
                  styles.optionItem,
                  currentCurrency === currency.code && { backgroundColor: theme.colors.primary + '20' },
                ]}
                onPress={() => handleCurrencyChange(currency.code)}
                disabled={saving}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.currencySymbol, { color: theme.colors.primary }]}>
                    {currency.symbol}
                  </Text>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                      {currency.name}
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>
                      {currency.code}
                    </Text>
                  </View>
                </View>
                {currentCurrency === currency.code && (
                  <SafeIcon name="check-circle" size={24} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  flagEmoji: {
    fontSize: 24,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    width: 32,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
  },
});

