import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { chatService } from '../../services/chatService';
import { useTheme } from '../../hooks/useTheme';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ExpressiveEmptyState } from '../../components/common/ExpressiveEmptyState';
import { SafeIcon } from '../../utils/iconHelper';
import Toast from 'react-native-toast-message';

export const ChatsListScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const response = await chatService.fetchChats();
      const chatsData = Array.isArray(response) ? response : (response.data || []);
      setChats(chatsData);
    } catch (error: any) {
      console.error('Error loading chats:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل تحميل المحادثات',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const renderChatItem = ({ item }: { item: any }) => {
    const lastMessage = item.latestMessage || item.lastMessage;
    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: theme.colors.surface }]}
        onPress={() => {
          const nav = navigation as any;
          nav.navigate('Chat', { chatId: item.id });
        }}
      >
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <SafeIcon name="person" size={24} color="#fff" />
        </View>
        <View style={styles.chatContent}>
          <Text style={[styles.chatName, { color: theme.colors.text }]}>
            {item.user?.name || item.chatName || 'محادثة'}
          </Text>
          {lastMessage && (
            <Text style={[styles.lastMessage, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {lastMessage.content}
            </Text>
          )}
        </View>
        {lastMessage && (
          <Text style={[styles.messageTime, { color: theme.colors.textSecondary }]}>
            {new Date(lastMessage.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading && !refreshing) {
    return <LoadingSpinner />;
  }

  if (chats.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ExpressiveEmptyState
          title="لا توجد محادثات"
          message="لا توجد محادثات متاحة حالياً"
          iconName="chatbubbles"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
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
  chatItem: {
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
  },
  messageTime: {
    fontSize: 12,
  },
});

