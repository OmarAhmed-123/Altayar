import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { marketingAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const MarketingAutomationScreen: React.FC = () => {
  const { theme } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(theme), [theme]);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'triggers'>('campaigns');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [editingTrigger, setEditingTrigger] = useState<any>(null);
  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    description: '',
    type: 'email',
    targetAudience: '',
    targetCriteria: '',
    content: '',
    startDate: '',
    endDate: '',
    scheduledAt: '',
    isActive: true,
  });
  const [triggerFormData, setTriggerFormData] = useState({
    name: '',
    eventType: '',
    conditions: '',
    actions: '',
    isActive: true,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'campaigns') {
        const response = await marketingAPI.getCampaigns();
        const campaignsData = response.data || response || [];
        setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
      } else {
        const response = await marketingAPI.getAutomatedTriggers();
        const triggersData = response.data || response || [];
        setTriggers(Array.isArray(triggersData) ? triggersData : []);
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

  const handleSaveCampaign = async () => {
    if (!campaignFormData.name || !campaignFormData.type) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      const campaignPayload = {
        name: campaignFormData.name,
        description: campaignFormData.description,
        type: campaignFormData.type,
        targetCriteria: campaignFormData.targetCriteria || campaignFormData.targetAudience || undefined,
        content: campaignFormData.content || campaignFormData.description || '',
        scheduledAt: campaignFormData.scheduledAt || campaignFormData.startDate || undefined,
        startDate: campaignFormData.startDate || undefined,
        endDate: campaignFormData.endDate || undefined,
        isActive: campaignFormData.isActive,
      };

      if (editingCampaign) {
        await marketingAPI.updateCampaign(editingCampaign.id, campaignPayload);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم تحديث الحملة بنجاح',
        });
      } else {
        await marketingAPI.createCampaign(campaignPayload);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم إنشاء الحملة بنجاح',
        });
      }
      setShowCampaignModal(false);
      setEditingCampaign(null);
      resetCampaignForm();
      loadData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل حفظ الحملة',
      });
    }
  };

  const handleSaveTrigger = async () => {
    if (!triggerFormData.name || !triggerFormData.eventType) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      const triggerPayload = {
        name: triggerFormData.name,
        eventType: triggerFormData.eventType,
        conditions: triggerFormData.conditions || undefined,
        actions: triggerFormData.actions || undefined,
        isActive: triggerFormData.isActive,
      };

      if (editingTrigger) {
        await marketingAPI.updateAutomatedTrigger(editingTrigger.id, triggerPayload);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم تحديث المشغل بنجاح',
        });
      } else {
        await marketingAPI.createAutomatedTrigger(triggerPayload);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم إنشاء المشغل بنجاح',
        });
      }
      setShowTriggerModal(false);
      setEditingTrigger(null);
      resetTriggerForm();
      loadData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل حفظ المشغل',
      });
    }
  };

  const resetCampaignForm = () => {
    setCampaignFormData({
      name: '',
      description: '',
      type: 'email',
      targetAudience: '',
      targetCriteria: '',
      content: '',
      startDate: '',
      endDate: '',
      scheduledAt: '',
      isActive: true,
    });
  };

  const resetTriggerForm = () => {
    setTriggerFormData({
      name: '',
      eventType: '',
      conditions: '',
      actions: '',
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>التسويق الآلي</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'campaigns' ? dynamicStyles.tabActive : null,
          ]}
          onPress={() => setActiveTab('campaigns')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'campaigns'
                ? dynamicStyles.tabTextActive
                : dynamicStyles.tabTextInactive,
            ]}
          >
            الحملات ({campaigns.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'triggers' ? dynamicStyles.tabActive : null,
          ]}
          onPress={() => setActiveTab('triggers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'triggers'
                ? dynamicStyles.tabTextActive
                : dynamicStyles.tabTextInactive,
            ]}
          >
            المشغلات ({triggers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'campaigns' ? (
        <>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              resetCampaignForm();
              setEditingCampaign(null);
              setShowCampaignModal(true);
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
                      {campaign.type} • {campaign.targetAudience || campaign.targetCriteria || 'جميع المستخدمين'}
                    </Text>
                  </View>
                <View
                  style={[
                    styles.statusBadge,
                    campaign.isActive
                      ? dynamicStyles.statusBadgeActive
                      : dynamicStyles.statusBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      campaign.isActive
                        ? dynamicStyles.statusTextActive
                        : dynamicStyles.statusTextInactive,
                    ]}
                  >
                      {campaign.isActive ? 'نشط' : 'غير نشط'}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                  style={[styles.actionButton, dynamicStyles.actionButtonPrimary]}
                    onPress={() => {
                      setEditingCampaign(campaign);
                      setCampaignFormData({
                        name: campaign.name || '',
                        description: campaign.description || '',
                        type: campaign.type || 'email',
                        targetAudience: campaign.targetAudience || '',
                        targetCriteria: campaign.targetCriteria || campaign.targetAudience || '',
                        content: campaign.content || campaign.description || '',
                        startDate: campaign.startDate || '',
                        endDate: campaign.endDate || '',
                        scheduledAt: campaign.scheduledAt || campaign.startDate || '',
                        isActive: campaign.isActive !== false,
                      });
                      setShowCampaignModal(true);
                    }}
                  >
                    <SafeIcon name="edit" size={18} color="#2196F3" />
                    <Text style={[styles.actionText, dynamicStyles.actionButtonPrimaryText]}>
                      تعديل
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              resetTriggerForm();
              setEditingTrigger(null);
              setShowTriggerModal(true);
            }}
          >
            <SafeIcon name="add" size={24} color="#FFFFFF" />
            <Text style={styles.createButtonText}>مشغل جديد</Text>
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
            {triggers.map((trigger) => (
              <View key={trigger.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{trigger.name}</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                      {trigger.eventType || trigger.event}
                    </Text>
                  </View>
                <View
                  style={[
                    styles.statusBadge,
                    trigger.isActive
                      ? dynamicStyles.statusBadgeActive
                      : dynamicStyles.statusBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      trigger.isActive
                        ? dynamicStyles.statusTextActive
                        : dynamicStyles.statusTextInactive,
                    ]}
                  >
                      {trigger.isActive ? 'نشط' : 'غير نشط'}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                  style={[styles.actionButton, dynamicStyles.actionButtonPrimary]}
                    onPress={() => {
                      setEditingTrigger(trigger);
                      setTriggerFormData({
                        name: trigger.name || '',
                        eventType: trigger.eventType || trigger.event || '',
                        conditions: trigger.conditions || '',
                        actions: trigger.actions || '',
                        isActive: trigger.isActive !== false,
                      });
                      setShowTriggerModal(true);
                    }}
                  >
                    <SafeIcon name="edit" size={18} color="#2196F3" />
                    <Text style={[styles.actionText, dynamicStyles.actionButtonPrimaryText]}>
                      تعديل
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingCampaign ? 'تعديل الحملة' : 'حملة جديدة'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCampaignModal(false);
                  setEditingCampaign(null);
                  resetCampaignForm();
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
                  value={campaignFormData.name}
                  onChangeText={(text) => setCampaignFormData({ ...campaignFormData, name: text })}
                  placeholder="اسم الحملة"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>النوع *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={campaignFormData.type}
                  onChangeText={(text) => setCampaignFormData({ ...campaignFormData, type: text })}
                  placeholder="email, sms, push"
                  placeholderTextColor={theme.colors.textSecondary}
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
                  value={campaignFormData.description}
                  onChangeText={(text) => setCampaignFormData({ ...campaignFormData, description: text })}
                  placeholder="وصف الحملة"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.switchGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>نشط</Text>
                <Switch
                  value={campaignFormData.isActive}
                  onValueChange={(value) => setCampaignFormData({ ...campaignFormData, isActive: value })}
                  trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
                  thumbColor={campaignFormData.isActive ? theme.colors.primary : '#F4F3F4'}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveCampaign}
              >
                <Text style={styles.submitButtonText}>{editingCampaign ? 'تحديث' : 'إنشاء'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Trigger Modal */}
      {showTriggerModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingTrigger ? 'تعديل المشغل' : 'مشغل جديد'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowTriggerModal(false);
                  setEditingTrigger(null);
                  resetTriggerForm();
                }}
              >
                <SafeIcon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>اسم المشغل *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={triggerFormData.name}
                  onChangeText={(text) => setTriggerFormData({ ...triggerFormData, name: text })}
                  placeholder="اسم المشغل"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>الحدث *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={triggerFormData.eventType}
                  onChangeText={(text) => setTriggerFormData({ ...triggerFormData, eventType: text })}
                  placeholder="booking.created, user.registered"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.switchGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>نشط</Text>
                <Switch
                  value={triggerFormData.isActive}
                  onValueChange={(value) => setTriggerFormData({ ...triggerFormData, isActive: value })}
                  trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
                  thumbColor={triggerFormData.isActive ? theme.colors.primary : '#F4F3F4'}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveTrigger}
              >
                <Text style={styles.submitButtonText}>{editingTrigger ? 'تحديث' : 'إنشاء'}</Text>
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
    statusBadgeActive: {
      backgroundColor: `${theme.colors.success}20`,
    },
    statusBadgeInactive: {
      backgroundColor: `${theme.colors.error}20`,
    },
    statusTextActive: {
      color: theme.colors.success,
    },
    statusTextInactive: {
      color: theme.colors.error,
    },
    actionButtonPrimary: {
      backgroundColor: '#2196F320',
    },
    actionButtonPrimaryText: {
      color: '#2196F3',
    },
  });

