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
import { documentAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const DocumentsManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentAPI.getAllDocuments();
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
              await documentAPI.deleteDocument(documentId);
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة المستندات</Text>
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
        {documents.length > 0 ? (
          documents.map((document) => (
            <View key={document.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                    {document.fileName || document.name || 'مستند'}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                    {document.user?.firstName} {document.user?.lastName} • {document.user?.email}
                  </Text>
                  {document.uploadedAt && (
                    <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                      {new Date(document.uploadedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <SafeIcon name="document" size={32} color={theme.colors.primary} />
              </View>

              {document.fileType && (
                <View style={styles.typeContainer}>
                  <Text style={[styles.typeLabel, { color: theme.colors.textSecondary }]}>
                    النوع: {document.fileType}
                  </Text>
                  {document.fileSize && (
                    <Text style={[styles.typeLabel, { color: theme.colors.textSecondary }]}>
                      الحجم: {document.fileSize}
                    </Text>
                  )}
                </View>
              )}

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
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <SafeIcon name="document" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد مستندات
            </Text>
          </View>
        )}
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
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  typeLabel: {
    fontSize: 12,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});

