import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { userService } from './../../services/userService';
import { useAuthStore } from './../../stores/authStore';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';
import type { User as ApiUser } from './../../services/apiClient';

type User = ApiUser & {
  role?: string;
  created_at?: string;
};

const ROLE_OPTIONS = ['customer', 'admin', 'super_admin', 'sales', 'accountant', 'hr', 'reservations', 'data_entry', 'support', 'agent'];

export const UsersManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(theme), [theme]);
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentRole = currentUser?.role || 'customer';
  const isSuperAdmin = Boolean(currentUser?.isSuperAdmin);
  const canGiveGift = isSuperAdmin || ['super_admin', 'admin', 'sales', 'agent'].includes(currentRole);
  const canChangeRoles = isSuperAdmin || ['admin', 'hr'].includes(currentRole);
  const canDeleteUsers = isSuperAdmin;

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      const usersData = response.data || response || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل المستخدمين',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const assignableRoles = useMemo(() => {
    if (isSuperAdmin) {
      return ROLE_OPTIONS;
    }
    if (currentRole === 'admin') {
      return ROLE_OPTIONS.filter(role => role !== 'super_admin');
    }
    if (currentRole === 'hr') {
      return ['hr', 'data_entry', 'reservations', 'support', 'customer'];
    }
    return [];
  }, [ROLE_OPTIONS, currentRole, isSuperAdmin]);

  const visibleUsers = useMemo(() => {
    let data = users;

    if (!isSuperAdmin) {
      data = data.filter(item => item.role !== 'super_admin');
    }

    switch (currentRole) {
      case 'sales':
      case 'agent':
        return data.filter(item => item.role === 'customer');
      case 'hr':
        return data.filter(item => ['hr', 'data_entry', 'reservations', 'support', 'customer'].includes(item.role || 'customer'));
      case 'accountant':
        return data.filter(item => ['accountant', 'sales', 'admin', 'customer'].includes(item.role || 'customer'));
      case 'data_entry':
        return data.filter(item => ['customer', 'data_entry', 'reservations'].includes(item.role || 'customer'));
      case 'reservations':
        return data.filter(item => ['customer', 'reservations'].includes(item.role || 'customer'));
      default:
        return data;
    }
  }, [users, currentRole, isSuperAdmin]);

  const handleUpdateRole = async (userId: number, newRole: string) => {
    if (!canChangeRoles || (assignableRoles.length && !assignableRoles.includes(newRole))) {
      Toast.show({
        type: 'error',
        text1: 'غير مسموح',
        text2: 'ليس لديك صلاحية لتغيير الأدوار',
      });
      return;
    }

    Alert.alert(
      'تحديث الدور',
      `هل تريد تغيير دور المستخدم إلى ${newRole}?`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            try {
              await userService.updateUserRole(userId, { role: newRole });
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم تحديث دور المستخدم بنجاح',
              });
              loadUsers();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || 'فشل تحديث دور المستخدم',
              });
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    Alert.alert(
      'حذف المستخدم',
      `هل أنت متأكد من حذف المستخدم ${userName}?`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteUser(userId);
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم حذف المستخدم بنجاح',
              });
              loadUsers();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || 'فشل حذف المستخدم',
              });
            }
          },
        },
      ]
    );
  };

  const handleAddGift = (userId: number, userName: string) => {
    if (!canGiveGift) {
      Toast.show({
        type: 'error',
        text1: 'غير مسموح',
        text2: 'لا تملك صلاحية إضافة الهدايا اليدوية',
      });
      return;
    }

    Alert.prompt(
      'إضافة هدية',
      `أدخل النقاط أو الكاش باك أو نوع الكوبون للمستخدم ${userName}`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إضافة',
          onPress: async (value?: string) => {
            if (!value) return;
            try {
              // Parse the input (format: points:100 or cashback:50 or voucher:dinner)
              const parts = value.split(':');
              if (parts.length !== 2) {
                Toast.show({
                  type: 'error',
                  text1: 'خطأ',
                  text2: 'الصيغة الصحيحة: points:100 أو cashback:50 أو voucher:dinner',
                });
                return;
              }

              const [type, amount] = parts;
              const giftData: any = {};

              if (type === 'points') {
                giftData.points = parseInt(amount, 10);
              } else if (type === 'cashback') {
                giftData.cashback = parseFloat(amount);
              } else if (type === 'voucher') {
                giftData.voucherType = amount;
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'خطأ',
                  text2: 'النوع غير صحيح. استخدم: points, cashback, أو voucher',
                });
                return;
              }

              await userService.addManualGift(userId, giftData);
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم إضافة الهدية بنجاح',
              });
              loadUsers();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || 'فشل إضافة الهدية',
              });
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '#E91E63';
      case 'admin':
        return '#FF6B00';
      case 'sales':
        return '#4CAF50';
      case 'agent':
        return '#00838F';
      case 'accountant':
        return '#2196F3';
      case 'hr':
        return '#9C27B0';
      case 'reservations':
        return '#00BCD4';
      case 'data_entry':
        return '#795548';
      case 'support':
        return '#607D8B';
      case 'customer':
        return '#2196F3';
      default:
        return theme.colors.primary;
    }
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      super_admin: 'سوبر أدمن',
      admin: 'أدمن',
      sales: 'مبيعات',
      agent: 'وكيل',
      accountant: 'محاسب',
      hr: 'موارد بشرية',
      reservations: 'موظف حجوزات',
      data_entry: 'إدخال بيانات',
      support: 'دعم فني',
      customer: 'عميل',
    };
    return roles[role] || role;
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const userRole = item.role || 'customer';
    return (
    <View style={[styles.userCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: getRoleColor(userRole) + '20' },
            ]}
          >
            <Text
              style={[styles.roleText, { color: getRoleColor(userRole) }]}
            >
              {getRoleName(userRole)}
            </Text>
          </View>
        </View>
        <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
          {item.email}
        </Text>
        {(item.points !== undefined || item.cashback !== undefined) && (
          <View style={styles.userStats}>
            {item.points !== undefined && (
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                النقاط: {item.points}
              </Text>
            )}
            {item.cashback !== undefined && (
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                الكاش باك: {item.cashback}
              </Text>
            )}
          </View>
        )}
      </View>
      <View style={styles.actions}>
        {canGiveGift && userRole !== 'super_admin' && (
          <TouchableOpacity
            style={[styles.actionButton, dynamicStyles.primaryActionButton]}
            onPress={() => handleAddGift(item.id, item.name)}
          >
            <SafeIcon name="card-giftcard" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        {canChangeRoles && assignableRoles.length > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, dynamicStyles.secondaryActionButton]}
            onPress={() => {
              Alert.alert(
                'تغيير الدور',
                'اختر الدور الجديد',
                [
                  { text: 'إلغاء', style: 'cancel' },
                  ...assignableRoles.map(roleOption => ({
                    text: getRoleName(roleOption),
                    onPress: () => handleUpdateRole(item.id, roleOption),
                  })),
                ]
              );
            }}
          >
            <SafeIcon name="edit" size={20} color="#2196F3" />
          </TouchableOpacity>
        )}
        {canDeleteUsers && userRole !== 'super_admin' && (
          <TouchableOpacity
            style={[styles.actionButton, dynamicStyles.errorActionButton]}
            onPress={() => handleDeleteUser(item.id, item.name)}
          >
            <SafeIcon name="delete" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        )}
      </View>
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          إدارة المستخدمين
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {visibleUsers.length} مستخدم
        </Text>
      </View>

      <FlatList
        data={visibleUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadUsers();
            }}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="people-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا يوجد مستخدمين
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
  userCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    primaryActionButton: {
      backgroundColor: `${theme.colors.primary}20`,
    },
    secondaryActionButton: {
      backgroundColor: '#2196F320',
    },
    errorActionButton: {
      backgroundColor: `${theme.colors.error}20`,
    },
  });

