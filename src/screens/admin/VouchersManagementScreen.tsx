import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { voucherService, type Voucher } from './../../services/voucherService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const VouchersManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    type: 'manual_gift',
    value: '',
    description: '',
    expiresAt: '',
  });

  const typeButtonDynamicStyles = useMemo(
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
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const response = await voucherService.getAllVouchers();
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

  const handleCreateVoucher = async () => {
    if (!formData.userId || !formData.type) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      await voucherService.createManualVoucher({
        userId: parseInt(formData.userId, 10),
        type: formData.type,
        value: formData.value ? parseFloat(formData.value) : undefined,
        description: formData.description || undefined,
        expiresAt: formData.expiresAt || undefined,
      });
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم إنشاء الكوبون بنجاح',
      });
      setShowCreateModal(false);
      resetForm();
      loadVouchers();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل إنشاء الكوبون',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      type: 'manual_gift',
      value: '',
      description: '',
      expiresAt: '',
    });
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

  const renderVoucherItem = ({ item }: { item: Voucher }) => (
    <View style={[styles.voucherCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.voucherHeader}>
        <View style={styles.voucherInfo}>
          <Text style={[styles.voucherCode, { color: theme.colors.text }]}>{item.code}</Text>
          <Text style={[styles.voucherType, { color: theme.colors.textSecondary }]}>
            {getVoucherTypeName(item.type)}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.is_used ? theme.colors.error + '20' : theme.colors.success + '20' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: item.is_used ? theme.colors.error : theme.colors.success },
            ]}
          >
            {item.is_used ? 'مستخدم' : 'متاح'}
          </Text>
        </View>
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

      <Text style={[styles.userId, { color: theme.colors.textSecondary }]}>
        المستخدم: {item.user_id}
      </Text>
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة الكوبونات</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {vouchers.length} كوبون
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowCreateModal(true)}
      >
        <SafeIcon name="add" size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>كوبون جديد</Text>
      </TouchableOpacity>

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
              لا توجد كوبونات
            </Text>
          </View>
        }
      />

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>كوبون جديد</Text>
              <TouchableOpacity onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}>
                <SafeIcon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>معرف المستخدم *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.userId}
                  onChangeText={(text) => setFormData({ ...formData, userId: text })}
                  placeholder="معرف المستخدم"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>النوع *</Text>
                <View style={styles.typeButtons}>
                  {['dinner', 'breakfast', 'spa', 'gym', 'manual_gift'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        formData.type === type && typeButtonDynamicStyles.selectedButton,
                      ]}
                      onPress={() => setFormData({ ...formData, type })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          formData.type === type
                            ? typeButtonDynamicStyles.selectedText
                            : typeButtonDynamicStyles.unselectedText,
                        ]}
                      >
                        {getVoucherTypeName(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>القيمة</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.value}
                  onChangeText={(text) => setFormData({ ...formData, value: text })}
                  placeholder="القيمة (اختياري)"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>الوصف</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: theme.colors.background, color: theme.colors.text },
                  ]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="وصف الكوبون (اختياري)"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleCreateVoucher}
              >
                <Text style={styles.submitButtonText}>إنشاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  voucherCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  voucherInfo: {
    flex: 1,
  },
  voucherCode: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  voucherType: {
    fontSize: 14,
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
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
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
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

