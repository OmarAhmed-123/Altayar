import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { transactionService, type Transaction, type SalesReport } from './../../services/transactionService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const TransactionsManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(theme), [theme]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'sales' | 'payment-history'>('transactions');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'transactions') {
        const transactionsData = await transactionService.getAllTransactions();
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      } else if (activeTab === 'sales') {
        const report = await transactionService.getSalesReports();
        setSalesReport(report || null);
      } else if (activeTab === 'payment-history') {
        const transactionsData = await transactionService.getPaymentHistory();
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
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

  const getTransactionTypeName = (type: string) => {
    const types: Record<string, string> = {
      membership_purchase: 'شراء عضوية',
      booking_payment: 'دفع حجز',
      cashback_earned: 'كاش باك مكتسب',
      points_spent: 'نقاط مستخدمة',
      manual_deposit: 'إيداع يدوي',
      invoice_payment: 'دفع فاتورة',
    };
    return types[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    if (type.includes('earned') || type.includes('deposit')) {
      return theme.colors.success;
    }
    if (type.includes('spent') || type.includes('payment') || type.includes('purchase')) {
      return theme.colors.error;
    }
    return theme.colors.primary;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const typeColor = getTransactionTypeColor(item.type);
    const isPositive = item.amount > 0 || item.points_change > 0 || item.cashback_change > 0;

    return (
      <View
        style={[
          styles.transactionCard,
          {
            backgroundColor: theme.colors.surface,
            borderLeftColor: typeColor,
          },
        ]}
      >
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionType, { color: theme.colors.text }]}>
              {getTransactionTypeName(item.type)}
            </Text>
            <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            {item.amount !== 0 && (
              <Text
                style={[
                  styles.amount,
                  {
                    color: isPositive ? theme.colors.success : theme.colors.error,
                  },
                ]}
              >
                {isPositive ? '+' : '-'}
                {formatCurrency(Math.abs(item.amount))}
              </Text>
            )}
            {item.points_change !== 0 && (
              <Text
                style={[
                  styles.pointsChange,
                  {
                    color: item.points_change > 0 ? theme.colors.success : theme.colors.error,
                  },
                ]}
              >
                {item.points_change > 0 ? '+' : ''}
                {item.points_change} نقاط
              </Text>
            )}
            {item.cashback_change !== 0 && (
              <Text
                style={[
                  styles.cashbackChange,
                  {
                    color: item.cashback_change > 0 ? theme.colors.success : theme.colors.error,
                  },
                ]}
              >
                {item.cashback_change > 0 ? '+' : ''}
                {item.cashback_change} كاش باك
              </Text>
            )}
          </View>
        </View>
        {item.description && (
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {item.description}
          </Text>
        )}
      </View>
    );
  };

  const renderSalesReport = () => {
    if (!salesReport) return null;

    return (
      <ScrollView style={styles.reportContainer}>
        <View style={[styles.reportCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.reportTitle, { color: theme.colors.text }]}>تقرير المبيعات</Text>
          <View style={styles.reportItem}>
            <Text style={[styles.reportLabel, { color: theme.colors.textSecondary }]}>
              إجمالي الإيرادات
            </Text>
            <Text style={[styles.reportValue, { color: theme.colors.primary }]}>
              {formatCurrency(salesReport.totalRevenue || 0)}
            </Text>
          </View>
          <View style={styles.reportItem}>
            <Text style={[styles.reportLabel, { color: theme.colors.textSecondary }]}>
              الحجوزات الجديدة (آخر 30 يوم)
            </Text>
            <Text style={[styles.reportValue, { color: theme.colors.text }]}>
              {salesReport.newBookingsLast30Days || 0}
            </Text>
          </View>
          <View style={styles.reportItem}>
            <Text style={[styles.reportLabel, { color: theme.colors.textSecondary }]}>
              تاريخ التقرير
            </Text>
            <Text style={[styles.reportValue, { color: theme.colors.text }]}>
              {new Date(salesReport.reportGeneratedAt || new Date()).toLocaleDateString('ar-EG')}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة المعاملات</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'transactions' ? dynamicStyles.tabActive : null,
          ]}
          onPress={() => setActiveTab('transactions')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'transactions'
                ? dynamicStyles.tabTextActive
                : dynamicStyles.tabTextInactive,
            ]}
          >
            جميع المعاملات
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sales' ? dynamicStyles.tabActive : null]}
          onPress={() => setActiveTab('sales')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'sales'
                ? dynamicStyles.tabTextActive
                : dynamicStyles.tabTextInactive,
            ]}
          >
            تقرير المبيعات
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'payment-history' ? dynamicStyles.tabActive : null,
          ]}
          onPress={() => setActiveTab('payment-history')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'payment-history'
                ? dynamicStyles.tabTextActive
                : dynamicStyles.tabTextInactive,
            ]}
          >
            سجل المدفوعات
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'sales' ? (
        renderSalesReport()
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <SafeIcon name="receipt-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                لا توجد معاملات
              </Text>
            </View>
          }
        />
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
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  transactionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pointsChange: {
    fontSize: 12,
    marginBottom: 2,
  },
  cashbackChange: {
    fontSize: 12,
  },
  description: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  reportContainer: {
    flex: 1,
    padding: 16,
  },
  reportCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  reportLabel: {
    fontSize: 14,
  },
  reportValue: {
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
  });

