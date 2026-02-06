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
import { paymentAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

interface PaymentMethod {
  id: string;
  type: string;
  name: string;
  description?: string;
  isActive: boolean;
  icon?: string;
}

export const PaymentMethodsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPaymentMethods();
      const methodsData = response.data || response || [];
      setPaymentMethods(Array.isArray(methodsData) ? methodsData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل طرق الدفع',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    const icons: Record<string, string> = {
      credit_card: 'credit-card',
      debit_card: 'card',
      bank_transfer: 'account-balance',
      fawaterak: 'payment',
      cash: 'money',
      wallet: 'account-balance-wallet',
    };
    return icons[type] || 'payment';
  };

  const getPaymentMethodName = (type: string) => {
    const names: Record<string, string> = {
      credit_card: 'بطاقة ائتمانية',
      debit_card: 'بطاقة خصم',
      bank_transfer: 'تحويل بنكي',
      fawaterak: 'Fawaterak',
      cash: 'نقدي',
      wallet: 'محفظة إلكترونية',
    };
    return names[type] || type;
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>طرق الدفع</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            اختر طريقة الدفع المفضلة لديك
          </Text>
        </View>

        <View style={styles.methodsList}>
          {paymentMethods.length === 0 ? (
            <View style={styles.emptyContainer}>
              <SafeIcon name="payment" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                لا توجد طرق دفع متاحة
              </Text>
            </View>
          ) : (
            paymentMethods.map((method) => (
              <View
                key={method.id}
                style={[
                  styles.methodCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: method.isActive ? theme.colors.primary : theme.colors.border,
                    borderWidth: method.isActive ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.methodInfo}>
                  <View
                    style={[
                      styles.methodIconContainer,
                      { backgroundColor: theme.colors.primary + '20' },
                    ]}
                  >
                    <SafeIcon
                      name={getPaymentMethodIcon(method.type)}
                      size={32}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.methodDetails}>
                    <Text style={[styles.methodName, { color: theme.colors.text }]}>
                      {method.name || getPaymentMethodName(method.type)}
                    </Text>
                    {method.description && (
                      <Text style={[styles.methodDescription, { color: theme.colors.textSecondary }]}>
                        {method.description}
                      </Text>
                    )}
                  </View>
                </View>
                {method.isActive && (
                  <View style={[styles.activeBadge, { backgroundColor: theme.colors.success + '20' }]}>
                    <Text style={[styles.activeText, { color: theme.colors.success }]}>نشط</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.primary + '10' }]}>
          <SafeIcon name="info" size={24} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            جميع طرق الدفع آمنة ومشفرة. لن يتم حفظ معلومات الدفع الخاصة بك.
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
  methodsList: {
    gap: 12,
    marginBottom: 16,
  },
  methodCard: {
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
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  methodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeText: {
    fontSize: 12,
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

