import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { chatAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const ChatConversationsManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      // Note: This endpoint might need to be added to backend for admin to get all conversations
      // For now, using fetchChats which returns user's chats
      const response = await chatAPI.fetchChats();
      const conversationsData = response.data || response || [];
      setConversations(Array.isArray(conversationsData) ? conversationsData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل المحادثات',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إدارة المحادثات</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadConversations();
            }}
            colors={[theme.colors.primary]}
          />
        }
      >
        {conversations.length > 0 ? (
          conversations.map((conversation) => (
            <View key={conversation._id || conversation.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                    {conversation.users?.[0]?.firstName || 'مستخدم'} {conversation.users?.[0]?.lastName || ''}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                    {conversation.users?.[0]?.email || 'بريد إلكتروني غير متاح'}
                  </Text>
                  {conversation.latestMessage && (
                    <Text style={[styles.messagePreview, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {conversation.latestMessage.content}
                    </Text>
                  )}
                </View>
                {conversation.latestMessage && (
                  <Text style={[styles.messageTime, { color: theme.colors.textSecondary }]}>
                    {new Date(conversation.latestMessage.createdAt || conversation.latestMessage.created_at).toLocaleTimeString()}
                  </Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <SafeIcon name="chatbubbles" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              لا توجد محادثات
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
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 14,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
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

