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
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { membershipService } from './../../services/membershipService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';
import type { Membership as ApiMembership } from './../../services/apiClient';

type Membership = ApiMembership & {
  level?: number;
  pointsMultiplier?: number;
  cashbackRate?: number;
};

export const MembershipsManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    level: '1',
    pointsMultiplier: '1',
    cashbackRate: '0',
    isActive: true,
  });

  useEffect(() => {
    loadMemberships();
  }, []);

  const loadMemberships = async () => {
    try {
      setLoading(true);
      const response = await membershipService.getMemberships();
      const membershipsData = response.data || response || [];
      setMemberships(Array.isArray(membershipsData) ? membershipsData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل العضويات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateMembership = async () => {
    if (!formData.name || !formData.description || !formData.price) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      const membershipData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        level: parseInt(formData.level, 10),
        pointsMultiplier: parseFloat(formData.pointsMultiplier),
        cashbackRate: parseFloat(formData.cashbackRate),
        isActive: formData.isActive,
      };

      if (editingMembership) {
        await membershipService.updateMembership(editingMembership.id.toString(), membershipData);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم تحديث العضوية بنجاح',
        });
      } else {
        await membershipService.createMembership(membershipData);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم إنشاء العضوية بنجاح',
        });
      }
      setShowCreateModal(false);
      setEditingMembership(null);
      resetForm();
      loadMemberships();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل حفظ العضوية',
      });
    }
  };

  const handleDeleteMembership = async (membershipId: number, membershipName: string) => {
    Alert.alert(
      'حذف العضوية',
      `هل أنت متأكد من حذف العضوية "${membershipName}"?`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await membershipService.deleteMembership(membershipId.toString());
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم حذف العضوية بنجاح',
              });
              loadMemberships();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || 'فشل حذف العضوية',
              });
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      level: '1',
      pointsMultiplier: '1',
      cashbackRate: '0',
      isActive: true,
    });
  };

  const openEditModal = (membership: Membership) => {
    setEditingMembership(membership);
    setFormData({
      name: membership.name || '',
      description: membership.description || '',
      price: (membership.price || 0).toString(),
      level: (membership.level || 1).toString(),
      pointsMultiplier: (membership.pointsMultiplier || 1).toString(),
      cashbackRate: (membership.cashbackRate || 0).toString(),
      isActive: membership.isActive !== false,
    });
    setShowCreateModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const getLevelName = (level: number) => {
    const names: Record<number, string> = {
      1: 'برونزي',
      2: 'فضي',
      3: 'ذهبي',
    };
    return names[level] || `مستوى ${level}`;
  };

  const renderMembershipItem = ({ item }: { item: Membership }) => (
    <View style={[styles.membershipCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.membershipHeader}>
        <View style={styles.membershipInfo}>
          <Text style={[styles.membershipName, { color: theme.colors.text }]}>{item.name}</Text>
          <Text style={[styles.membershipLevel, { color: theme.colors.primary }]}>
            {getLevelName(item.level ?? 1)}
          </Text>
          <Text style={[styles.membershipDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.isActive ? theme.colors.success + '20' : theme.colors.error + '20' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: item.isActive ? theme.colors.success : theme.colors.error },
            ]}
          >
            {item.isActive ? 'نشط' : 'غير نشط'}
          </Text>
        </View>
      </View>

      <View style={styles.membershipDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>السعر:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>
            {formatCurrency(item.price)}
          </Text>
        </View>
        {item.pointsMultiplier && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>مضاعف النقاط:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {item.pointsMultiplier}x
            </Text>
          </View>
        )}
        {item.cashbackRate !== undefined && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>معدل الكاش باك:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {item.cashbackRate}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.primaryActionButton]} onPress={() => openEditModal(item)}>
          <SafeIcon name="edit" size={20} color="#2196F3" />
          <Text style={[styles.actionText, styles.primaryActionText]}>تعديل</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error + '20' }]}
          onPress={() => handleDeleteMembership(item.id, item.name)}
        >
          <SafeIcon name="delete" size={20} color={theme.colors.error} />
          <Text style={[styles.actionText, { color: theme.colors.error }]}>حذف</Text>
        </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة العضويات</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {memberships.length} عضوية
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          resetForm();
          setEditingMembership(null);
          setShowCreateModal(true);
        }}
      >
        <SafeIcon name="add" size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>عضوية جديدة</Text>
      </TouchableOpacity>

      <FlatList
        data={memberships}
        renderItem={renderMembershipItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadMemberships();
            }}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="card-membership" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد عضويات
            </Text>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowCreateModal(false);
          setEditingMembership(null);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingMembership ? 'تعديل العضوية' : 'عضوية جديدة'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setEditingMembership(null);
                  resetForm();
                }}
              >
                <SafeIcon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>الاسم *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="اسم العضوية"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>الوصف *</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: theme.colors.background, color: theme.colors.text },
                  ]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="وصف العضوية"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>السعر *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="السعر"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>المستوى</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.level}
                  onChangeText={(text) => setFormData({ ...formData, level: text })}
                  placeholder="المستوى (1-3)"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>مضاعف النقاط</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.pointsMultiplier}
                  onChangeText={(text) => setFormData({ ...formData, pointsMultiplier: text })}
                  placeholder="مضاعف النقاط"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>معدل الكاش باك (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.cashbackRate}
                  onChangeText={(text) => setFormData({ ...formData, cashbackRate: text })}
                  placeholder="معدل الكاش باك"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleCreateMembership}
              >
                <Text style={styles.submitButtonText}>{editingMembership ? 'تحديث' : 'إنشاء'}</Text>
              </TouchableOpacity>
            </ScrollView>
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
  membershipCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  membershipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  membershipInfo: {
    flex: 1,
  },
  membershipName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  membershipLevel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  membershipDescription: {
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
  membershipDetails: {
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
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
    maxHeight: 500,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 16,
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
    height: 100,
    textAlignVertical: 'top',
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
  primaryActionButton: {
    backgroundColor: '#2196F320',
  },
  primaryActionText: {
    color: '#2196F3',
  },
});

