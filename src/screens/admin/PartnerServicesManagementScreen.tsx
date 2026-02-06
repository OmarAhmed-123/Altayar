import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { partnerAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const PartnerServicesManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const [partners, setPartners] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [partnerServices, setPartnerServices] = useState<any[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    duration: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [partnersResponse, dashboardResponse] = await Promise.all([
        partnerAPI.getPartners(),
        partnerAPI.getPartnerDashboard(),
      ]);
      
      const partnersData = partnersResponse.data || partnersResponse || [];
      setPartners(Array.isArray(partnersData) ? partnersData : []);
      setDashboard(dashboardResponse.data || dashboardResponse || {});
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

  const loadPartnerServices = async (partnerId: number) => {
    try {
      const response = await partnerAPI.getPartnerServices(partnerId);
      const servicesData = response.data || response || [];
      setPartnerServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل خدمات الشريك',
      });
    }
  };

  const handleApprovePartner = async (partnerId: number) => {
    try {
      await partnerAPI.approvePartner(partnerId);
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم الموافقة على الشريك بنجاح',
      });
      loadData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل الموافقة على الشريك',
      });
    }
  };

  const handleSuspendPartner = async (partnerId: number) => {
    Alert.alert(
      'تعليق الشريك',
      'هل أنت متأكد من تعليق هذا الشريك?',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تعليق',
          style: 'destructive',
          onPress: async () => {
            try {
              await partnerAPI.suspendPartner(partnerId);
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم تعليق الشريك بنجاح',
              });
              loadData();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || 'فشل تعليق الشريك',
              });
            }
          },
        },
      ]
    );
  };

  const handleSaveService = async () => {
    if (!selectedPartner || !serviceFormData.name || !serviceFormData.price) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      await partnerAPI.createPartnerService(selectedPartner.id, {
        ...serviceFormData,
        price: parseFloat(serviceFormData.price),
        duration: serviceFormData.duration ? parseInt(serviceFormData.duration, 10) : undefined,
      });
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم إنشاء الخدمة بنجاح',
      });
      setShowServiceModal(false);
      resetServiceForm();
      loadPartnerServices(selectedPartner.id);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل حفظ الخدمة',
      });
    }
  };

  const resetServiceForm = () => {
    setServiceFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      duration: '',
      isActive: true,
    });
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة خدمات الشركاء</Text>
      </View>

      {/* Dashboard Stats */}
      {dashboard && (
        <View style={styles.dashboardContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {dashboard.totalPartners || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              إجمالي الشركاء
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {dashboard.activePartners || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              شركاء نشطون
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {dashboard.totalServices || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              إجمالي الخدمات
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
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
      >
        {partners.map((partner) => (
          <View key={partner.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {partner.companyName || partner.name}
                </Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  {partner.contactPerson} • {partner.email}
                </Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  {partner.businessType}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: partner.status === 'approved' 
                      ? theme.colors.success + '20' 
                      : partner.status === 'pending'
                      ? '#FF9800' + '20'
                      : theme.colors.error + '20' 
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { 
                      color: partner.status === 'approved' 
                        ? theme.colors.success 
                        : partner.status === 'pending'
                        ? '#FF9800'
                        : theme.colors.error 
                    },
                  ]}
                >
                  {partner.status === 'approved' ? 'موافق' : partner.status === 'pending' ? 'قيد الانتظار' : 'معلق'}
                </Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryActionButton]}
                onPress={async () => {
                  setSelectedPartner(partner);
                  await loadPartnerServices(partner.id);
                }}
              >
                <SafeIcon name="list" size={18} color="#2196F3" />
                <Text style={[styles.actionText, styles.primaryActionText]}>الخدمات</Text>
              </TouchableOpacity>
              {partner.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.success + '20' }]}
                  onPress={() => handleApprovePartner(partner.id)}
                >
                  <SafeIcon name="checkmark-circle" size={18} color={theme.colors.success} />
                  <Text style={[styles.actionText, { color: theme.colors.success }]}>موافقة</Text>
                </TouchableOpacity>
              )}
              {partner.status === 'approved' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.warningActionButton]}
                  onPress={() => handleSuspendPartner(partner.id)}
                >
                  <SafeIcon name="pause-circle" size={18} color="#FF9800" />
                  <Text style={[styles.actionText, styles.warningActionText]}>تعليق</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Services Modal */}
      {selectedPartner && showServiceModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                خدمات {selectedPartner.companyName || selectedPartner.name}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowServiceModal(false);
                  setSelectedPartner(null);
                  resetServiceForm();
                }}
              >
                <SafeIcon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  resetServiceForm();
                  setShowServiceModal(true);
                }}
              >
                <SafeIcon name="add" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>إضافة خدمة</Text>
              </TouchableOpacity>

              {partnerServices.map((service) => (
                <View key={service.id} style={[styles.serviceItem, { borderBottomColor: theme.colors.border }]}>
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceName, { color: theme.colors.text }]}>{service.name}</Text>
                    <Text style={[styles.servicePrice, { color: theme.colors.primary }]}>
                      {service.price} {service.currency || 'EGP'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.serviceStatus,
                      { backgroundColor: service.isActive ? theme.colors.success + '20' : theme.colors.error + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.serviceStatusText,
                        { color: service.isActive ? theme.colors.success : theme.colors.error },
                      ]}
                    >
                      {service.isActive ? 'نشط' : 'غير نشط'}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Service Form */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>اسم الخدمة *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={serviceFormData.name}
                  onChangeText={(text) => setServiceFormData({ ...serviceFormData, name: text })}
                  placeholder="اسم الخدمة"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>السعر *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={serviceFormData.price}
                  onChangeText={(text) => setServiceFormData({ ...serviceFormData, price: text })}
                  placeholder="100"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveService}
              >
                <Text style={styles.submitButtonText}>إنشاء</Text>
              </TouchableOpacity>
            </ScrollView>
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
  },
  dashboardContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 2,
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
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  serviceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceStatusText: {
    fontSize: 12,
    fontWeight: '600',
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
  warningActionButton: {
    backgroundColor: '#FF980020',
  },
  warningActionText: {
    color: '#FF9800',
  },
});

