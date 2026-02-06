import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { settingsAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const SettingsManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(theme), [theme]);
  const [generalSettings, setGeneralSettings] = useState<any>({});
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'pages'>('general');
  const [showPageModal, setShowPageModal] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [pageFormData, setPageFormData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_title: '',
    meta_description: '',
    is_published: true,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'general') {
        const response = await settingsAPI.getGeneralSettings();
        setGeneralSettings(response.data || response || {});
      } else {
        const response = await settingsAPI.getAllPages();
        const pagesData = response.data || response || [];
        setPages(Array.isArray(pagesData) ? pagesData : []);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل البيانات',
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveGeneralSettings = async () => {
    try {
      setSaving(true);
      await settingsAPI.updateGeneralSettings(generalSettings);
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم حفظ الإعدادات بنجاح',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل حفظ الإعدادات',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePage = async () => {
    if (!pageFormData.title || !pageFormData.slug || !pageFormData.content) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      setSaving(true);
      if (editingPage) {
        await settingsAPI.updatePage(editingPage.id, pageFormData);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم تحديث الصفحة بنجاح',
        });
      } else {
        await settingsAPI.createPage(pageFormData);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم إنشاء الصفحة بنجاح',
        });
      }
      setShowPageModal(false);
      setEditingPage(null);
      resetPageForm();
      loadData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل حفظ الصفحة',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePage = async (pageId: number, pageTitle: string) => {
    Alert.alert(
      'حذف الصفحة',
      `هل أنت متأكد من حذف الصفحة "${pageTitle}"?`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await settingsAPI.deletePage(pageId);
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم حذف الصفحة بنجاح',
              });
              loadData();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || 'فشل حذف الصفحة',
              });
            }
          },
        },
      ]
    );
  };

  const resetPageForm = () => {
    setPageFormData({
      title: '',
      slug: '',
      content: '',
      meta_title: '',
      meta_description: '',
      is_published: true,
    });
  };

  const openEditPage = (page: any) => {
    setEditingPage(page);
    setPageFormData({
      title: page.title || '',
      slug: page.slug || '',
      content: page.content || '',
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
      is_published: page.is_published !== false,
    });
    setShowPageModal(true);
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة الإعدادات</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'general' ? dynamicStyles.tabActive : null,
          ]}
          onPress={() => setActiveTab('general')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'general'
                ? dynamicStyles.tabTextActive
                : dynamicStyles.tabTextInactive,
            ]}
          >
            الإعدادات العامة
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'pages' ? dynamicStyles.tabActive : null,
          ]}
          onPress={() => setActiveTab('pages')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'pages'
                ? dynamicStyles.tabTextActive
                : dynamicStyles.tabTextInactive,
            ]}
          >
            الصفحات ({pages.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'general' ? (
        <ScrollView style={styles.content}>
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>الإعدادات العامة</Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              يمكنك تعديل الإعدادات العامة للتطبيق هنا
            </Text>
            {/* Add specific settings fields based on backend structure */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSaveGeneralSettings}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>حفظ الإعدادات</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.container}>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              resetPageForm();
              setEditingPage(null);
              setShowPageModal(true);
            }}
          >
            <SafeIcon name="add" size={24} color="#FFFFFF" />
            <Text style={styles.createButtonText}>صفحة جديدة</Text>
          </TouchableOpacity>

          <ScrollView style={styles.content}>
            {pages.map((page) => (
              <View key={page.id} style={[styles.pageCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.pageHeader}>
                  <View style={styles.pageInfo}>
                    <Text style={[styles.pageTitle, { color: theme.colors.text }]}>{page.title}</Text>
                    <Text style={[styles.pageSlug, { color: theme.colors.textSecondary }]}>
                      /{page.slug}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: page.is_published ? theme.colors.success + '20' : theme.colors.error + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: page.is_published ? theme.colors.success : theme.colors.error },
                      ]}
                    >
                      {page.is_published ? 'منشور' : 'مسودة'}
                    </Text>
                  </View>
                </View>

                <View style={styles.pageActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, dynamicStyles.primaryActionButton]}
                    onPress={() => openEditPage(page)}
                  >
                    <SafeIcon name="edit" size={18} color="#2196F3" />
                    <Text style={[styles.actionText, dynamicStyles.primaryActionText]}>تعديل</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.error + '20' }]}
                    onPress={() => handleDeletePage(page.id, page.title)}
                  >
                    <SafeIcon name="delete" size={18} color={theme.colors.error} />
                    <Text style={[styles.actionText, { color: theme.colors.error }]}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Page Modal */}
      {showPageModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingPage ? 'تعديل الصفحة' : 'صفحة جديدة'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPageModal(false);
                  setEditingPage(null);
                  resetPageForm();
                }}
              >
                <SafeIcon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>العنوان *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={pageFormData.title}
                  onChangeText={(text) => setPageFormData({ ...pageFormData, title: text })}
                  placeholder="عنوان الصفحة"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>الرابط (Slug) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={pageFormData.slug}
                  onChangeText={(text) => setPageFormData({ ...pageFormData, slug: text })}
                  placeholder="about-us"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>المحتوى *</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: theme.colors.background, color: theme.colors.text },
                  ]}
                  value={pageFormData.content}
                  onChangeText={(text) => setPageFormData({ ...pageFormData, content: text })}
                  placeholder="محتوى الصفحة"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={8}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Meta Title</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={pageFormData.meta_title}
                  onChangeText={(text) => setPageFormData({ ...pageFormData, meta_title: text })}
                  placeholder="عنوان SEO"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Meta Description</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: theme.colors.background, color: theme.colors.text },
                  ]}
                  value={pageFormData.meta_description}
                  onChangeText={(text) => setPageFormData({ ...pageFormData, meta_description: text })}
                  placeholder="وصف SEO"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSavePage}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>{editingPage ? 'تحديث' : 'إنشاء'}</Text>
                )}
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  pageCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pageInfo: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  pageSlug: {
    fontSize: 12,
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
  pageActions: {
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
    height: 150,
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
    primaryActionButton: {
      backgroundColor: '#2196F320',
    },
    primaryActionText: {
      color: '#2196F3',
    },
  });

