import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import Clipboard, { isClipboardAvailable } from '../../utils/safeClipboard';
import { useNavigation } from '@react-navigation/native';
import { affiliateService } from '../../services/affiliateService';
import { useTheme } from '../../hooks/useTheme';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SafeIcon } from '../../utils/iconHelper';
import Toast from 'react-native-toast-message';

const normalizeResponse = <T,>(response: T | { data?: T }): T => {
  if (response && typeof response === 'object' && 'data' in (response as any) && (response as any).data !== undefined) {
    return (response as any).data as T;
  }
  return response as T;
};

export const AffiliatesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [affiliateCode, setAffiliateCode] = useState<{ code: string; link: string } | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAffiliateData();
  }, []);

  const loadAffiliateData = async () => {
    try {
      setIsLoading(true);
      const [codeResponse, referralsResponse] = await Promise.all([
        affiliateService.getMyCode(),
        affiliateService.getMyReferrals(),
      ]);
      const codeData = normalizeResponse(codeResponse);
      const referralsData = Array.isArray(referralsResponse)
        ? referralsResponse
        : normalizeResponse(referralsResponse);
      setAffiliateCode(codeData ?? null);
      setReferrals(referralsData);
    } catch (error: any) {
      console.error('Error loading affiliate data:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل تحميل بيانات الإحالة',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!affiliateCode) return;

    try {
      await Share.share({
        message: `انضم إلى التطبيق باستخدام كود الإحالة الخاص بي: ${affiliateCode.code}\n${affiliateCode.link}`,
        title: 'كود الإحالة',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    const message = isClipboardAvailable
      ? 'تم نسخ الكود إلى الحافظة'
      : 'تم نسخ الكود محلياً، لكن الحافظة الأصلية غير مفعلة على هذا الجهاز';
    Alert.alert('تم النسخ', message);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>كود الإحالة الخاص بي</Text>
        {affiliateCode && (
          <>
            <View style={[styles.codeContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Text style={[styles.codeText, { color: theme.colors.text }]}>{affiliateCode.code}</Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(affiliateCode.code)}
                style={styles.copyButton}
              >
                <SafeIcon name="copy" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleShare}
            >
              <SafeIcon name="share" size={20} color="#fff" />
              <Text style={styles.shareButtonText}>مشاركة الكود</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AffiliateEarnings' as never)}
      >
        <View style={styles.earningsHeader}>
          <SafeIcon name="trending-up" size={32} color="#FFFFFF" />
          <View style={styles.earningsInfo}>
            <Text style={styles.earningsTitle}>عرض الأرباح</Text>
            <Text style={styles.earningsSubtitle}>تتبع أرباحك من برنامج الإحالة</Text>
          </View>
          <SafeIcon name="chevron-right" size={24} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>الإحالات ({referrals.length})</Text>
        {referrals.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            لا توجد إحالات حتى الآن
          </Text>
        ) : (
          referrals.map((referral) => (
            <View key={referral.id} style={[styles.referralItem, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.referralInfo}>
                <Text style={[styles.referralName, { color: theme.colors.text }]}>
                  {referral.user?.name || referral.email || 'مستخدم'}
                </Text>
                <Text style={[styles.referralDate, { color: theme.colors.textSecondary }]}>
                  {referral.created_at ? new Date(referral.created_at).toLocaleDateString('ar-EG') : ''}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: referral.isActive ? theme.colors.success : theme.colors.error + '20' }]}>
                <Text style={[styles.statusText, { color: referral.isActive ? theme.colors.success : theme.colors.error }]}>
                  {referral.isActive ? 'نشط' : 'غير نشط'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  earningsInfo: {
    flex: 1,
  },
  earningsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  earningsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  referralItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  referralDate: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

