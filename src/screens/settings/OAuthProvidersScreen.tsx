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
import { oauthService } from './../../services/oauthService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

interface OAuthProvider {
  provider: string;
  isLinked: boolean;
  linkedAt?: string;
  email?: string;
}

export const OAuthProvidersScreen: React.FC = () => {
  const { theme } = useTheme();
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await oauthService.getUserProviders();
      const providersData = response.data || response || [];
      setProviders(Array.isArray(providersData) ? providersData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل الموفرات',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProvider = async (provider: string) => {
    setLinking(provider);
    try {
      // For React Native, we need to use native OAuth libraries
      // This is a placeholder - in production, use the appropriate library
      Toast.show({
        type: 'info',
        text1: 'ربط الموفر',
        text2: `سيتم إضافة ربط ${provider} قريباً`,
      });
      
      // TODO: Implement actual OAuth linking
      // const token = await getOAuthToken(provider);
      // await oauthService.linkProvider({
      //   provider,
      //   token,
      // });
      
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || `فشل ربط ${provider}`,
      });
    } finally {
      setLinking(null);
    }
  };

  const handleUnlinkProvider = async (provider: string) => {
    Alert.alert(
      'إلغاء الربط',
      `هل أنت متأكد من إلغاء ربط ${provider}?`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إلغاء الربط',
          style: 'destructive',
          onPress: async () => {
            try {
              await oauthService.unlinkProvider(provider);
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: `تم إلغاء ربط ${provider} بنجاح`,
              });
              loadProviders();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || `فشل إلغاء ربط ${provider}`,
              });
            }
          },
        },
      ]
    );
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      google: 'Google',
      apple: 'Apple',
    };
    return names[provider] || provider;
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      google: 'logo-google',
      apple: 'logo-apple',
    };
    return icons[provider] || 'link';
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      google: '#4285F4',
      apple: '#000000',
    };
    return colors[provider] || theme.colors.primary;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Default providers if none are returned
  const defaultProviders: OAuthProvider[] = [
    { provider: 'google', isLinked: false },
    { provider: 'apple', isLinked: false },
  ];

  const displayProviders = providers.length > 0 ? providers : defaultProviders;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>ربط الحسابات</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            ربط حسابك بخدمات خارجية لتسجيل الدخول بسهولة
          </Text>
        </View>

        <View style={styles.providersList}>
          {displayProviders.map((provider) => {
            const providerColor = getProviderColor(provider.provider);
            const isLinking = linking === provider.provider;

            return (
              <View
                key={provider.provider}
                style={[styles.providerCard, { backgroundColor: theme.colors.surface }]}
              >
                <View style={styles.providerInfo}>
                  <View
                    style={[
                      styles.providerIconContainer,
                      { backgroundColor: providerColor + '20' },
                    ]}
                  >
                    <SafeIcon
                      name={getProviderIcon(provider.provider)}
                      size={32}
                      color={providerColor}
                    />
                  </View>
                  <View style={styles.providerDetails}>
                    <Text style={[styles.providerName, { color: theme.colors.text }]}>
                      {getProviderName(provider.provider)}
                    </Text>
                    {provider.isLinked ? (
                      <>
                        {provider.email && (
                          <Text style={[styles.providerEmail, { color: theme.colors.textSecondary }]}>
                            {provider.email}
                          </Text>
                        )}
                        {provider.linkedAt && (
                          <Text style={[styles.providerDate, { color: theme.colors.textSecondary }]}>
                            مرتبط منذ: {new Date(provider.linkedAt).toLocaleDateString('ar-EG')}
                          </Text>
                        )}
                        <View style={[styles.statusBadge, { backgroundColor: theme.colors.success + '20' }]}>
                          <Text style={[styles.statusText, { color: theme.colors.success }]}>
                            مرتبط
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={[styles.providerStatus, { color: theme.colors.textSecondary }]}>
                        غير مرتبط
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    provider.isLinked
                      ? { backgroundColor: theme.colors.error + '20' }
                      : { backgroundColor: providerColor + '20' },
                  ]}
                  onPress={() =>
                    provider.isLinked
                      ? handleUnlinkProvider(provider.provider)
                      : handleLinkProvider(provider.provider)
                  }
                  disabled={isLinking}
                >
                  {isLinking ? (
                    <ActivityIndicator size="small" color={providerColor} />
                  ) : (
                    <>
                      <SafeIcon
                        name={provider.isLinked ? 'unlink' : 'link'}
                        size={20}
                        color={provider.isLinked ? theme.colors.error : providerColor}
                      />
                      <Text
                        style={[
                          styles.actionButtonText,
                          {
                            color: provider.isLinked ? theme.colors.error : providerColor,
                          },
                        ]}
                      >
                        {provider.isLinked ? 'إلغاء الربط' : 'ربط'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.primary + '10' }]}>
          <SafeIcon name="info" size={24} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            ربط حسابك بخدمات خارجية يسمح لك بتسجيل الدخول بسهولة دون الحاجة لإدخال كلمة المرور
          </Text>
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
  providersList: {
    gap: 12,
    marginBottom: 16,
  },
  providerCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  providerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  providerEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  providerDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  providerStatus: {
    fontSize: 14,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
});

