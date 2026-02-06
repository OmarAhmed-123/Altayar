import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { API } from './../../services/apiClient';
// Mock data removed - using real backend data only
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { ExpressiveEmptyState } from './../../components/common/ExpressiveEmptyState';
import { SafeIcon } from './../../utils/iconHelper';

export const InboxScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // Use real backend API
      const response = await API.notification.getNotifications();
      const data = Array.isArray(response) 
        ? response 
        : ((response as any).data || []);
      
      setNotifications(data.slice(0, 50));
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await API.notification.markAsRead(id.toString());
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="جاري التحميل..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>الرسائل</Text>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                {
                  backgroundColor: notification.is_read ? theme.colors.surface : theme.colors.primary + '10',
                },
              ]}
              onPress={() => handleMarkAsRead(notification.id)}
            >
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                  {notification.title || notification.message}
                </Text>
                <Text style={[styles.notificationMessage, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                  {notification.message || notification.body}
                </Text>
                <Text style={[styles.notificationDate, { color: theme.colors.textSecondary }]}>
                  {new Date(notification.created_at || notification.createdAt).toLocaleDateString('ar-EG')}
                </Text>
              </View>
              {!notification.is_read && (
                <View style={styles.unreadDot} />
              )}
            </TouchableOpacity>
          ))
        ) : (
          <ExpressiveEmptyState
            title="لا توجد رسائل"
            message="سيتم إشعارك عند وجود رسائل جديدة"
            imageCategory="inbox"
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  notificationCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0078D4',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
