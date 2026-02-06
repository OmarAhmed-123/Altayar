import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { bookingService } from './../../services/bookingService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

interface Booking {
  id: number;
  userId: number;
  packageId: number;
  bookingType: string;
  status: string;
  totalPrice: number;
  participants?: number;
  startDate?: string;
  endDate?: string;
  specialRequests?: string;
  created_at?: string;
  user?: {
    name: string;
    email: string;
  };
  package?: {
    title: string;
  };
}

export const BookingsManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(theme), [theme]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getAllBookings();
      const bookingsData = response.data || response || [];
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل الحجوزات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedBooking || !newStatus) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى اختيار حالة جديدة',
      });
      return;
    }

    try {
      await bookingService.updateBookingStatus(selectedBooking.id.toString(), newStatus);
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم تحديث حالة الحجز بنجاح',
      });
      setShowStatusModal(false);
      setSelectedBooking(null);
      setNewStatus('');
      loadBookings();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحديث حالة الحجز',
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: theme.colors.warning,
      confirmed: theme.colors.success,
      cancelled: theme.colors.error,
      completed: theme.colors.primary,
    };
    return colors[status] || theme.colors.textSecondary;
  };

  const getStatusName = (status: string) => {
    const names: Record<string, string> = {
      pending: 'قيد الانتظار',
      confirmed: 'مؤكد',
      cancelled: 'ملغي',
      completed: 'مكتمل',
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <View style={[styles.bookingCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={[styles.bookingId, { color: theme.colors.text }]}>
            حجز #{item.id}
          </Text>
          <Text style={[styles.bookingPackage, { color: theme.colors.textSecondary }]}>
            {item.package?.title || 'باقة'}
          </Text>
          {item.user && (
            <Text style={[styles.bookingUser, { color: theme.colors.textSecondary }]}>
              {item.user.name} ({item.user.email})
            </Text>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusName(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>السعر:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>
            {formatCurrency(item.totalPrice)}
          </Text>
        </View>
        {item.participants && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>المشاركون:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {item.participants}
            </Text>
          </View>
        )}
        {item.startDate && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>تاريخ البداية:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {formatDate(item.startDate)}
            </Text>
          </View>
        )}
        {item.endDate && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>تاريخ النهاية:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {formatDate(item.endDate)}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.updateButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          setSelectedBooking(item);
          setNewStatus(item.status);
          setShowStatusModal(true);
        }}
      >
        <SafeIcon name="edit" size={20} color="#FFFFFF" />
        <Text style={styles.updateButtonText}>تحديث الحالة</Text>
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة الحجوزات</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {bookings.length} حجز
        </Text>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadBookings();
            }}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="book-online" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد حجوزات
            </Text>
          </View>
        }
      />

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowStatusModal(false);
          setSelectedBooking(null);
          setNewStatus('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>تحديث حالة الحجز</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowStatusModal(false);
                  setSelectedBooking(null);
                  setNewStatus('');
                }}
              >
                <SafeIcon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.statusOptions}>
              {(['pending', 'confirmed', 'cancelled', 'completed'] as const).map((status) => {
                const isActive = newStatus === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      isActive ? dynamicStyles.statusOptionActive : null,
                    ]}
                    onPress={() => setNewStatus(status)}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        isActive
                          ? dynamicStyles.statusOptionTextActive
                          : dynamicStyles.statusOptionTextInactive,
                      ]}
                    >
                      {getStatusName(status)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleUpdateStatus}
            >
              <Text style={styles.submitButtonText}>تحديث</Text>
            </TouchableOpacity>
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
  bookingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingId: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookingPackage: {
    fontSize: 14,
    marginBottom: 4,
  },
  bookingUser: {
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
  bookingDetails: {
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
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  updateButtonText: {
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
  statusOptions: {
    gap: 12,
    marginBottom: 20,
  },
  statusOption: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '600',
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

const createDynamicStyles = (theme: any) =>
  StyleSheet.create({
    statusOptionActive: {
      backgroundColor: theme.colors.primary,
    },
    statusOptionTextActive: {
      color: '#FFFFFF',
    },
    statusOptionTextInactive: {
      color: theme.colors.text,
    },
  });

