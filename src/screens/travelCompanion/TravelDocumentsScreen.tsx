import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { travelCompanionAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const TravelDocumentsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'expiring' | 'expired'>('all');

  useEffect(() => {
    loadDocuments();
  }, [filter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filter === 'expiring') {
        filters.status = 'expiring';
      } else if (filter === 'expired') {
        filters.status = 'expired';
      }
      const response = await travelCompanionAPI.getTravelDocuments(filters);
      const documentsData = response.data || response || [];
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل المستندات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    Alert.alert(
      'حذف المستند',
      'هل أنت متأكد من حذف هذا المستند?',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await travelCompanionAPI.deleteTravelDocument(documentId);
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم حذف المستند بنجاح',
              });
              loadDocuments();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error.message || 'فشل حذف المستند',
              });
            }
          },
        },
      ]
    );
  };

  const getDocumentStatus = (document: any) => {
    if (document.expiryDate) {
      const expiry = new Date(document.expiryDate);
      const now = new Date();
      if (expiry < now) {
        return { status: 'expired', color: theme.colors.error };
      }
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30) {
        return { status: 'expiring', color: '#FF9800' };
      }
    }
    return { status: 'valid', color: theme.colors.success };
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>مستندات السفر</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'expiring', 'expired'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              filter === status && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setFilter(status)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === status ? '#FFFFFF' : theme.colors.text },
              ]}
            >
              {status === 'all' ? 'الكل' : status === 'expiring' ? 'قريب الانتهاء' : 'منتهي'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDocuments();
            }}
            colors={[theme.colors.primary]}
          />
        }
      >
        {documents.map((document) => {
          const docStatus = getDocumentStatus(document);
          return (
            <View key={document.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                    {document.fileName || document.name || 'مستند'}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                    {document.documentType || document.type || 'نوع غير محدد'}
                  </Text>
                  {document.expiryDate && (
                    <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                      تاريخ الانتهاء: {new Date(document.expiryDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: docStatus.color + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: docStatus.color },
                    ]}
                  >
                    {docStatus.status === 'expired' ? 'منتهي' : docStatus.status === 'expiring' ? 'قريب الانتهاء' : 'صالح'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.error + '20' }]}
                  onPress={() => handleDeleteDocument(document.id)}
                >
                  <SafeIcon name="trash" size={18} color={theme.colors.error} />
                  <Text style={[styles.actionText, { color: theme.colors.error }]}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  filterText: {
    fontSize: 12,
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
});

