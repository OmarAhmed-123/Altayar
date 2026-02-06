import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { chatService } from '../../services/chatService';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SafeIcon } from '../../utils/iconHelper';
import Toast from 'react-native-toast-message';

export const ChatScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuthStore();
  const { chatId, userId } = route.params as any;
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const accessChat = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await chatService.accessChat(userId);
      const chatData = response.data || response;
      const nav = navigation as any;
      nav.replace('Chat', { chatId: chatData.id });
    } catch (error: any) {
      console.error('Error accessing chat:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل في الوصول للمحادثة',
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigation, userId]);

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await chatService.allMessages(chatId);
      const messagesData = Array.isArray(response) ? response : (response.data || []);
      setMessages(messagesData);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل تحميل الرسائل',
      });
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    if (chatId) {
      loadMessages();
    } else if (userId) {
      accessChat();
    }
  }, [chatId, userId, loadMessages, accessChat]);

  const sendMessage = async () => {
    if (!messageText.trim() || !chatId) return;

    try {
      await chatService.sendMessage({
        chatId,
        content: messageText,
      });
      setMessageText('');
      loadMessages();
    } catch (error: any) {
      console.error('Error sending message:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل إرسال الرسالة',
      });
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    // Backend returns sender as nested object with id
    const senderId = item.sender?.id || item.sender_id || item.senderId;
    const currentUserId = user?.id;
    const isMyMessage = currentUserId != null && senderId === currentUserId;
    const messageBackgroundStyle = isMyMessage ? styles.myMessageBackground : styles.otherMessageBackground;
    const messageTextColorStyle = isMyMessage ? styles.myMessageText : styles.otherMessageText;
    const messageTimeColorStyle = isMyMessage ? styles.myMessageTime : styles.otherMessageTime;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage,
          messageBackgroundStyle,
        ]}
      >
        <Text style={[styles.messageText, messageTextColorStyle]}>
          {item.content}
        </Text>
        <Text style={[styles.messageTime, messageTimeColorStyle]}>
          {item.created_at ? new Date(item.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="اكتب رسالة..."
          placeholderTextColor={theme.colors.textSecondary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
          onPress={sendMessage}
        >
          <SafeIcon name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    messagesList: {
      padding: 16,
    },
    messageContainer: {
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      maxWidth: '80%',
    },
    myMessage: {
      alignSelf: 'flex-end',
    },
    otherMessage: {
      alignSelf: 'flex-start',
    },
    messageText: {
      fontSize: 16,
      marginBottom: 4,
    },
    messageTime: {
      fontSize: 12,
      alignSelf: 'flex-end',
    },
    myMessageBackground: {
      backgroundColor: theme.colors.primary,
    },
    otherMessageBackground: {
      backgroundColor: theme.colors.surface,
    },
    myMessageText: {
      color: '#FFFFFF',
    },
    otherMessageText: {
      color: theme.colors.text,
    },
    myMessageTime: {
      color: 'rgba(255,255,255,0.7)',
    },
    otherMessageTime: {
      color: theme.colors.textSecondary,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 12,
      borderTopWidth: 1,
      alignItems: 'flex-end',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
      maxHeight: 100,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

