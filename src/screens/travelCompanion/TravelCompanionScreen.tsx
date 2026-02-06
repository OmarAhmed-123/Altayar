import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { travelCompanionService } from '../../services/travelCompanionService';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ExpressiveEmptyState } from '../../components/common/ExpressiveEmptyState';
import { SafeIcon } from '../../utils/iconHelper';
import Toast from 'react-native-toast-message';

export const TravelCompanionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [companions, setCompanions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  useEffect(() => {
    loadCompanions();
  }, []);

  const loadCompanions = async () => {
    try {
      setIsLoading(true);
      const response = await travelCompanionService.getCompanions();
      const companionsData = Array.isArray(response) ? response : (response.data || []);
      setCompanions(companionsData);
    } catch (error: any) {
      console.error('Error loading companions:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل تحميل طلبات الرفقة',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCompanions();
    setRefreshing(false);
  };

  const handleCreateRequest = async () => {
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      await travelCompanionService.createCompanionRequest(formData);
      setShowModal(false);
      setFormData({ destination: '', startDate: '', endDate: '', description: '' });
      loadCompanions();
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم إنشاء طلب الرفقة بنجاح',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل إنشاء طلب الرفقة',
      });
    }
  };

  const renderCompanionItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={[styles.companionCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => {
          // Navigate to details or contact
        }}
      >
        <View style={styles.companionHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <SafeIcon name="person" size={24} color="#fff" />
          </View>
          <View style={styles.companionInfo}>
            <Text style={[styles.companionName, { color: theme.colors.text }]}>
              {item.user?.name || 'مسافر'}
            </Text>
            <Text style={[styles.companionDestination, { color: theme.colors.textSecondary }]}>
              {item.destination}
            </Text>
          </View>
        </View>
        <Text style={[styles.companionDescription, { color: theme.colors.text }]} numberOfLines={2}>
          {item.description || 'لا يوجد وصف'}
        </Text>
        <View style={styles.companionDates}>
          <View style={styles.dateItem}>
            <SafeIcon name="calendar" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
              {item.startDate ? new Date(item.startDate).toLocaleDateString('ar-EG') : ''}
            </Text>
          </View>
          <Text style={[styles.dateSeparator, { color: theme.colors.textSecondary }]}>-</Text>
          <View style={styles.dateItem}>
            <SafeIcon name="calendar" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
              {item.endDate ? new Date(item.endDate).toLocaleDateString('ar-EG') : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>رفقة السفر</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <SafeIcon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {companions.length === 0 ? (
        <ExpressiveEmptyState
          title="لا توجد طلبات رفقة"
          message="لا توجد طلبات رفقة متاحة حالياً"
          iconName="people"
        />
      ) : (
        <FlatList
          data={companions}
          renderItem={renderCompanionItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>إنشاء طلب رفقة</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="الوجهة"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.destination}
              onChangeText={(text) => setFormData({ ...formData, destination: text })}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="تاريخ البداية (YYYY-MM-DD)"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.startDate}
              onChangeText={(text) => setFormData({ ...formData, startDate: text })}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="تاريخ النهاية (YYYY-MM-DD)"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.endDate}
              onChangeText={(text) => setFormData({ ...formData, endDate: text })}
            />
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="الوصف (اختياري)"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleCreateRequest}
              >
                <Text style={styles.modalButtonText}>إنشاء</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  companionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  companionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companionInfo: {
    flex: 1,
  },
  companionName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companionDestination: {
    fontSize: 14,
  },
  companionDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  companionDates: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
  },
  dateSeparator: {
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

