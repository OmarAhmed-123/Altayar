/**
 * Live Chat Widget - AI-Powered Support Chat
 * Features:
 * - Starts with AI Bot (Gemini) automatically
 * - Quick Questions buttons
 * - Automatic ticket creation when bot can't answer
 * - Modern, attractive design
 * - Real-time communication via Socket.IO
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { chatService } from '../../services/chatService';
import { socketService } from '../../services/socketService';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { SafeIcon } from '../../utils/iconHelper';
import Toast from 'react-native-toast-message';
import { buildImageUrl } from '../../utils/imageUrlBuilder';
import { FastImage } from '../common/FastImage';
import { API } from '../../services/apiClient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CHAT_WIDTH = SCREEN_WIDTH * 0.95;
const CHAT_HEIGHT = SCREEN_HEIGHT * 0.8;
const MINIMIZED_HEIGHT = 60;

interface Message {
  id: number;
  content: string;
  sender_id?: number;
  sender?: { id: number; name: string; email?: string; profile_picture_url?: string };
  created_at: string;
  isRead?: boolean;
  read_by?: number[] | string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  chat_id?: number;
  couldNotAnswer?: boolean;
}

interface Chat {
  id: number;
  user?: { name: string; id: number };
  participants?: Array<{ id: number; name: string; email: string; profile_picture_url?: string }>;
  latestMessage?: { content: string; created_at: string };
  unread_count?: number;
}

// Quick Questions
const BOT_EMAIL = 'bot@altayar.com';

const QUICK_QUESTIONS = [
  { id: 1, question: 'ما هي أنواع العضويات المتاحة؟', icon: 'star' },
  { id: 2, question: 'كيف أحصل على النقاط؟', icon: 'card-giftcard' },
  { id: 3, question: 'ما هو الكاش باك؟', icon: 'account-balance-wallet' },
  { id: 4, question: 'كيف أقوم بالحجز؟', icon: 'event' },
  { id: 5, question: 'ما هي طرق الدفع المتاحة؟', icon: 'payment' },
  { id: 6, question: 'كيف أستخدم القسائم؟', icon: 'confirmation-number' },
];

const normalizeChatPayload = (payload: any): Chat | null => {
  if (!payload) {
    return null;
  }

  if (payload.chat && payload.chat.id) {
    return payload.chat as Chat;
  }

  if (payload.data) {
    if (payload.data.chat && payload.data.chat.id) {
      return payload.data.chat as Chat;
    }
    if (!Array.isArray(payload.data) && payload.data.id) {
      return payload.data as Chat;
    }
  }

  if (payload.id) {
    return payload as Chat;
  }

  return null;
};

const extractBotInfo = (payload: any) => {
  const data = payload?.data || payload;
  if (!data) {
    return null;
  }
  if (data.bot_user) {
    return data.bot_user;
  }
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    profile_picture_url: data.profile_picture_url,
    role: data.role,
    last_seen: data.last_seen,
  };
};

const getBotIdFromInfoEndpoint = async (): Promise<number | null> => {
  if (typeof chatService.getBotInfo !== 'function') {
    return null;
  }
  try {
    const response = await chatService.getBotInfo();
    const info = extractBotInfo(response);
    return info?.id || null;
  } catch (error) {
    console.error('[Chat] Bot info endpoint failed:', error);
    return null;
  }
};

const getBotIdFromUsersEndpoint = async (): Promise<number | null> => {
  try {
    const users = await chatService.getAllUsersForChat();
    const usersData = Array.isArray(users) ? users : (users?.data || []);
    const botUser = usersData.find((u: any) => {
      const email = (u.email || '').trim().toLowerCase();
      const name = (u.name || '').trim();
      return email === BOT_EMAIL.toLowerCase() || name === 'دعم الطيار VIP';
    });
    return botUser?.id || null;
  } catch (error) {
    console.error('[Chat] Legacy users endpoint failed:', error);
    return null;
  }
};

const startBotChatViaEndpoint = async (): Promise<Chat | null> => {
  if (typeof chatService.startBotChat !== 'function') {
    return null;
  }

  try {
    const response = await chatService.startBotChat();
    return normalizeChatPayload(response);
  } catch (error: any) {
    if (__DEV__) {
      console.warn('[Chat] startBotChat endpoint failed:', error?.response?.data || error?.message);
    }
    return null;
  }
};

const startBotChatLegacy = async (): Promise<Chat | null> => {
  try {
    let botId = await getBotIdFromInfoEndpoint();

    if (!botId) {
      botId = await getBotIdFromUsersEndpoint();
    }

    if (!botId) {
      return null;
    }

    const response = await chatService.accessChat(botId);
    return normalizeChatPayload(response);
  } catch (error) {
    console.error('[Chat] Legacy bot chat fallback failed:', error);
    return null;
  }
};

export const LiveChatWidget: React.FC = () => {
  const { theme } = useTheme();
  const { user, token } = useAuthStore();
  const userId = user?.id;
  const themeStyles = useMemo(
    () =>
      StyleSheet.create({
        emptySubtext: {
          color: theme.colors.textSecondary,
        },
      }),
    [theme.colors.textSecondary],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTicketButton, setShowTicketButton] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [botChatId, setBotChatId] = useState<number | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const messagesEndRef = useRef<FlatList>(null);
  const botInitAttemptsRef = useRef(0);
  const MAX_BOT_INIT_ATTEMPTS = 3;
  const isAuthReady = Boolean(user?.id && token);

  // Normalizes API responses that might return data inside { data }
  const normalizeResponse = useCallback(<T,>(response: T | { data?: T }): T => {
    if (response && typeof response === 'object' && 'data' in (response as any) && (response as any).data !== undefined) {
      return (response as any).data as T;
    }
    return response as T;
  }, []);

  const loadMessages = useCallback(async (chatId: number) => {
    try {
      const response = await chatService.allMessages(chatId);
      const messagesData = Array.isArray(response) ? response : (response.data || []);
      
      const parsedMessages = messagesData.map((msg: any) => {
        let readBy = msg.read_by;
        if (typeof readBy === 'string') {
          try {
            readBy = JSON.parse(readBy);
          } catch {
            readBy = [];
          }
        }
        const currentUserId = userId;
        const isRead = Array.isArray(readBy) 
          ? (readBy.includes(currentUserId) || msg.sender_id === currentUserId)
          : (msg.sender_id === currentUserId);
        
        return {
          ...msg,
          read_by: readBy,
          isRead,
        };
      });
      
      setMessages(parsedMessages);
      
      // Mark messages as read
      if (parsedMessages.length > 0) {
        try {
          await chatService.markMessagesAsRead(chatId);
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }
    } catch (error: any) {
      console.error('Error loading chat messages:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل تحميل الرسائل',
      });
    }
  }, [userId]);

  const initializeBotChat = useCallback(async (): Promise<Chat | null> => {
    if (!isAuthReady) {
      return null;
    }

    try {
      setIsLoading(true);
      setInitializationError(null);
      botInitAttemptsRef.current += 1;

      let chatData = await startBotChatViaEndpoint();
      if (!chatData) {
        chatData = await startBotChatLegacy();
      }

      if (!chatData?.id) {
        throw new Error('لم يتم العثور على البوت حالياً، يرجى المحاولة لاحقاً');
      }

      setSelectedChat(chatData);
      setBotChatId(chatData.id);
      botInitAttemptsRef.current = 0;
      await loadMessages(chatData.id);
      return chatData;
    } catch (error: any) {
      const friendlyMessage =
        error?.response?.data?.message ||
        error?.message ||
        'فشل في تهيئة الشات. يرجى المحاولة مجدداً.';

      console.error('Error initializing bot chat:', friendlyMessage);
      setInitializationError(friendlyMessage);

      Toast.show({
        type: 'error',
        text1: 'تعذر فتح الشات',
        text2: friendlyMessage,
      });

      if (botInitAttemptsRef.current < MAX_BOT_INIT_ATTEMPTS) {
        setTimeout(() => {
          if (isOpen && !selectedChat && isAuthReady) {
            initializeBotChat();
          }
        }, 1200);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthReady, isOpen, loadMessages, selectedChat]);

  // Pulse animation for button
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [scaleAnim]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (user?.id && user?.name) {
      socketService.connect(user.id, user.name).catch(error => {
        console.error('[Chat] Socket connection failed:', error);
      });
    }

    // Socket event listeners
    socketService.on('message received', (newMessage: any) => {
      const messageChatId = newMessage.chat_id || newMessage.chat?.id;
      if (selectedChat && messageChatId === selectedChat.id) {
        setMessages(prev => {
          if (prev.some(msg => msg.id === newMessage.id)) {
            return prev;
          }
          const updated = [...prev, newMessage as Message];
          
          // Check if bot couldn't answer
          if (newMessage.couldNotAnswer || newMessage.sender?.email === BOT_EMAIL) {
            const botResponse = newMessage.content || '';
            if (botResponse.includes('لا أستطيع') || 
                botResponse.includes('لم أستطع') || 
                botResponse.includes('تذكرة') ||
                botResponse.includes('موظف')) {
              setShowTicketButton(true);
              setShowQuickQuestions(false);
            }
          }
          
          return updated;
        });
        
        // Mark as read
        if (newMessage.sender_id !== user?.id && newMessage.sender?.id !== user?.id) {
          chatService.markMessagesAsRead(selectedChat.id).catch(err => {
            console.error('Error marking messages as read:', err);
          });
        }
      }
    });

    return () => {
      socketService.off('message received');
      socketService.off('notification');
    };
  }, [user, selectedChat]);

  // Initialize bot chat when opened
  useEffect(() => {
    if (isOpen && !selectedChat && isAuthReady) {
      initializeBotChat();
    }
  }, [isOpen, selectedChat, isAuthReady, initializeBotChat]);

  useEffect(() => {
    if (!isOpen) {
      botInitAttemptsRef.current = 0;
      setInitializationError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Load messages when chat selected
  useEffect(() => {
    if (selectedChat?.id) {
      loadMessages(selectedChat.id);
      socketService.joinChat(selectedChat.id);

      return () => {
        socketService.leaveChat(selectedChat.id);
      };
    }
  }, [selectedChat, loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const shouldShowQuickQuestions =
    Boolean(selectedChat?.id) &&
    showQuickQuestions &&
    (
      messages.length === 0 ||
      (messages.length === 1 && (
        messages[0].sender?.email === BOT_EMAIL ||
        messages[0].sender?.name === 'دعم الطيار VIP'
      ))
    );
  const isSendEnabled = messageText.trim().length > 0;

  const handleRetryBotInitialization = () => {
    botInitAttemptsRef.current = 0;
    setInitializationError(null);
    initializeBotChat();
  };

  const sendMessage = async (file?: { uri: string; type: string; name: string }, quickQuestion?: string) => {
    const content = quickQuestion || messageText.trim();
    if (!content && !file) {
      return;
    }

    let activeChat = selectedChat;
    if (!activeChat) {
      activeChat = await initializeBotChat();
      if (!activeChat?.id) {
        Toast.show({
          type: 'error',
          text1: 'تعذر إرسال الرسالة',
          text2: 'يرجى إعادة فتح الشات والمحاولة مجدداً',
        });
        return;
      }
    }

    const chatId = activeChat.id;

    try {
      setUploadingFile(Boolean(file));
      setShowQuickQuestions(false);

      await chatService.sendMessage({
        chatId,
        content,
        file,
      });

      setMessageText('');

      setTimeout(() => {
        loadMessages(chatId);
      }, 800);

      if (content && !file && botChatId === chatId) {
        setTimeout(async () => {
          try {
            const botResponse = await chatService.sendGeminiBotMessage(chatId, content);
            const botPayload = normalizeResponse(botResponse);
            if (botPayload?.supportEscalationCreated) {
              setShowTicketButton(false);
              setShowQuickQuestions(false);
              Toast.show({
                type: 'success',
                text1: 'تم تحويل طلبك',
                text2: `تم إنشاء رمز تذكرة ${botPayload.supportTicket?.ticket_number || ''} والتواصل مع موظفينا`,
              });
            } else if (botPayload?.couldNotAnswer) {
              setShowTicketButton(true);
              setShowQuickQuestions(false);
            }
            setTimeout(() => loadMessages(chatId), 1000);
          } catch (botError) {
            console.error('Error sending to Gemini bot:', botError);
            setTimeout(() => loadMessages(chatId), 1000);
          }
        }, 400);
      }
    } catch (error: any) {
      console.error('[Chat] sendMessage error:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل إرسال الرسالة',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(undefined, question);
  };

  const handleCreateSupportTicket = async () => {
    if (!selectedChat) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يجب فتح محادثة أولاً',
      });
      return;
    }

    Alert.alert(
      'إنشاء تذكرة دعم فني',
      'سيتم إنشاء تذكرة دعم فني وسيقوم أحد موظفينا بالرد عليك قريباً.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إنشاء',
          onPress: async () => {
            try {
              setIsLoading(true);
              await API.supportTicket.createTicketFromChat({
                chatId: selectedChat.id,
                subject: 'طلب دعم فني من الشات',
                description: `تم إنشاء التذكرة من محادثة مع البوت.\n\nآخر رسالة: ${messages[messages.length - 1]?.content || 'لا توجد رسائل'}`,
                priority: 'medium',
              });
              
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم إنشاء التذكرة بنجاح',
              });
              
              setShowTicketButton(false);
            } catch (error: any) {
              console.error('Failed to create support ticket from chat:', error);
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: 'فشل إنشاء التذكرة',
              });
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleImagePicker = () => {
    Alert.alert(
      'اختر صورة',
      'من أين تريد اختيار الصورة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'الكاميرا',
          onPress: () => {
            launchCamera(
              {
                mediaType: 'photo' as MediaType,
                quality: 0.8,
                maxWidth: 1920,
                maxHeight: 1920,
              },
              (response: ImagePickerResponse) => {
                if (response.assets && response.assets[0]) {
                  const asset = response.assets[0];
                  sendMessage({
                    uri: asset.uri || '',
                    type: asset.type || 'image/jpeg',
                    name: asset.fileName || `image_${Date.now()}.jpg`,
                  });
                }
              }
            );
          },
        },
        {
          text: 'المعرض',
          onPress: () => {
            launchImageLibrary(
              {
                mediaType: 'photo' as MediaType,
                quality: 0.8,
                maxWidth: 1920,
                maxHeight: 1920,
              },
              (response: ImagePickerResponse) => {
                if (response.assets && response.assets[0]) {
                  const asset = response.assets[0];
                  sendMessage({
                    uri: asset.uri || '',
                    type: asset.type || 'image/jpeg',
                    name: asset.fileName || `image_${Date.now()}.jpg`,
                  });
                }
              }
            );
          },
        },
      ]
    );
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setInitializationError(null);
    botInitAttemptsRef.current = 0;
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false);
      setIsMinimized(false);
      setSelectedChat(null);
      setMessages([]);
      setShowTicketButton(false);
      setShowQuickQuestions(true);
      setInitializationError(null);
      botInitAttemptsRef.current = 0;
    });
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const senderId = item.sender?.id || item.sender_id;
    const currentUserId = user?.id;
    const isMyMessage = currentUserId != null && senderId === currentUserId;
    const isBotMessage = item.sender?.email === BOT_EMAIL || item.sender?.name === 'دعم الطيار VIP';
    const hasAttachment = !!item.attachment_url;
    const avatarBackgroundStyle = isBotMessage ? styles.botAvatarBackground : styles.userAvatarBackground;
    const bubbleBackgroundStyle = isMyMessage
      ? styles.myMessageBackground
      : isBotMessage
        ? styles.botMessageBackground
        : styles.userMessageBackground;
    const messageTextColorStyle = isMyMessage ? styles.messageTextLight : styles.messageTextDark;
    const messageTimeColorStyle = isMyMessage ? styles.messageTimeLight : styles.messageTimeDark;
    const fileNameColorStyle = isMyMessage ? styles.fileNameLight : styles.fileNameDark;

    return (
      <View
        style={[
          styles.messageWrapper,
          isMyMessage ? styles.myMessageWrapper : styles.otherMessageWrapper,
        ]}
      >
        {!isMyMessage && item.sender && (
          <View style={styles.senderAvatar}>
            {item.sender.profile_picture_url ? (
              <FastImage
                source={buildImageUrl(item.sender.profile_picture_url) || ''}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, avatarBackgroundStyle]}>
                <Text style={styles.avatarText}>
                  {isBotMessage ? '🤖' : (item.sender.name?.charAt(0)?.toUpperCase() || 'U')}
                </Text>
              </View>
            )}
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessage : styles.otherMessage,
            bubbleBackgroundStyle,
          ]}
        >
          {!isMyMessage && (
            <Text style={styles.senderName}>
              {item.sender?.name || 'مستخدم'}
            </Text>
          )}
          {hasAttachment && item.attachment_url && (
            <View style={styles.attachmentContainer}>
              {item.attachment_type?.startsWith('image/') ? (
                <FastImage
                  source={buildImageUrl(item.attachment_url) || ''}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.fileAttachment}>
                  <SafeIcon name="insert-drive-file" size={24} color={isMyMessage ? '#fff' : '#2265c3'} />
                  <Text style={[styles.fileName, fileNameColorStyle]} numberOfLines={1}>
                    {item.attachment_name || 'ملف'}
                  </Text>
                </View>
              )}
            </View>
          )}
          {item.content && (
            <Text style={[styles.messageText, messageTextColorStyle]}>
              {item.content}
            </Text>
          )}
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, messageTimeColorStyle]}>
              {item.created_at ? new Date(item.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderQuickQuestion = ({ item }: { item: typeof QUICK_QUESTIONS[0] }) => (
    <TouchableOpacity
      style={styles.quickQuestionButton}
      onPress={() => handleQuickQuestion(item.question)}
      activeOpacity={0.7}
    >
      <SafeIcon name={item.icon} size={18} color="#2265c3" />
      <Text style={styles.quickQuestionText} numberOfLines={2}>
        {item.question}
      </Text>
    </TouchableOpacity>
  );

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CHAT_HEIGHT, 0],
  });

  return (
    <>
      {/* Floating Button */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.chatButton}
          onPress={handleOpen}
          activeOpacity={0.8}
        >
          <SafeIcon name="chatbubbles" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.chatContainer,
              {
                width: CHAT_WIDTH,
                height: isMinimized ? MINIMIZED_HEIGHT : CHAT_HEIGHT,
                opacity: opacityAnim,
                transform: [{ translateY }],
              },
            ]}
          >
            {isMinimized ? (
              // Minimized View
              <View style={styles.minimizedHeader}>
                <View style={styles.minimizedContent}>
                  <SafeIcon name="chatbubbles" size={20} color="#fff" />
                  <Text style={styles.minimizedText} numberOfLines={1}>
                    دعم الطيار VIP
                  </Text>
                </View>
                <View style={styles.minimizedActions}>
                  <TouchableOpacity onPress={handleMaximize} style={styles.minimizedButton}>
                    <SafeIcon name="expand-less" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleClose} style={styles.minimizedButton}>
                    <SafeIcon name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Full Chat View
              <View style={styles.chatWindow}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>
                      دعم الطيار VIP
                    </Text>
                    <Text style={styles.headerSubtitle}>
                      مساعد ذكي لمساعدتك
                    </Text>
                  </View>
                  <View style={styles.headerActions}>
                    <TouchableOpacity onPress={handleMinimize} style={styles.headerButton}>
                      <SafeIcon name="expand-more" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
                      <SafeIcon name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Content */}
                <KeyboardAvoidingView
                  style={styles.content}
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                  {isLoading && !selectedChat ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#2265c3" />
                      <Text style={styles.loadingText}>جاري التحميل...</Text>
                    </View>
                  ) : selectedChat ? (
                    <>
                      {/* Quick Questions */}
                      {shouldShowQuickQuestions && (
                        <View style={styles.quickQuestionsContainer}>
                          <Text style={styles.quickQuestionsTitle}>أسئلة سريعة</Text>
                          <FlatList
                            data={QUICK_QUESTIONS}
                            renderItem={renderQuickQuestion}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={2}
                            scrollEnabled={false}
                            contentContainerStyle={styles.quickQuestionsList}
                          />
                        </View>
                      )}

                      {/* Messages */}
                      <FlatList
                        ref={messagesEndRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                        contentContainerStyle={styles.messagesList}
                        inverted={false}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                          !shouldShowQuickQuestions ? (
                            <View style={styles.emptyState}>
                              <Text style={styles.emptyText}>في انتظار رد مساعد الطيار...</Text>
                              <Text style={[styles.emptySubtext, themeStyles.emptySubtext]}>
                                يتم تحليل سؤالك الآن وسيصلك الرد خلال ثوانٍ
                              </Text>
                            </View>
                          ) : null
                        }
                      />

                      {/* Ticket Button */}
                      {showTicketButton && (
                        <View style={styles.ticketButtonContainer}>
                          <TouchableOpacity
                            style={styles.ticketButton}
                            onPress={handleCreateSupportTicket}
                          >
                            <SafeIcon name="support-agent" size={20} color="#fff" />
                            <Text style={styles.ticketButtonText}>
                              التحدث مع موظف
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Input Container */}
                      <View style={styles.inputContainer}>
                        <TouchableOpacity
                          style={styles.attachmentButton}
                          onPress={handleImagePicker}
                        >
                          <SafeIcon name="attach-file" size={24} color="#2265c3" />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.input}
                          placeholder="اكتب رسالتك..."
                          placeholderTextColor="#999"
                          value={messageText}
                          onChangeText={setMessageText}
                          multiline
                          maxLength={1000}
                        />
                        {uploadingFile ? (
                          <ActivityIndicator size="small" color="#2265c3" style={styles.sendButtonBase} />
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.sendButtonBase,
                              isSendEnabled ? styles.sendButtonActive : styles.sendButtonDisabled,
                            ]}
                            onPress={() => sendMessage()}
                            disabled={!isSendEnabled}
                          >
                            <SafeIcon name="send" size={20} color="#fff" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </>
                  ) : initializationError ? (
                    <View style={styles.loadingContainer}>
                      <SafeIcon name="error-outline" size={48} color="#ff6b35" />
                      <Text style={[styles.loadingText, styles.loadingTextCentered]}>
                        {initializationError}
                      </Text>
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={handleRetryBotInitialization}
                        disabled={isLoading}
                      >
                        <SafeIcon name="refresh" size={18} color="#fff" />
                        <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#2265c3" />
                      <Text style={styles.loadingText}>جاري تهيئة الشات...</Text>
                    </View>
                  )}
                </KeyboardAvoidingView>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  chatButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#2265c3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    backgroundColor: '#2265c3',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  chatContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  minimizedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: MINIMIZED_HEIGHT,
    backgroundColor: '#2265c3',
  },
  minimizedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  minimizedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  minimizedActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimizedButton: {
    padding: 8,
    marginLeft: 8,
  },
  chatWindow: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
    backgroundColor: '#2265c3',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#2265c3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickQuestionsContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2265c3',
    marginBottom: 12,
  },
  quickQuestionsList: {
    gap: 8,
  },
  quickQuestionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  quickQuestionText: {
    flex: 1,
    fontSize: 13,
    color: '#2265c3',
    fontWeight: '500',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  otherMessageWrapper: {
    justifyContent: 'flex-start',
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botAvatarBackground: {
    backgroundColor: '#19b6e8',
  },
  userAvatarBackground: {
    backgroundColor: '#2265c3',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  myMessage: {
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    borderBottomLeftRadius: 4,
  },
  myMessageBackground: {
    backgroundColor: '#2265c3',
  },
  botMessageBackground: {
    backgroundColor: '#f0f8ff',
  },
  userMessageBackground: {
    backgroundColor: '#f0f0f0',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextLight: {
    color: '#fff',
  },
  messageTextDark: {
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  messageTimeLight: {
    color: 'rgba(255,255,255,0.7)',
  },
  messageTimeDark: {
    color: '#666',
  },
  attachmentContainer: {
    marginBottom: 8,
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    gap: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
  },
  fileNameLight: {
    color: '#fff',
  },
  fileNameDark: {
    color: '#000',
  },
  ticketButtonContainer: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  ticketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    backgroundColor: '#19b6e8',
  },
  ticketButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  attachmentButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#000',
    borderColor: '#ddd',
  },
  sendButtonBase: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#2265c3',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
  },
  loadingTextCentered: {
    textAlign: 'center',
  },
});
