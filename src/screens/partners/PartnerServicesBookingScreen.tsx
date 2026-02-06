import React, { useState, useEffect } from 'react';
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
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { partnerService } from './../../services/partnerService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

interface PartnerService {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  duration?: number;
  partner?: {
    companyName: string;
    contactPerson: string;
  };
}

export const PartnerServicesBookingScreen: React.FC = () => {
  const { theme } = useTheme();
  const [services, setServices] = useState<PartnerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedService, setSelectedService] = useState<PartnerService | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    participants: '1',
    specialRequests: '',
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await partnerService.getAvailableServices();
      const servicesData = response.data || response || [];
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل الخدمات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleBookService = async () => {
    if (!selectedService) return;

    if (!bookingData.startDate) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى اختيار تاريخ البداية',
      });
      return;
    }

    try {
      await partnerService.bookPartnerService(selectedService.id, {
        startDate: bookingData.startDate,
        endDate: bookingData.endDate || undefined,
        participants: parseInt(bookingData.participants) || 1,
        specialRequests: bookingData.specialRequests || undefined,
      });

      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم حجز الخدمة بنجاح',
      });

      setShowBookingModal(false);
      setSelectedService(null);
      setBookingData({
        startDate: '',
        endDate: '',
        participants: '1',
        specialRequests: '',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل حجز الخدمة',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const renderServiceItem = ({ item }: { item: PartnerService }) => (
    <View style={[styles.serviceCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceName, { color: theme.colors.text }]}>{item.name}</Text>
          {item.partner && (
            <Text style={[styles.partnerName, { color: theme.colors.textSecondary }]}>
              {item.partner.companyName}
            </Text>
          )}
          {item.description && (
            <Text style={[styles.serviceDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.serviceDetails}>
        {item.category && (
          <View style={styles.detailBadge}>
            <Text style={[styles.detailBadgeText, { color: theme.colors.primary }]}>
              {item.category}
            </Text>
          </View>
        )}
        {item.duration && (
          <View style={styles.detailRow}>
            <SafeIcon name="schedule" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {item.duration} ساعة
            </Text>
          </View>
        )}
        <Text style={[styles.servicePrice, { color: theme.colors.primary }]}>
          {formatCurrency(item.price)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.bookButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          setSelectedService(item);
          setShowBookingModal(true);
        }}
      >
        <SafeIcon name="book-online" size={20} color="#FFFFFF" />
        <Text style={styles.bookButtonText}>احجز الآن</Text>
      </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>خدمات الشركاء</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {services.length} خدمة متاحة
        </Text>
      </View>

      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadServices();
            }}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="business" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد خدمات متاحة حالياً
            </Text>
          </View>
        }
      />

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowBookingModal(false);
          setSelectedService(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                حجز {selectedService?.name}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowBookingModal(false);
                  setSelectedService(null);
                }}
              >
                <SafeIcon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bookingForm}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>تاريخ البداية *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={bookingData.startDate}
                  onChangeText={(text) => setBookingData({ ...bookingData, startDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>تاريخ النهاية</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={bookingData.endDate}
                  onChangeText={(text) => setBookingData({ ...bookingData, endDate: text })}
                  placeholder="YYYY-MM-DD (اختياري)"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>عدد المشاركين</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  value={bookingData.participants}
                  onChangeText={(text) => setBookingData({ ...bookingData, participants: text })}
                  placeholder="1"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>طلبات خاصة</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: theme.colors.background, color: theme.colors.text },
                  ]}
                  value={bookingData.specialRequests}
                  onChangeText={(text) => setBookingData({ ...bookingData, specialRequests: text })}
                  placeholder="أي طلبات خاصة (اختياري)"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {selectedService && (
                <View style={[styles.priceSummary, { backgroundColor: theme.colors.primary + '10' }]}>
                  <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>السعر الإجمالي</Text>
                  <Text style={[styles.priceValue, { color: theme.colors.primary }]}>
                    {formatCurrency(selectedService.price)}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleBookService}
              >
                <Text style={styles.submitButtonText}>تأكيد الحجز</Text>
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
  listContent: {
    padding: 16,
  },
  serviceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    marginBottom: 12,
  },
  serviceInfo: {
    gap: 4,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
  },
  partnerName: {
    fontSize: 14,
  },
  serviceDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  detailBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 'auto',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
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
  bookingForm: {
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
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 16,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

