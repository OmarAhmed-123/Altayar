import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { affiliateService } from './../../services/affiliateService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

interface AffiliateLink {
  id: number;
  campaignId: number;
  userId: number;
  code: string;
  baseUrl?: string;
  clicks: number;
  conversions: number;
  earnings: number;
  created_at: string;
}

interface AffiliateEarnings {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
}

export const AffiliateEarningsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [earnings, setEarnings] = useState<AffiliateEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank');

  const paymentMethodDynamicStyles = useMemo(
    () => ({
      selectedButton: {
        backgroundColor: theme.colors.primary,
      },
      selectedText: {
        color: '#FFFFFF',
      },
      unselectedText: {
        color: theme.colors.text,
      },
    }),
    [theme.colors.primary, theme.colors.text],
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [linksResponse, earningsResponse] = await Promise.all([
        affiliateService.getMyAffiliateLinks(),
        affiliateService.getAffiliateEarnings(),
      ]);

      const linksData = linksResponse.data || linksResponse || [];
      setLinks(Array.isArray(linksData) ? linksData : []);

      const earningsData = earningsResponse.data || earningsResponse;
      setEarnings(earningsData);
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
  };

  const handleRequestPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى إدخال مبلغ صحيح',
      });
      return;
    }

    if (earnings && parseFloat(payoutAmount) > earnings.pendingEarnings) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'المبلغ المطلوب أكبر من الأرباح المتاحة',
      });
      return;
    }

    try {
      await affiliateService.requestPayout({
        amount: parseFloat(payoutAmount),
        paymentMethod: payoutMethod,
      });
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم إرسال طلب السحب بنجاح',
      });
      setShowPayoutModal(false);
      setPayoutAmount('');
      loadData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل إرسال طلب السحب',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const renderLinkItem = ({ item }: { item: AffiliateLink }) => (
    <View style={[styles.linkCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.linkHeader}>
        <View style={styles.linkInfo}>
          <Text style={[styles.linkCode, { color: theme.colors.text }]}>{item.code}</Text>
          <Text style={[styles.linkUrl, { color: theme.colors.textSecondary }]}>
            {item.baseUrl || 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.linkStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>النقرات</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{item.clicks}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>التحويلات</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{item.conversions}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>الأرباح</Text>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {formatCurrency(item.earnings)}
          </Text>
        </View>
      </View>
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>أرباح الإحالة</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          تتبع أرباحك من برنامج الإحالة
        </Text>
      </View>

      {earnings && (
        <View style={styles.earningsSummary}>
          <View style={[styles.earningsCard, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.earningsLabel}>إجمالي الأرباح</Text>
            <Text style={styles.earningsValue}>{formatCurrency(earnings.totalEarnings)}</Text>
          </View>

          <View style={styles.earningsGrid}>
            <View style={[styles.earningsItem, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.earningsItemLabel, { color: theme.colors.textSecondary }]}>
                قيد الانتظار
              </Text>
              <Text style={[styles.earningsItemValue, { color: theme.colors.warning }]}>
                {formatCurrency(earnings.pendingEarnings)}
              </Text>
            </View>

            <View style={[styles.earningsItem, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.earningsItemLabel, { color: theme.colors.textSecondary }]}>
                مدفوع
              </Text>
              <Text style={[styles.earningsItemValue, { color: theme.colors.success }]}>
                {formatCurrency(earnings.paidEarnings)}
              </Text>
            </View>
          </View>

          <View style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.statRow}>
              <Text style={[styles.statRowLabel, { color: theme.colors.textSecondary }]}>
                إجمالي النقرات
              </Text>
              <Text style={[styles.statRowValue, { color: theme.colors.text }]}>
                {earnings.totalClicks}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statRowLabel, { color: theme.colors.textSecondary }]}>
                إجمالي التحويلات
              </Text>
              <Text style={[styles.statRowValue, { color: theme.colors.text }]}>
                {earnings.totalConversions}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statRowLabel, { color: theme.colors.textSecondary }]}>
                معدل التحويل
              </Text>
              <Text style={[styles.statRowValue, { color: theme.colors.primary }]}>
                {earnings.conversionRate.toFixed(2)}%
              </Text>
            </View>
          </View>

          {earnings.pendingEarnings > 0 && (
            <TouchableOpacity
              style={[styles.payoutButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowPayoutModal(true)}
            >
              <SafeIcon name="payment" size={24} color="#FFFFFF" />
              <Text style={styles.payoutButtonText}>طلب سحب</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.linksSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>روابط الإحالة</Text>
        <FlatList
          data={links}
          renderItem={renderLinkItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.linksList}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <SafeIcon name="link" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                لا توجد روابط إحالة
              </Text>
            </View>
          }
        />
      </View>

      {/* Payout Modal */}
      {showPayoutModal && earnings && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>طلب سحب</Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              الأرباح المتاحة: {formatCurrency(earnings.pendingEarnings)}
            </Text>

            <View style={styles.modalForm}>
              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>المبلغ</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                value={payoutAmount}
                onChangeText={setPayoutAmount}
                placeholder="أدخل المبلغ"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
              />

              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>طريقة الدفع</Text>
              <View style={styles.paymentMethods}>
                {['bank', 'paypal', 'cash'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentMethodButton,
                      payoutMethod === method && paymentMethodDynamicStyles.selectedButton,
                    ]}
                    onPress={() => setPayoutMethod(method)}
                  >
                    <Text
                      style={[
                        styles.paymentMethodText,
                        payoutMethod === method
                          ? paymentMethodDynamicStyles.selectedText
                          : paymentMethodDynamicStyles.unselectedText,
                      ]}
                    >
                      {method === 'bank' ? 'بنك' : method === 'paypal' ? 'PayPal' : 'نقدي'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowPayoutModal(false);
                    setPayoutAmount('');
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleRequestPayout}
                >
                  <Text style={styles.modalButtonTextWhite}>إرسال</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  earningsSummary: {
    padding: 16,
  },
  earningsCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  earningsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  earningsItem: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  earningsItemLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  earningsItemValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statRowLabel: {
    fontSize: 14,
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  payoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linksSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  linksList: {
    padding: 16,
  },
  linkCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  linkHeader: {
    marginBottom: 12,
  },
  linkInfo: {
    gap: 4,
  },
  linkCode: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkUrl: {
    fontSize: 12,
  },
  linkStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
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
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  modalForm: {
    gap: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentMethodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextWhite: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

