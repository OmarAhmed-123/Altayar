import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { recommendationAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

interface RecommendationPreferences {
  preferredCategories?: string[];
  preferredPriceRange?: {
    min: number;
    max: number;
  };
  preferredDestinations?: string[];
  preferredDuration?: {
    min: number;
    max: number;
  };
  enablePersonalizedRecommendations?: boolean;
  enableTrendingPackages?: boolean;
  enableEmailNotifications?: boolean;
}

export const RecommendationPreferencesScreen: React.FC = () => {
  const { theme } = useTheme();
  const [preferences, setPreferences] = useState<RecommendationPreferences>({
    enablePersonalizedRecommendations: true,
    enableTrendingPackages: true,
    enableEmailNotifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      // Note: Backend might not have a get preferences endpoint
      // This is a placeholder - preferences might be stored locally or fetched differently
      setPreferences({
        enablePersonalizedRecommendations: true,
        enableTrendingPackages: true,
        enableEmailNotifications: false,
      });
    } catch (error: any) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      await recommendationAPI.updateUserPreferences(preferences);
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم حفظ التفضيلات بنجاح',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل حفظ التفضيلات',
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
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>تفضيلات التوصيات</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            حدد تفضيلاتك للحصول على توصيات أفضل
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>الإعدادات العامة</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                التوصيات المخصصة
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                احصل على توصيات مخصصة بناءً على تفضيلاتك
              </Text>
            </View>
            <Switch
              value={preferences.enablePersonalizedRecommendations}
              onValueChange={(value) =>
                setPreferences({ ...preferences, enablePersonalizedRecommendations: value })
              }
              trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
              thumbColor={preferences.enablePersonalizedRecommendations ? theme.colors.primary : '#F4F3F4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                الباقات الرائجة
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                اعرض الباقات الأكثر شعبية
              </Text>
            </View>
            <Switch
              value={preferences.enableTrendingPackages}
              onValueChange={(value) =>
                setPreferences({ ...preferences, enableTrendingPackages: value })
              }
              trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
              thumbColor={preferences.enableTrendingPackages ? theme.colors.primary : '#F4F3F4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                إشعارات البريد الإلكتروني
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                احصل على إشعارات عند توفر توصيات جديدة
              </Text>
            </View>
            <Switch
              value={preferences.enableEmailNotifications}
              onValueChange={(value) =>
                setPreferences({ ...preferences, enableEmailNotifications: value })
              }
              trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
              thumbColor={preferences.enableEmailNotifications ? theme.colors.primary : '#F4F3F4'}
            />
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.primary + '10' }]}>
          <SafeIcon name="info" size={24} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            كلما زادت المعلومات التي تشاركها عن تفضيلاتك، كلما كانت التوصيات أكثر دقة
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSavePreferences}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <SafeIcon name="save" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>حفظ التفضيلات</Text>
            </>
          )}
        </TouchableOpacity>
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
  header: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

