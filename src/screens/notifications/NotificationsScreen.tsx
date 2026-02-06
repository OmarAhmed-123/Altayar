import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { AnimatedCard } from './../../components/animations/AnimatedCard';
import { ExpressiveEmptyState } from './../../components/common/ExpressiveEmptyState';
import { notificationService } from './../../services/notificationService';
// Mock data removed - using real backend data only
import { Notification } from './../../types';
import { SafeIcon } from './../../utils/iconHelper';

export const NotificationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // Use real backend API
      const response = await notificationService.getNotifications();
      // Transform backend notification data to frontend format
      const transformedNotifications: Notification[] = Array.isArray(response) 
        ? response.map(notification => ({
            ...notification,
            id: notification.id || notification.notification_id,
            isRead: notification.is_read === false ? false : (notification.is_read || notification.isRead || false),
            createdAt: notification.created_at || notification.createdAt || new Date().toISOString(),
          }))
        : [];
      
      setNotifications(transformedNotifications);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      Alert.alert('خطأ', 'فشل في تحميل الإشعارات');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId.toString());
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      // Refresh unread count after marking as read
      // This will trigger a refresh in the navigation badge
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      Alert.alert('خطأ', 'فشل في تحديث حالة الإشعار');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      Alert.alert('خطأ', 'فشل في تحديث حالة الإشعارات');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.info;
    }
  };

  const renderNotificationItem = ({ item, index }: { item: Notification; index: number }) => {
    return (
    <AnimatedCard
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification,
      ].filter(Boolean) as any}
      animationType="slide"
      delay={index * 100}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationLeft}>
          <View style={[
            styles.notificationIcon,
            { backgroundColor: getNotificationColor(item.type) }
          ]}>
            <SafeIcon
              name={getNotificationIcon(item.type)}
              size={20}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.notificationTime}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </Text>
          </View>
        </View>
        {!item.isRead && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </AnimatedCard>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    markAllButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    markAllText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
    },
    unreadCount: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    flatList: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    notificationItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    unreadNotification: {
      borderColor: theme.colors.primary,
      borderWidth: 1,
    },
    notificationContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: theme.spacing.lg,
    },
    notificationLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
    },
    notificationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    notificationInfo: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    notificationMessage: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: theme.spacing.sm,
    },
    notificationTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      marginLeft: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل الإشعارات..." />;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>الإشعارات</Text>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
              <Text style={styles.markAllText}>تعيين الكل كمقروء</Text>
            </TouchableOpacity>
          )}
        </View>
        {unreadCount > 0 && (
          <Text style={styles.unreadCount}>
            {unreadCount} إشعار غير مقروء
          </Text>
        )}
      </View>

      <FlatList
        style={styles.flatList}
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ExpressiveEmptyState
            title="لا توجد إشعارات"
            message="سيتم إشعارك عند وجود تحديثات جديدة"
            imageCategory="notification"
          />
        }
      />
    </View>
  );
};