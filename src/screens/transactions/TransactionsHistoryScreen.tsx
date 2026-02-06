import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import { transactionService, type Transaction } from './../../services/transactionService';
import { affiliateService } from './../../services/affiliateService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

const normalizeResponse = <T,>(payload: T | { data?: T } | null | undefined): T | null => {
  if (payload === null || payload === undefined) {
    return null;
  }
  if (typeof payload === 'object' && 'data' in payload && (payload as any).data !== undefined) {
    return (payload as any).data as T;
  }
  return payload as T;
};

export const TransactionsHistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referralCode, setReferralCode] = useState<{ code: string; link: string } | null>(null);

  const loadReferralCode = useCallback(async () => {
    try {
      const codeData = await affiliateService.getMyCode();
      setReferralCode(codeData);
    } catch (error) {
      // optional
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const transactionsData = await transactionService.getUserTransactions();
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل المعاملات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    loadReferralCode();
  }, [loadTransactions, loadReferralCode]);

  const handleShareReferral = async () => {
    if (!referralCode) {
      Alert.alert('تنبيه', 'لا يوجد كود إحالة متاح');
      return;
    }

    try {
      await Share.share({
        message: `انضم إلى الطيار VIP واحصل على مكافآت حصرية!\n\nاستخدم كود الإحالة: ${referralCode.code}\nأو الرابط: ${referralCode.link}`,
        title: 'دعوة للانضمام - الطيار VIP',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل مشاركة كود الإحالة',
      });
    }
  };

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

  const getTransactionIcon = (type: string) => {
    if (type.includes('membership')) return 'card-membership';
    if (type.includes('booking')) return 'book';
    if (type.includes('cashback')) return 'cash';
    if (type.includes('points')) return 'star';
    if (type.includes('invoice')) return 'receipt';
    return 'swap-horiz';
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
          <View style={[styles.iconContainer, { backgroundColor: typeColor + '20' }]}>
            <SafeIcon name={getTransactionIcon(item.type)} size={24} color={typeColor} />
          </View>
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
                {Math.abs(item.amount).toFixed(2)}
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>سجل المعاملات</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {transactions.length} معاملة
        </Text>
      </View>

      {/* Referral Button */}
      {referralCode && (
        <TouchableOpacity
          style={[styles.referralButton, { backgroundColor: '#2265c3' }]}
          onPress={handleShareReferral}
        >
          <View style={styles.referralContent}>
            <SafeIcon name="people" size={24} color="#fff" />
            <View style={styles.referralTextContainer}>
              <Text style={styles.referralTitle}>دعوة صديق</Text>
              <Text style={styles.referralSubtitle}>احصل على مكافآت عند دعوة أصدقاء</Text>
            </View>
            <SafeIcon name="share" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

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
              loadTransactions();
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
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  referralButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  referralContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referralTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  referralTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  referralSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
});

