import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { documentService } from '../../services/documentService';
import { useTheme } from '../../hooks/useTheme';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ExpressiveEmptyState } from '../../components/common/ExpressiveEmptyState';
import { SafeIcon } from '../../utils/iconHelper';
import Toast from 'react-native-toast-message';

export const DocumentsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await documentService.getMyDocuments();
      const docsData = Array.isArray(response) ? response : (response.data || []);
      setDocuments(docsData);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل تحميل المستندات',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const handleDelete = (documentId: string) => {
    Alert.alert(
      'حذف المستند',
      'هل أنت متأكد من حذف هذا المستند؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await documentService.deleteDocument(documentId);
              loadDocuments();
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم حذف المستند بنجاح',
              });
            } catch (error: any) {
              console.error('Error deleting document:', error);
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: 'فشل حذف المستند',
              });
            }
          },
        },
      ]
    );
  };

  const getDocumentIcon = (type: string) => {
    if (type?.includes('pdf')) return 'document-text';
    if (type?.includes('image')) return 'image';
    return 'document';
  };

  const renderDocumentItem = ({ item }: { item: any }) => {
    const iconName = getDocumentIcon(item.fileType || item.type);
    return (
      <TouchableOpacity
        style={[styles.documentItem, { backgroundColor: theme.colors.surface }]}
        onPress={() => {
          // Open document preview or download
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <SafeIcon name={iconName} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.documentContent}>
          <Text style={[styles.documentName, { color: theme.colors.text }]} numberOfLines={1}>
            {item.fileName || item.name || 'مستند'}
          </Text>
          <Text style={[styles.documentDate, { color: theme.colors.textSecondary }]}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDelete(item.id.toString())}
          style={styles.deleteButton}
        >
          <SafeIcon name="trash" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (isLoading && !refreshing) {
    return <LoadingSpinner />;
  }

  if (documents.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ExpressiveEmptyState
          title="لا توجد مستندات"
          message="لا توجد مستندات متاحة حالياً"
          iconName="document"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={documents}
        renderItem={renderDocumentItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  documentItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentContent: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
});

