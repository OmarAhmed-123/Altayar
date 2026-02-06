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
import { externalAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const ExternalApiIntegrationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<any>(null);
  const [formData, setFormData] = useState({
    serviceName: '',
    serviceType: '',
    apiKey: '',
    apiSecret: '',
    baseUrl: '',
    isProduction: false,
    rateLimit: '',
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await externalAPI.getApiIntegrations();
      const integrationsData = response.data || response || [];
      setIntegrations(Array.isArray(integrationsData) ? integrationsData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل التكاملات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSaveIntegration = async () => {
    if (!formData.serviceName || !formData.serviceType || !formData.apiKey) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      if (editingIntegration) {
        await externalAPI.updateApiIntegration(editingIntegration.id, formData);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم تحديث التكامل بنجاح',
        });
      } else {
        await externalAPI.createApiIntegration({
          ...formData,
          rateLimit: formData.rateLimit ? parseInt(formData.rateLimit, 10) : undefined,
        });
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم إنشاء التكامل بنجاح',
        });
      }
      setShowModal(false);
      setEditingIntegration(null);
      resetForm();
      loadIntegrations();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل حفظ التكامل',
      });
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await externalAPI.toggleIntegrationStatus(id);
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم تغيير حالة التكامل',
      });
      loadIntegrations();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تغيير الحالة',
      });
    }
  };

  const handleTestIntegration = async (id: number) => {
    try {
      await externalAPI.testApiIntegration(id, {
        endpoint: '/test',
        method: 'GET',
      });
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم اختبار التكامل بنجاح',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل اختبار التكامل',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      serviceName: '',
      serviceType: '',
      apiKey: '',
      apiSecret: '',
      baseUrl: '',
      isProduction: false,
      rateLimit: '',
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>تكاملات API الخارجية</Text>
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          resetForm();
          setEditingIntegration(null);
          setShowModal(true);
        }}
      >
        <SafeIcon name="add" size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>تكامل جديد</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadIntegrations();
            }}
            colors={[theme.colors.primary]}
          />
        }
      >
        {integrations.map((integration) => (
          <View key={integration.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{integration.serviceName}</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  {integration.serviceType} • {integration.isProduction ? 'Production' : 'Sandbox'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: integration.isActive ? theme.colors.success + '20' : theme.colors.error + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: integration.isActive ? theme.colors.success : theme.colors.error },
                  ]}
                >
                  {integration.isActive ? 'نشط' : 'غير نشط'}
                </Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryActionButton]}
                onPress={() => {
                  setEditingIntegration(integration);
                  setFormData({
                    serviceName: integration.serviceName || '',
                    serviceType: integration.serviceType || '',
                    apiKey: integration.apiKey || '',
                    apiSecret: integration.apiSecret || '',
                    baseUrl: integration.baseUrl || '',
                    isProduction: integration.isProduction || false,
                    rateLimit: integration.rateLimit?.toString() || '',
                  });
                  setShowModal(true);
                }}
              >
                <SafeIcon name="edit" size={18} color="#2196F3" />
                <Text style={[styles.actionText, styles.primaryActionText]}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.warningActionButton]}
                onPress={() => handleToggleStatus(integration.id)}
              >
                <SafeIcon name="toggle" size={18} color="#FF9800" />
                <Text style={[styles.actionText, styles.warningActionText]}>تبديل</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.successActionButton]}
                onPress={() => handleTestIntegration(integration.id)}
              >
                <SafeIcon name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={[styles.actionText, styles.successActionText]}>اختبار</Text>
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
                {editingIntegration ? 'تعديل التكامل' : 'تكامل جديد'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  setEditingIntegration(null);
                  resetForm();
                }}
              >
                <SafeIcon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>اسم الخدمة *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.serviceName}
                  onChangeText={(text) => setFormData({ ...formData, serviceName: text })}
                  placeholder="Google Maps, Weather API"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>نوع الخدمة *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.serviceType}
                  onChangeText={(text) => setFormData({ ...formData, serviceType: text })}
                  placeholder="maps, weather, currency"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>API Key *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.apiKey}
                  onChangeText={(text) => setFormData({ ...formData, apiKey: text })}
                  placeholder="API Key"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>API Secret</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.apiSecret}
                  onChangeText={(text) => setFormData({ ...formData, apiSecret: text })}
                  placeholder="API Secret (اختياري)"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Base URL</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.baseUrl}
                  onChangeText={(text) => setFormData({ ...formData, baseUrl: text })}
                  placeholder="https://api.example.com"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Rate Limit</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.rateLimit}
                  onChangeText={(text) => setFormData({ ...formData, rateLimit: text })}
                  placeholder="100"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.switchGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Production Mode</Text>
                <Switch
                  value={formData.isProduction}
                  onValueChange={(value) => setFormData({ ...formData, isProduction: value })}
                  trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
                  thumbColor={formData.isProduction ? theme.colors.primary : '#F4F3F4'}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveIntegration}
              >
                <Text style={styles.submitButtonText}>{editingIntegration ? 'تحديث' : 'إنشاء'}</Text>
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
  successActionButton: {
    backgroundColor: '#4CAF5020',
  },
  successActionText: {
    color: '#4CAF50',
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

