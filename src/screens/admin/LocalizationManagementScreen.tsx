import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
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
  isDefault?: boolean;
}

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchangeRate?: number;
  isDefault?: boolean;
}

export const LocalizationManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(theme), [theme]);
  const [activeTab, setActiveTab] = useState<'languages' | 'currencies' | 'translations'>('languages');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [languageFormData, setLanguageFormData] = useState({
    code: '',
    name: '',
    nativeName: '',
    flagEmoji: '',
    isRtl: false,
    isDefault: false,
  });
  const [currencyFormData, setCurrencyFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    exchangeRate: '',
    isDefault: false,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'languages') {
        const response = await localizationAPI.getLanguages();
        const langsData = response.data || response || [];
        setLanguages(Array.isArray(langsData) ? langsData : []);
      } else if (activeTab === 'currencies') {
        const response = await localizationAPI.getCurrencies();
        const currenciesData = response.data || response || [];
        setCurrencies(Array.isArray(currenciesData) ? currenciesData : []);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل البيانات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveLanguage = async () => {
    if (!languageFormData.code || !languageFormData.name || !languageFormData.nativeName) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      if (editingLanguage) {
        await localizationAPI.updateLanguage(editingLanguage.id, languageFormData);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم تحديث اللغة بنجاح',
        });
      } else {
        await localizationAPI.createLanguage(languageFormData);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم إنشاء اللغة بنجاح',
        });
      }
      setShowLanguageModal(false);
      setEditingLanguage(null);
      resetLanguageForm();
      loadData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل حفظ اللغة',
      });
    }
  };

  const handleSaveCurrency = async () => {
    if (!currencyFormData.code || !currencyFormData.name || !currencyFormData.symbol) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      if (editingCurrency) {
        await localizationAPI.updateCurrency(editingCurrency.id, currencyFormData);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم تحديث العملة بنجاح',
        });
      } else {
        await localizationAPI.createCurrency({
          ...currencyFormData,
          exchangeRate: currencyFormData.exchangeRate ? parseFloat(currencyFormData.exchangeRate) : undefined,
        });
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم إنشاء العملة بنجاح',
        });
      }
      setShowCurrencyModal(false);
      setEditingCurrency(null);
      resetCurrencyForm();
      loadData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل حفظ العملة',
      });
    }
  };

  const resetLanguageForm = () => {
    setLanguageFormData({
      code: '',
      name: '',
      nativeName: '',
      flagEmoji: '',
      isRtl: false,
      isDefault: false,
    });
  };

  const resetCurrencyForm = () => {
    setCurrencyFormData({
      code: '',
      name: '',
      symbol: '',
      exchangeRate: '',
      isDefault: false,
    });
  };

  const openEditLanguage = (language: Language) => {
    setEditingLanguage(language);
    setLanguageFormData({
      code: language.code,
      name: language.name,
      nativeName: language.nativeName,
      flagEmoji: language.flagEmoji || '',
      isRtl: language.isRtl || false,
      isDefault: language.isDefault || false,
    });
    setShowLanguageModal(true);
  };

  const openEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    setCurrencyFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate?.toString() || '',
      isDefault: currency.isDefault || false,
    });
    setShowCurrencyModal(true);
  };

  const renderLanguageItem = ({ item }: { item: Language }) => (
        <View style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          {item.flagEmoji && <Text style={styles.flagEmoji}>{item.flagEmoji}</Text>}
          <View style={styles.itemDetails}>
            <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.nativeName}</Text>
            <Text style={[styles.itemCode, { color: theme.colors.textSecondary }]}>
              {item.name} ({item.code})
            </Text>
          </View>
        </View>
        <View style={styles.badges}>
          {item.isDefault && (
            <View style={[styles.badge, dynamicStyles.badgePrimary]}>
              <Text style={[styles.badgeText, dynamicStyles.badgePrimaryText]}>افتراضي</Text>
            </View>
          )}
          {item.isRtl && (
            <View style={[styles.badge, dynamicStyles.badgeSecondary]}>
              <Text style={[styles.badgeText, dynamicStyles.badgeSecondaryText]}>RTL</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.editButton, dynamicStyles.editButtonPrimary]}
        onPress={() => openEditLanguage(item)}
      >
        <SafeIcon name="edit" size={18} color="#2196F3" />
        <Text style={[styles.editButtonText, dynamicStyles.editButtonPrimaryText]}>تعديل</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrencyItem = ({ item }: { item: Currency }) => (
    <View style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <View style={styles.itemDetails}>
            <Text style={[styles.itemName, { color: theme.colors.text }]}>
              {item.name} ({item.symbol})
            </Text>
            <Text style={[styles.itemCode, { color: theme.colors.textSecondary }]}>
              {item.code}
              {item.exchangeRate && ` - سعر الصرف: ${item.exchangeRate}`}
            </Text>
          </View>
        </View>
        {item.isDefault && (
          <View style={[styles.badge, dynamicStyles.badgePrimary]}>
            <Text style={[styles.badgeText, dynamicStyles.badgePrimaryText]}>افتراضي</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.editButton, dynamicStyles.editButtonPrimary]}
        onPress={() => openEditCurrency(item)}
      >
        <SafeIcon name="edit" size={18} color="#2196F3" />
        <Text style={[styles.editButtonText, dynamicStyles.editButtonPrimaryText]}>تعديل</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة التوطين</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'languages' ? dynamicStyles.tabActive : null,
          ]}
          onPress={() => setActiveTab('languages')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'languages'
                ? dynamicStyles.tabTextActive
                : dynamicStyles.tabTextInactive,
            ]}
          >
            اللغات ({languages.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'currencies' ? dynamicStyles.tabActive : null,
          ]}
          onPress={() => setActiveTab('currencies')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'currencies'
                ? dynamicStyles.tabTextActive
                : dynamicStyles.tabTextInactive,
            ]}
          >
            العملات ({currencies.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'translations' ? dynamicStyles.tabActive : null,
          ]}
          onPress={() => setActiveTab('translations')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'translations'
                ? dynamicStyles.tabTextActive
                : dynamicStyles.tabTextInactive,
            ]}
          >
            الترجمات
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'languages' && (
        <>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              resetLanguageForm();
              setEditingLanguage(null);
              setShowLanguageModal(true);
            }}
          >
            <SafeIcon name="add" size={24} color="#FFFFFF" />
            <Text style={styles.createButtonText}>لغة جديدة</Text>
          </TouchableOpacity>

          <FlatList
            data={languages}
            renderItem={renderLanguageItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadData();
                }}
                colors={[theme.colors.primary]}
              />
            }
          />
        </>
      )}

      {activeTab === 'currencies' && (
        <>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              resetCurrencyForm();
              setEditingCurrency(null);
              setShowCurrencyModal(true);
            }}
          >
            <SafeIcon name="add" size={24} color="#FFFFFF" />
            <Text style={styles.createButtonText}>عملة جديدة</Text>
          </TouchableOpacity>

          <FlatList
            data={currencies}
            renderItem={renderCurrencyItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadData();
                }}
                colors={[theme.colors.primary]}
              />
            }
          />
        </>
      )}

      {activeTab === 'translations' && (
        <View style={styles.content}>
          <View style={[styles.infoCard, { backgroundColor: theme.colors.primary + '10' }]}>
            <SafeIcon name="info" size={24} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              إدارة الترجمات متاحة عبر API. يمكن إضافة واجهة إدارة الترجمات هنا لاحقاً.
            </Text>
          </View>
        </View>
      )}

      {/* Language Modal */}
      {showLanguageModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingLanguage ? 'تعديل اللغة' : 'لغة جديدة'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowLanguageModal(false);
                  setEditingLanguage(null);
                  resetLanguageForm();
                }}
              >
                <SafeIcon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>رمز اللغة *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={languageFormData.code}
                  onChangeText={(text) => setLanguageFormData({ ...languageFormData, code: text })}
                  placeholder="ar, en, fr"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>الاسم *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={languageFormData.name}
                  onChangeText={(text) => setLanguageFormData({ ...languageFormData, name: text })}
                  placeholder="Arabic, English"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>الاسم الأصلي *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={languageFormData.nativeName}
                  onChangeText={(text) => setLanguageFormData({ ...languageFormData, nativeName: text })}
                  placeholder="العربية, English"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>رمز العلم</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={languageFormData.flagEmoji}
                  onChangeText={(text) => setLanguageFormData({ ...languageFormData, flagEmoji: text })}
                  placeholder="🇪🇬"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.switchGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>من اليمين لليسار (RTL)</Text>
                <Switch
                  value={languageFormData.isRtl}
                  onValueChange={(value) => setLanguageFormData({ ...languageFormData, isRtl: value })}
                  trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
                  thumbColor={languageFormData.isRtl ? theme.colors.primary : '#F4F3F4'}
                />
              </View>

              <View style={styles.switchGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>اللغة الافتراضية</Text>
                <Switch
                  value={languageFormData.isDefault}
                  onValueChange={(value) => setLanguageFormData({ ...languageFormData, isDefault: value })}
                  trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
                  thumbColor={languageFormData.isDefault ? theme.colors.primary : '#F4F3F4'}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveLanguage}
              >
                <Text style={styles.submitButtonText}>{editingLanguage ? 'تحديث' : 'إنشاء'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Currency Modal */}
      {showCurrencyModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingCurrency ? 'تعديل العملة' : 'عملة جديدة'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCurrencyModal(false);
                  setEditingCurrency(null);
                  resetCurrencyForm();
                }}
              >
                <SafeIcon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>رمز العملة *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={currencyFormData.code}
                  onChangeText={(text) => setCurrencyFormData({ ...currencyFormData, code: text })}
                  placeholder="EGP, USD, EUR"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>الاسم *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={currencyFormData.name}
                  onChangeText={(text) => setCurrencyFormData({ ...currencyFormData, name: text })}
                  placeholder="Egyptian Pound"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>الرمز *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={currencyFormData.symbol}
                  onChangeText={(text) => setCurrencyFormData({ ...currencyFormData, symbol: text })}
                  placeholder="£, $, €"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>سعر الصرف</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={currencyFormData.exchangeRate}
                  onChangeText={(text) => setCurrencyFormData({ ...currencyFormData, exchangeRate: text })}
                  placeholder="1.0"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.switchGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>العملة الافتراضية</Text>
                <Switch
                  value={currencyFormData.isDefault}
                  onValueChange={(value) => setCurrencyFormData({ ...currencyFormData, isDefault: value })}
                  trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
                  thumbColor={currencyFormData.isDefault ? theme.colors.primary : '#F4F3F4'}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveCurrency}
              >
                <Text style={styles.submitButtonText}>{editingCurrency ? 'تحديث' : 'إنشاء'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  flagEmoji: {
    fontSize: 32,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 14,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    maxHeight: 500,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

const createDynamicStyles = (theme: any) =>
  StyleSheet.create({
    tabActive: {
      backgroundColor: theme.colors.primary,
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
    tabTextInactive: {
      color: theme.colors.text,
    },
    badgePrimary: {
      backgroundColor: `${theme.colors.primary}20`,
    },
    badgePrimaryText: {
      color: theme.colors.primary,
    },
    badgeSecondary: {
      backgroundColor: `${theme.colors.secondary}20`,
    },
    badgeSecondaryText: {
      color: theme.colors.secondary,
    },
    editButtonPrimary: {
      backgroundColor: '#2196F320',
    },
    editButtonPrimaryText: {
      color: '#2196F3',
    },
  });

