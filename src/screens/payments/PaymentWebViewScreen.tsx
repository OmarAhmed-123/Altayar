import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { API } from './../../services/apiClient';
import { SafeIcon } from './../../utils/iconHelper';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';

interface PaymentWebViewScreenProps {
  route?: {
    params?: {
      paymentUrl: string;
      transactionId: number | null;
      amount?: number;
      onPaymentSuccess?: () => void;
      onPaymentFailed?: () => void;
    };
  };
}

export const PaymentWebViewScreen: React.FC<PaymentWebViewScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const webViewRef = useRef<WebView>(null);
  
  const params = route.params as any;
  const paymentUrl = params?.paymentUrl || '';
  const transactionId = params?.transactionId || null;
  const amount = params?.amount || 0;
  const onPaymentSuccess = params?.onPaymentSuccess;
  const onPaymentFailed = params?.onPaymentFailed;

  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(paymentUrl);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // Check payment status periodically
  useEffect(() => {
    if (!transactionId) return;

    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [transactionId]);

  const checkPaymentStatus = async () => {
    if (!transactionId || isCheckingPayment) return;

    try {
      setIsCheckingPayment(true);
      const response = await API.payment.checkFawaterakStatus(transactionId);
      const data = response.data || response;
      
      if (data.status === 'paid' || data.status === 'completed' || data.status === 'success') {
        setIsCheckingPayment(false);
        handlePaymentSuccess();
      } else if (data.status === 'failed' || data.status === 'cancelled' || data.status === 'error') {
        setIsCheckingPayment(false);
        handlePaymentFailed();
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setIsCheckingPayment(false);
    }
  };

  const handlePaymentSuccess = () => {
    Alert.alert(
      'نجح الدفع',
      'تم إتمام عملية الدفع بنجاح. سيتم تأكيد حجزك تلقائياً.',
      [
        {
          text: 'موافق',
          onPress: () => {
            if (onPaymentSuccess) {
              onPaymentSuccess();
            }
            navigation.goBack();
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handlePaymentFailed = () => {
    Alert.alert(
      'فشل الدفع',
      'فشلت عملية الدفع. يرجى المحاولة مرة أخرى.',
      [
        {
          text: 'إعادة المحاولة',
          onPress: () => {
            // Reload the payment page
            if (webViewRef.current) {
              webViewRef.current.reload();
            }
          },
        },
        {
          text: 'إلغاء',
          style: 'cancel',
          onPress: () => {
            if (onPaymentFailed) {
              onPaymentFailed();
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    
    // Check if payment was successful based on URL
    const url = navState.url.toLowerCase();
    if (url.includes('success') || url.includes('paid') || url.includes('completed')) {
      // Payment might be successful, check status
      if (transactionId) {
        checkPaymentStatus();
      }
    } else if (url.includes('failed') || url.includes('cancel') || url.includes('error')) {
      // Payment might have failed
      handlePaymentFailed();
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'payment_success') {
        handlePaymentSuccess();
      } else if (data.type === 'payment_failed') {
        handlePaymentFailed();
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handleGoBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      navigation.goBack();
    }
  };

  const handleGoForward = () => {
    if (canGoForward && webViewRef.current) {
      webViewRef.current.goForward();
    }
  };

  const handleReload = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleClose = () => {
    Alert.alert(
      'إغلاق صفحة الدفع',
      'هل أنت متأكد من إغلاق صفحة الدفع؟ قد تفقد تقدمك في عملية الدفع.',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'إغلاق',
          style: 'destructive',
          onPress: () => {
            if (onPaymentFailed) {
              onPaymentFailed();
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
      paddingBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginLeft: theme.spacing.md,
      flex: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      padding: theme.spacing.sm,
      marginLeft: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.primary + '15',
    },
    headerButtonDisabled: {
      opacity: 0.3,
    },
    webViewContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    footer: {
      backgroundColor: theme.colors.surface,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    footerInfo: {
      flex: 1,
    },
    footerInfoText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    footerInfoAmount: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    footerButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
    },
    footerButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: theme.spacing.xs,
    },
    statusIndicator: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight! + 50,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.info + '20',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    statusIndicatorText: {
      fontSize: 12,
      color: theme.colors.info,
      fontWeight: '600',
      marginLeft: theme.spacing.xs,
    },
  });

  if (!paymentUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <SafeIcon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>صفحة الدفع</Text>
        </View>
        <View style={styles.loadingContainer}>
          <SafeIcon name="error" size={64} color={theme.colors.error} />
          <Text style={[styles.loadingText, { color: theme.colors.error, marginTop: theme.spacing.lg }]}>
            رابط الدفع غير متوفر
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.colors.surface}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <SafeIcon name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>صفحة الدفع</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={[styles.headerButton, !canGoBack && styles.headerButtonDisabled]}
            disabled={!canGoBack}
          >
            <SafeIcon name="arrow-back" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGoForward}
            style={[styles.headerButton, !canGoForward && styles.headerButtonDisabled]}
            disabled={!canGoForward}
          >
            <SafeIcon name="arrow-forward" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReload} style={styles.headerButton}>
            <SafeIcon name="refresh" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Indicator */}
      {isCheckingPayment && (
        <View style={styles.statusIndicator}>
          <ActivityIndicator size="small" color={theme.colors.info} />
          <Text style={styles.statusIndicatorText}>جاري التحقق من حالة الدفع...</Text>
        </View>
      )}

      {/* WebView */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error: ', nativeEvent);
            Alert.alert(
              'خطأ في تحميل الصفحة',
              'حدث خطأ أثناء تحميل صفحة الدفع. يرجى المحاولة مرة أخرى.',
              [
                {
                  text: 'إعادة المحاولة',
                  onPress: handleReload,
                },
                {
                  text: 'إلغاء',
                  style: 'cancel',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // Security settings
          originWhitelist={['*']}
          // User agent for better compatibility
          userAgent={Platform.select({
            ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
            android: 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
          })}
        />
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>جاري تحميل صفحة الدفع...</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerInfoText}>المبلغ المطلوب</Text>
          <Text style={styles.footerInfoAmount}>
            {typeof amount === 'number' ? amount.toLocaleString() : parseFloat(String(amount || 0)).toLocaleString()} EGP
          </Text>
        </View>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => {
            if (transactionId) {
              checkPaymentStatus();
            }
          }}
          disabled={isCheckingPayment}
        >
          {isCheckingPayment ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <SafeIcon name="check-circle" size={18} color="#FFFFFF" />
              <Text style={styles.footerButtonText}>التحقق من الدفع</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

