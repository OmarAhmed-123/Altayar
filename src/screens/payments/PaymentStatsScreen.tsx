import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { transactionService } from './../../services/transactionService';
// Mock data removed - using real backend data only
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { ExpressiveEmptyState } from './../../components/common/ExpressiveEmptyState';
import { SafeIcon } from './../../utils/iconHelper';
import { API } from './../../services/apiClient';

export const PaymentStatsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalRemaining: 0,
    transactions: [] as any[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Use real backend API
      const transactions = await transactionService.getUserTransactions();

      // Calculate stats
      const paid = transactions.filter((t: any) => 
        (t.status === 'completed' || t.status === 'paid') && t.amount > 0
      );
      const pending = transactions.filter((t: any) => 
        (t.status === 'pending' || t.status === 'processing') && t.amount < 0
      );

      const totalPaid = paid.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      const totalPending = Math.abs(pending.reduce((sum: number, t: any) => sum + (t.amount || 0), 0));
      const totalRemaining = totalPending;

      setStats({
        totalPaid,
        totalPending,
        totalRemaining,
        transactions: transactions.slice(0, 10), // Last 10 transactions
      });
    } catch (error) {
      console.error('Error loading payment stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.lg,
    },
    header: {
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.xl,
    },
    statCard: {
      width: '48%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      marginRight: '2%',
    },
    statCardFull: {
      width: '100%',
      marginRight: 0,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    statValuePaid: {
      color: theme.colors.success,
    },
    statValuePending: {
      color: theme.colors.warning,
    },
    statValueRemaining: {
      color: theme.colors.error,
    },
    transactionsContainer: {
      marginTop: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    transactionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    transactionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    transactionDetails: {
      flex: 1,
    },
    transactionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    transactionDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    transactionAmount: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    transactionAmountPaid: {
      color: theme.colors.success,
    },
    transactionAmountPending: {
      color: theme.colors.warning,
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل الإحصائيات..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>إحصائيات الدفع</Text>
          <Text style={styles.subtitle}>عرض جميع المدفوعات والمتبقي</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>إجمالي المدفوع</Text>
            <Text style={[styles.statValue, styles.statValuePaid]}>
              {stats.totalPaid.toLocaleString()} USD
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>المتبقي</Text>
            <Text style={[styles.statValue, styles.statValueRemaining]}>
              {stats.totalRemaining.toLocaleString()} USD
            </Text>
          </View>

          <View style={[styles.statCard, styles.statCardFull]}>
            <Text style={styles.statLabel}>المعلق</Text>
            <Text style={[styles.statValue, styles.statValuePending]}>
              {stats.totalPending.toLocaleString()} USD
            </Text>
          </View>
        </View>

        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>آخر المعاملات</Text>
          
          {stats.transactions.length === 0 ? (
            <ExpressiveEmptyState
              title="لا توجد معاملات"
              message="لم يتم العثور على أي معاملات دفع"
              imageCategory="payment"
            />
          ) : (
            stats.transactions.map((transaction: any, index: number) => {
              const isPaid = transaction.status === 'completed' || transaction.status === 'paid';
              const isPending = transaction.status === 'pending' || transaction.status === 'processing';
              
              return (
                <View key={transaction.id || index} style={styles.transactionCard}>
                  <View style={styles.transactionIcon}>
                    <SafeIcon
                      name={isPaid ? 'check-circle' : isPending ? 'schedule' : 'error'}
                      size={24}
                      color={isPaid ? theme.colors.success : isPending ? theme.colors.warning : theme.colors.error}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>
                      {transaction.type === 'invoice_payment' ? 'دفع فاتورة' : 'معاملة'}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {transaction.created_at ? formatDate(transaction.created_at) : 'تاريخ غير متوفر'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      isPaid ? styles.transactionAmountPaid : styles.transactionAmountPending,
                    ]}
                  >
                    {isPaid ? '+' : '-'}
                    {Math.abs(transaction.amount || 0).toLocaleString()} USD
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

