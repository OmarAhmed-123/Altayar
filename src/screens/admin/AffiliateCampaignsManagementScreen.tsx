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
  Switch,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { affiliateAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const AffiliateCampaignsManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    commissionType: 'percentage',
    commissionValue: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignsResponse, dashboardResponse] = await Promise.all([
        affiliateAPI.getAllAffiliateCampaigns(),
        affiliateAPI.getAffiliateDashboard(),
      ]);
      
      const campaignsData = campaignsResponse.data || campaignsResponse || [];
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
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

  const handleSaveCampaign = async () => {
    if (!formData.name || !formData.commissionType || !formData.commissionValue) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      await affiliateAPI.createAffiliateCampaign({
        ...formData,
        commissionValue: parseFloat(formData.commissionValue),
      });
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: editingCampaign ? 'تم تحديث الحملة بنجاح' : 'تم إنشاء الحملة بنجاح',
      });
      setShowModal(false);
      setEditingCampaign(null);
      resetForm();
      loadData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل حفظ الحملة',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      commissionType: 'percentage',
      commissionValue: '',
      startDate: '',
      endDate: '',
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة حملات الإحالة</Text>
      </View>

      {/* Dashboard Stats */}
      {dashboard && (
        <View style={styles.dashboardContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {dashboard.totalCampaigns || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              إجمالي الحملات
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {dashboard.totalAffiliates || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              إجمالي المسوقين
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {dashboard.totalEarnings || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              إجمالي الأرباح
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          resetForm();
          setEditingCampaign(null);
          setShowModal(true);
        }}
      >
        <SafeIcon name="add" size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>حملة جديدة</Text>
      </TouchableOpacity>

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
        {campaigns.map((campaign) => (
          <View key={campaign.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{campaign.name}</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  {campaign.commissionType === 'percentage' 
                    ? `${campaign.commissionValue}%` 
                    : `${campaign.commissionValue} ${campaign.currency || 'EGP'}`}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: campaign.isActive ? theme.colors.success + '20' : theme.colors.error + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: campaign.isActive ? theme.colors.success : theme.colors.error },
                  ]}
                >
                  {campaign.isActive ? 'نشط' : 'غير نشط'}
                </Text>
              </View>
            </View>

            {campaign.description && (
              <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
                {campaign.description}
              </Text>
            )}

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryActionButton]}
                onPress={async () => {
                  try {
                    const details = await affiliateAPI.getAffiliateCampaignDetails(campaign.id);
                    const campaignData = details.data || details;
                    setEditingCampaign(campaign);
                    setFormData({
                      name: campaignData.name || '',
                      description: campaignData.description || '',
                      commissionType: campaignData.commissionType || 'percentage',
                      commissionValue: campaignData.commissionValue?.toString() || '',
                      startDate: campaignData.startDate || '',
                      endDate: campaignData.endDate || '',
                      isActive: campaignData.isActive !== false,
                    });
                    setShowModal(true);
                  } catch (error: any) {
                    Toast.show({
                      type: 'error',
                      text1: 'خطأ',
                      text2: error.message || 'فشل تحميل تفاصيل الحملة',
                    });
                  }
                }}
              >
                <SafeIcon name="eye" size={18} color="#2196F3" />
                <Text style={[styles.actionText, styles.primaryActionText]}>عرض</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal */}
      {showModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingCampaign ? 'تفاصيل الحملة' : 'حملة جديدة'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  setEditingCampaign(null);
                  resetForm();
                }}
              >
                <SafeIcon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>اسم الحملة *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="اسم الحملة"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>نوع العمولة *</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[
                      styles.radioOption,
                      formData.commissionType === 'percentage' && { backgroundColor: theme.colors.primary + '20' },
                    ]}
                    onPress={() => setFormData({ ...formData, commissionType: 'percentage' })}
                  >
                    <Text style={[styles.radioText, { color: theme.colors.text }]}>نسبة مئوية</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.radioOption,
                      formData.commissionType === 'fixed' && { backgroundColor: theme.colors.primary + '20' },
                    ]}
                    onPress={() => setFormData({ ...formData, commissionType: 'fixed' })}
                  >
                    <Text style={[styles.radioText, { color: theme.colors.text }]}>مبلغ ثابت</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>قيمة العمولة *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.commissionValue}
                  onChangeText={(text) => setFormData({ ...formData, commissionValue: text })}
                  placeholder={formData.commissionType === 'percentage' ? '10' : '100'}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.switchGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>نشط</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                  trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
                  thumbColor={formData.isActive ? theme.colors.primary : '#F4F3F4'}
                />
              </View>

              {!editingCampaign && (
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSaveCampaign}
                >
                  <Text style={styles.submitButtonText}>إنشاء</Text>
                </TouchableOpacity>
              )}
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
    marginBottom: 8,
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
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
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
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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

