import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { voucherService, type Voucher } from './../../services/voucherService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const VouchersScreen: React.FC = () => {
  const { theme } = useTheme();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const response = await voucherService.getMyVouchers();
      const vouchersData = response.data || response || [];
      setVouchers(Array.isArray(vouchersData) ? vouchersData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل الكوبونات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUseVoucher = async (voucher: Voucher) => {
    if (voucher.is_used) {
      Toast.show({
        type: 'info',
        text1: 'مستخدم',
        text2: 'هذا الكوبون مستخدم بالفعل',
      });
      return;
    }

    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      Toast.show({
        type: 'error',
        text1: 'منتهي',
        text2: 'هذا الكوبون منتهي الصلاحية',
      });
      return;
    }

    Alert.alert(
      'استخدام الكوبون',
      `هل تريد استخدام الكوبون ${voucher.code}?`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'استخدام',
          onPress: async () => {
            try {
              await voucherService.useVoucher(voucher.code);
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم استخدام الكوبون بنجاح',
              });
              loadVouchers();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || 'فشل استخدام الكوبون',
              });
            }
          },
        },
      ]
    );
  };

  const getVoucherTypeName = (type: string) => {
    const types: Record<string, string> = {
      dinner: 'عشاء',
      breakfast: 'إفطار',
      spa: 'سبا',
      gym: 'جيم',
      dental_cleaning: 'تنظيف أسنان',
      makeup: 'مكياج',
      manual_gift: 'هدية يدوية',
    };
    return types[type] || type;
  };

  const getVoucherTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      dinner: '#FF6B6B',
      breakfast: '#4ECDC4',
      spa: '#95E1D3',
      gym: '#F38181',
      dental_cleaning: '#AA96DA',
      makeup: '#FCBAD3',
      manual_gift: '#FFD93D',
    };
    return colors[type] || theme.colors.primary;
  };

  const renderVoucherItem = ({ item }: { item: Voucher }) => {
    const isExpired = item.expires_at && new Date(item.expires_at) < new Date();
    const typeColor = getVoucherTypeColor(item.type);

    return (
      <View
        style={[
          styles.voucherCard,
          {
            backgroundColor: theme.colors.surface,
            borderLeftColor: typeColor,
            opacity: item.is_used || isExpired ? 0.6 : 1,
          },
        ]}
      >
        <View style={styles.voucherHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>
              {getVoucherTypeName(item.type)}
            </Text>
          </View>
          {item.is_used && (
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.error + '20' }]}>
              <Text style={[styles.statusText, { color: theme.colors.error }]}>مستخدم</Text>
            </View>
          )}
          {isExpired && !item.is_used && (
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.textSecondary + '20' }]}>
              <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>منتهي</Text>
            </View>
          )}
        </View>

        <View style={styles.voucherCode}>
          <Text style={[styles.codeLabel, { color: theme.colors.textSecondary }]}>رمز الكوبون</Text>
          <Text style={[styles.codeValue, { color: theme.colors.text }]}>{item.code}</Text>
        </View>

        {item.value && (
          <Text style={[styles.voucherValue, { color: theme.colors.primary }]}>
            القيمة: {item.value}
          </Text>
        )}

        {item.description && (
          <Text style={[styles.voucherDescription, { color: theme.colors.textSecondary }]}>
            {item.description}
          </Text>
        )}

        {item.expires_at && (
          <Text style={[styles.expiryDate, { color: theme.colors.textSecondary }]}>
            ينتهي في: {new Date(item.expires_at).toLocaleDateString('ar-EG')}
          </Text>
        )}

        {!item.is_used && !isExpired && (
          <TouchableOpacity
            style={[styles.useButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleUseVoucher(item)}
          >
            <SafeIcon name="check-circle" size={20} color="#FFFFFF" />
            <Text style={styles.useButtonText}>استخدام الكوبون</Text>
          </TouchableOpacity>
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

  const unusedVouchers = vouchers.filter((v) => !v.is_used);
  const usedVouchers = vouchers.filter((v) => v.is_used);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>كوبوناتي</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {unusedVouchers.length} متاح | {usedVouchers.length} مستخدم
        </Text>
      </View>

      <FlatList
        data={vouchers}
        renderItem={renderVoucherItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadVouchers();
            }}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="card-giftcard" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد كوبونات متاحة
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
  voucherCard: {
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
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
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
  voucherCode: {
    marginBottom: 8,
  },
  codeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  voucherValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  voucherDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  expiryDate: {
    fontSize: 12,
    marginBottom: 12,
  },
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  useButtonText: {
    color: '#FFFFFF',
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

