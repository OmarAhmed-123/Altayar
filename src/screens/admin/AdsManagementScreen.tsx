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
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { adService } from './../../services/adService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

const EDIT_BUTTON_COLOR = '#2196F3';
const EDIT_BUTTON_BACKGROUND = `${EDIT_BUTTON_COLOR}20`;

interface Ad {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  created_at: string;
}

export const AdsManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      setLoading(true);
      const response = await adService.getActiveAds();
      const adsData = response.data || response || [];
      setAds(Array.isArray(adsData) ? adsData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل الإعلانات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateAd = async () => {
    if (!formData.title || !formData.description) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      if (editingAd) {
        await adService.updateAd(editingAd.id.toString(), formData);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم تحديث الإعلان بنجاح',
        });
      } else {
        await adService.createAd(formData);
        Toast.show({
          type: 'success',
          text1: 'نجح',
          text2: 'تم إنشاء الإعلان بنجاح',
        });
      }
      setShowCreateModal(false);
      setEditingAd(null);
      resetForm();
      loadAds();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل حفظ الإعلان',
      });
    }
  };

  const handleDeleteAd = async (adId: number, adTitle: string) => {
    Alert.alert(
      'حذف الإعلان',
      `هل أنت متأكد من حذف الإعلان "${adTitle}"?`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await adService.deleteAd(adId.toString());
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم حذف الإعلان بنجاح',
              });
              loadAds();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || 'فشل حذف الإعلان',
              });
            }
          },
        },
      ]
    );
  };

  const handleSendAd = async (adId: number) => {
    Alert.alert(
      'إرسال الإعلان',
      'هل تريد إرسال هذا الإعلان لجميع المستخدمين?',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إرسال',
          onPress: async () => {
            try {
              await adService.sendAdToUsers(adId.toString());
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم إرسال الإعلان بنجاح',
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || 'فشل إرسال الإعلان',
              });
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      startDate: '',
      endDate: '',
      isActive: true,
    });
  };

  const openEditModal = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl || '',
      linkUrl: ad.linkUrl || '',
      startDate: ad.startDate || '',
      endDate: ad.endDate || '',
      isActive: ad.isActive,
    });
    setShowCreateModal(true);
  };

  const renderAdItem = ({ item }: { item: Ad }) => (
    <View style={[styles.adCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.adHeader}>
        <View style={styles.adInfo}>
          <Text style={[styles.adTitle, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.adDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
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

      {item.imageUrl && (
        <View style={styles.imageContainer}>
          <Text style={[styles.imageLabel, { color: theme.colors.textSecondary }]}>
            رابط الصورة: {item.imageUrl.substring(0, 50)}...
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary + '20' }]}
          onPress={() => handleSendAd(item.id)}
        >
          <SafeIcon name="send" size={20} color={theme.colors.primary} />
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>إرسال</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: EDIT_BUTTON_BACKGROUND }]}
          onPress={() => openEditModal(item)}
        >
          <SafeIcon name="edit" size={20} color={EDIT_BUTTON_COLOR} />
          <Text style={[styles.actionText, { color: EDIT_BUTTON_COLOR }]}>تعديل</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error + '20' }]}
          onPress={() => handleDeleteAd(item.id, item.title)}
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة الإعلانات</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {ads.length} إعلان
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          resetForm();
          setEditingAd(null);
          setShowCreateModal(true);
        }}
      >
        <SafeIcon name="add" size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>إعلان جديد</Text>
      </TouchableOpacity>

      <FlatList
        data={ads}
        renderItem={renderAdItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAds();
            }}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="campaign" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد إعلانات
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
          setEditingAd(null);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingAd ? 'تعديل الإعلان' : 'إعلان جديد'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setEditingAd(null);
                  resetForm();
                }}
              >
                <SafeIcon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>العنوان *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="عنوان الإعلان"
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
                  placeholder="وصف الإعلان"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>رابط الصورة</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.imageUrl}
                  onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>رابط الإعلان</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={formData.linkUrl}
                  onChangeText={(text) => setFormData({ ...formData, linkUrl: text })}
                  placeholder="https://example.com"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleCreateAd}
              >
                <Text style={styles.submitButtonText}>{editingAd ? 'تحديث' : 'إنشاء'}</Text>
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
  adCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  adInfo: {
    flex: 1,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  adDescription: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  imageContainer: {
    marginBottom: 12,
  },
  imageLabel: {
    fontSize: 12,
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
});

