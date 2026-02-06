import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import { quotationService, type Quotation } from './../../services/quotationService';
import { API } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './../../constants/theme';

export const SalesQuotationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    customerId: '',
    packageId: '',
    notes: '',
    discount: '',
    validUntil: '',
    items: [] as Array<{ name: string; quantity: number; price: number }>,
  });

  useEffect(() => {
    loadQuotations();
    loadCustomers();
    loadPackages();
  }, [filterStatus]);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const response = await quotationService.getQuotations(params);
      const data = response.data || response || [];
      setQuotations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل العروض',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await API.user.getUsers({ role: 'customer' });
      const data = response.data || response || [];
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadPackages = async () => {
    try {
      const response = await API.package.getPackages();
      const data = response.data || response || [];
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  const handleCreateQuotation = async () => {
    if (!formData.customerId) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى اختيار العميل',
      });
      return;
    }

    try {
      const quotationData: any = {
        customerId: parseInt(formData.customerId),
        notes: formData.notes,
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        items: formData.items.length > 0 ? formData.items : undefined,
      };

      if (formData.packageId) {
        quotationData.packageId = parseInt(formData.packageId);
      }

      if (formData.validUntil) {
        quotationData.validUntil = formData.validUntil;
      }

      await quotationService.createQuotation(quotationData);
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم إنشاء العرض بنجاح',
      });
      setShowCreateModal(false);
      resetForm();
      loadQuotations();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل إنشاء العرض',
      });
    }
  };

  const handleSendQuotation = async (quotation: Quotation) => {
    Alert.alert(
      'إرسال العرض',
      'هل تريد إرسال هذا العرض للعميل؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إرسال',
          onPress: async () => {
            try {
              await quotationService.sendQuotation(quotation.id, {
                sendEmail: true,
                sendNotification: true,
              });
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم إرسال العرض للعميل',
              });
              loadQuotations();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || 'فشل إرسال العرض',
              });
            }
          },
        },
      ]
    );
  };

  const handleDownloadPDF = async (quotation: Quotation) => {
    try {
      // Get the authentication token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'خطأ',
          text2: 'يجب تسجيل الدخول أولاً',
        });
        return;
      }

      // Construct PDF download URL with token
      const downloadUrl = `${API_BASE_URL}/quotations/${quotation.id}/pdf?token=${encodeURIComponent(token)}`;

      // Check if URL can be opened
      const canOpen = await Linking.canOpenURL(downloadUrl);
      if (canOpen) {
        await Linking.openURL(downloadUrl);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'جارٍ تحميل PDF...',
        });
      } else {
        // Fallback: Show URL for manual copy
        Alert.alert(
          'تحميل PDF',
          `يرجى نسخ الرابط التالي وفتحه في المتصفح:\n\n${downloadUrl}`,
          [
            { text: 'إلغاء', style: 'cancel' },
            {
              text: 'نسخ الرابط',
              onPress: () => {
                // You can add clipboard functionality here if needed
                Toast.show({
                  type: 'info',
                  text1: 'تنبيه',
                  text2: 'يرجى نسخ الرابط وفتحه في المتصفح',
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل PDF',
      });
    }
  };

  const handleDeleteQuotation = async (quotation: Quotation) => {
    Alert.alert(
      'حذف العرض',
      'هل أنت متأكد من حذف هذا العرض؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await quotationService.deleteQuotation(quotation.id);
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم حذف العرض بنجاح',
              });
              loadQuotations();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || 'فشل حذف العرض',
              });
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      packageId: '',
      notes: '',
      discount: '',
      validUntil: '',
      items: [],
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#666666';
      case 'sent':
        return '#2265c3';
      case 'viewed':
        return '#19b6e8';
      case 'accepted':
        return '#00C853';
      case 'rejected':
        return '#E60012';
      case 'expired':
        return '#FF9800';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusName = (status: string) => {
    const names: Record<string, string> = {
      draft: 'مسودة',
      sent: 'مرسل',
      viewed: 'تم المشاهدة',
      accepted: 'مقبول',
      rejected: 'مرفوض',
      expired: 'منتهي',
    };
    return names[status] || status;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && quotations.length === 0) {
    return <LoadingSpinner text="جاري التحميل..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>عروض الأسعار</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: '#2265c3' }]}
          onPress={() => setShowCreateModal(true)}
        >
          <SafeIcon name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>عرض جديد</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'draft', 'sent', 'viewed', 'accepted', 'rejected'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              filterStatus === status && { backgroundColor: '#2265c3' },
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === status && { color: '#fff' },
                { color: filterStatus === status ? '#fff' : theme.colors.text },
              ]}
            >
              {status === 'all' ? 'الكل' : getStatusName(status)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadQuotations} />
        }
      >
        {quotations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <SafeIcon name="document-text-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد عروض
            </Text>
          </View>
        ) : (
          quotations.map((quotation) => (
            <View
              key={quotation.id}
              style={[styles.quotationCard, { backgroundColor: theme.colors.surface }]}
            >
              <View style={styles.quotationHeader}>
                <View>
                  <Text style={[styles.quotationNumber, { color: theme.colors.text }]}>
                    عرض #{quotation.id}
                  </Text>
                  <Text style={[styles.customerName, { color: theme.colors.textSecondary }]}>
                    {quotation.customer?.name || quotation.customer?.email || 'عميل'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(quotation.status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(quotation.status) },
                    ]}
                  >
                    {getStatusName(quotation.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.quotationDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    المبلغ:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {quotation.total_amount.toFixed(2)} EGP
                  </Text>
                </View>
                {quotation.discount > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                      الخصم:
                    </Text>
                    <Text style={[styles.detailValue, { color: '#00C853' }]}>
                      {quotation.discount}%
                    </Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    صالح حتى:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {formatDate(quotation.valid_until)}
                  </Text>
                </View>
              </View>

              <View style={styles.quotationActions}>
                {quotation.status === 'draft' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#2265c3' }]}
                    onPress={() => handleSendQuotation(quotation)}
                  >
                    <SafeIcon name="send" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>إرسال</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#19b6e8' }]}
                  onPress={() => handleDownloadPDF(quotation)}
                >
                  <SafeIcon name="download" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#E60012' }]}
                  onPress={() => handleDeleteQuotation(quotation)}
                >
                  <SafeIcon name="trash" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Quotation Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                إنشاء عرض جديد
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <SafeIcon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>العميل *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {customers.map((customer) => (
                    <TouchableOpacity
                      key={customer.id}
                      style={[
                        styles.customerOption,
                        formData.customerId === customer.id.toString() && {
                          backgroundColor: '#2265c3',
                        },
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, customerId: customer.id.toString() })
                      }
                    >
                      <Text
                        style={[
                          styles.customerOptionText,
                          formData.customerId === customer.id.toString() && { color: '#fff' },
                          { color: formData.customerId === customer.id.toString() ? '#fff' : theme.colors.text },
                        ]}
                      >
                        {customer.name || customer.email}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>الباقة (اختياري)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.packageOption,
                      !formData.packageId && { backgroundColor: '#2265c3' },
                    ]}
                    onPress={() => setFormData({ ...formData, packageId: '' })}
                  >
                    <Text
                      style={[
                        styles.packageOptionText,
                        !formData.packageId && { color: '#fff' },
                        { color: !formData.packageId ? '#fff' : theme.colors.text },
                      ]}
                    >
                      بدون باقة
                    </Text>
                  </TouchableOpacity>
                  {packages.map((pkg) => (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[
                        styles.packageOption,
                        formData.packageId === pkg.id.toString() && {
                          backgroundColor: '#2265c3',
                        },
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, packageId: pkg.id.toString() })
                      }
                    >
                      <Text
                        style={[
                          styles.packageOptionText,
                          formData.packageId === pkg.id.toString() && { color: '#fff' },
                          { color: formData.packageId === pkg.id.toString() ? '#fff' : theme.colors.text },
                        ]}
                      >
                        {pkg.title || pkg.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>الخصم (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.discount}
                  onChangeText={(text) => setFormData({ ...formData, discount: text })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>ملاحظات</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    { backgroundColor: theme.colors.background, color: theme.colors.text },
                  ]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  multiline
                  numberOfLines={4}
                  placeholder="أضف ملاحظات..."
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#2265c3' }]}
                onPress={handleCreateQuotation}
              >
                <Text style={styles.submitButtonText}>إنشاء العرض</Text>
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
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  quotationCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quotationNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quotationDetails: {
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  quotationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  customerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  customerOptionText: {
    fontSize: 14,
  },
  packageOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  packageOptionText: {
    fontSize: 14,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
