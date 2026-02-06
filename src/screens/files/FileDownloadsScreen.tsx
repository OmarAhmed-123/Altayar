import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { fileManagementAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

interface Download {
  id: number;
  file_type: string;
  file_id: number;
  downloaded_at: string;
  file_name?: string;
  file_url?: string;
}

export const FileDownloadsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDownloads = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fileManagementAPI.getUserDownloads();
      const downloadsData = response.data || response || [];
      setDownloads(Array.isArray(downloadsData) ? downloadsData : []);
    } catch (error: any) {
      console.error('Error loading downloads:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل التحميلات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  const handleDownload = async (fileType: string, fileId: number) => {
    try {
      const response = await fileManagementAPI.getDownloadUrl(fileType, fileId);
      const downloadData = response?.data || response || {};
      const url = downloadData.url || downloadData.file_url;
      
      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          Toast.show({
            type: 'success',
            text1: 'نجح',
            text2: 'جاري فتح الملف',
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'خطأ',
            text2: 'لا يمكن فتح هذا الملف',
          });
        }
      }
    } catch (error: any) {
      console.error('Error downloading file:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل الملف',
      });
    }
  };

  const getFileTypeName = (type: string) => {
    const types: Record<string, string> = {
      membership_card: 'بطاقة العضوية',
      voucher: 'كوبون',
      invoice: 'فاتورة',
      document: 'مستند',
    };
    return types[type] || type;
  };

  const getFileTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      membership_card: 'card-membership',
      voucher: 'card-giftcard',
      invoice: 'receipt',
      document: 'description',
    };
    return icons[type] || 'file-download';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderDownloadItem = ({ item }: { item: Download }) => (
    <View style={[styles.downloadCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.downloadHeader}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <SafeIcon name={getFileTypeIcon(item.file_type)} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.downloadInfo}>
          <Text style={[styles.fileName, { color: theme.colors.text }]}>
            {item.file_name || getFileTypeName(item.file_type)}
          </Text>
          <Text style={[styles.downloadDate, { color: theme.colors.textSecondary }]}>
            {formatDate(item.downloaded_at)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.downloadButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => handleDownload(item.file_type, item.file_id)}
      >
        <SafeIcon name="download" size={20} color="#FFFFFF" />
        <Text style={styles.downloadButtonText}>تحميل مرة أخرى</Text>
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>التحميلات</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {downloads.length} ملف محمل
        </Text>
      </View>

      <FlatList
        data={downloads}
        renderItem={renderDownloadItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDownloads();
            }}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SafeIcon name="file-download" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد تحميلات
            </Text>
          </View>
        }
      />
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
  downloadCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  downloadDate: {
    fontSize: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
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
});

