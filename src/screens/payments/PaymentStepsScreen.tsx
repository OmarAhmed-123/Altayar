import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { API } from './../../services/apiClient';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { SuccessAnimation } from './../../components/common/SuccessAnimation';
// Mock data removed - using real backend data only
import { SafeIcon } from './../../utils/iconHelper';

interface PaymentStepsScreenProps {
  route?: {
    params?: {
      bookingId?: number;
      amount?: number;
      type?: 'booking' | 'membership';
    };
  };
}

export const PaymentStepsScreen: React.FC<PaymentStepsScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');

  const params = route.params as any;
  const bookingId = params?.bookingId;
  const packageId = params?.packageId;
  const packageData = params?.packageData;
  const amount = params?.amount || packageData?.price || 0;
  const paymentType = params?.type || 'booking';
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(bookingId || null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  useEffect(() => {
    if (step === 2 && transactionId) {
      // Start checking payment status periodically
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 3000); // Check every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [step, transactionId]);

  const handleCreateInvoice = async () => {
    // Validate amount - check if it's a valid number
    const validAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
    if (!validAmount || isNaN(validAmount) || validAmount <= 0) {
      Alert.alert('خطأ', 'المبلغ غير صحيح. يرجى التأكد من تحديد المبلغ بشكل صحيح.');
      return;
    }

    setIsLoading(true);
    try {
      let finalBookingId = createdBookingId || bookingId;
      const finalAmount = validAmount;

      // Use real backend API calls
      if (!finalBookingId && (packageId || packageData?.id) && packageData) {
        try {
          const packageIdToUse = packageId || packageData.id;
          let validPackageId: string;
          
          if (typeof packageIdToUse === 'number') {
            validPackageId = packageIdToUse.toString();
          } else if (typeof packageIdToUse === 'string') {
            validPackageId = packageIdToUse;
          } else {
            validPackageId = String(packageIdToUse || '');
          }
          
          if (!validPackageId || validPackageId === 'undefined' || validPackageId === 'null' || validPackageId === '') {
            Alert.alert('خطأ', 'معرف الباقة غير صحيح');
            setIsLoading(false);
            return;
          }

          const bookingResponse = await API.booking.createBooking({
            packageId: validPackageId,
            participants: 1,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + (packageData.days || 7) * 24 * 60 * 60 * 1000).toISOString(),
            totalPrice: finalAmount,
          });

          finalBookingId = bookingResponse.id || bookingResponse.data?.id;
          setCreatedBookingId(finalBookingId);
        } catch (error: any) {
          console.error('Error creating booking:', error);
          Alert.alert('خطأ', 'فشل في إنشاء الحجز: ' + (error.message || 'خطأ غير معروف'));
          setIsLoading(false);
          return;
        }
      }

      if (!finalBookingId) {
        Alert.alert('خطأ', 'لا يمكن إنشاء الفاتورة بدون رقم الحجز');
        setIsLoading(false);
        return;
      }

      // Create Fawaterak invoice with better error handling
      try {
        const response = await API.payment.createFawaterakInvoice({
          type: paymentType,
          itemId: finalBookingId,
          amount: finalAmount,
          currency: 'EGP',
          description: packageData ? `حجز باقة: ${packageData.title || packageData.name}` : `Payment for ${paymentType}`,
        });

        const data = response.data || response;
        
        if (data.success === false) {
          Alert.alert('خطأ', data.message || 'فشل إنشاء الفاتورة');
          setIsLoading(false);
          return;
        }

        if (data.invoice_url || data.invoiceUrl) {
          setPaymentUrl(data.invoice_url || data.invoiceUrl);
          setTransactionId(data.transaction_id || data.transactionId || data.id);
          setStep(2);
        } else {
          Alert.alert('خطأ', 'لم يتم الحصول على رابط الدفع');
        }
      } catch (invoiceError: any) {
        // Re-throw to be caught by outer catch block
        throw invoiceError;
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'فشل إنشاء الفاتورة';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'خطأ في السيرفر. يرجى المحاولة مرة أخرى';
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى';
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
        errorMessage = 'خطأ في الاتصال. يرجى التحقق من اتصال الإنترنت';
      }
      
      Alert.alert('خطأ', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPayment = () => {
    if (!paymentUrl) {
      Alert.alert('خطأ', 'رابط الدفع غير متوفر');
      return;
    }

    // Navigate to WebView screen instead of opening browser
    // PaymentWebView is now in Drawer Navigator, so we can navigate directly
    navigation.navigate('PaymentWebView' as never, {
      paymentUrl: paymentUrl,
      transactionId: transactionId,
      amount: amount,
      onPaymentSuccess: () => {
        setPaymentStatus('completed');
        setStep(4);
        setShowSuccessAnimation(true);
        setTimeout(() => {
          setShowSuccessAnimation(false);
        }, 3000);
      },
      onPaymentFailed: () => {
        setPaymentStatus('failed');
        Alert.alert('فشل', 'فشلت عملية الدفع. يرجى المحاولة مرة أخرى.');
      },
    });
    setStep(3);
  };

  const checkPaymentStatus = async () => {
    if (!transactionId) return;

    // Use real backend API call
    try {
      const response = await API.payment.checkFawaterakStatus(transactionId);
      const data = response.data || response;
      
      if (data.status === 'paid' || data.status === 'completed' || data.status === 'success') {
        setPaymentStatus('completed');
        setStep(4);
        setShowSuccessAnimation(true);
        setTimeout(() => {
          setShowSuccessAnimation(false);
        }, 3000);
      } else if (data.status === 'failed' || data.status === 'cancelled' || data.status === 'error') {
        setPaymentStatus('failed');
        Alert.alert('فشل', 'فشل عملية الدفع. يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.lg,
    },
    header: {
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    stepsContainer: {
      marginBottom: theme.spacing.xl,
    },
    stepCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 2,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    stepCardActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '15',
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    stepCardCompleted: {
      borderColor: theme.colors.success,
      backgroundColor: theme.colors.success + '15',
      shadowColor: theme.colors.success,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    stepNumber: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    stepNumberActive: {
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    stepNumberCompleted: {
      backgroundColor: theme.colors.success,
      shadowColor: theme.colors.success,
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    stepNumberText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    stepNumberTextActive: {
      color: '#FFFFFF',
    },
    stepTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    stepDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      lineHeight: 20,
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    infoLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    infoValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md + 6,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.md,
      flexDirection: 'row',
      shadowColor: theme.colors.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    buttonDisabled: {
      backgroundColor: theme.colors.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
      marginLeft: theme.spacing.sm,
      letterSpacing: 0.5,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.lg,
    },
    statusText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: theme.spacing.sm,
    },
    statusPending: {
      color: theme.colors.warning,
    },
    statusCompleted: {
      color: theme.colors.success,
    },
    statusFailed: {
      color: theme.colors.error,
    },
  });

  if (isLoading && step === 1) {
    return <LoadingSpinner text="جاري إنشاء الفاتورة..." />;
  }

  return (
    <View style={styles.container}>
      <SuccessAnimation
        visible={showSuccessAnimation}
        message="تمت العملية بنجاح!"
        onClose={() => setShowSuccessAnimation(false)}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>خطوات الدفع</Text>
          <Text style={styles.subtitle}>اتبع الخطوات التالية لإتمام عملية الدفع</Text>
        </View>

        <View style={styles.stepsContainer}>
          {/* Step 1 */}
          <View style={[styles.stepCard, step >= 1 && styles.stepCardActive, step > 1 && styles.stepCardCompleted]}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepNumber, step >= 1 && styles.stepNumberActive, step > 1 && styles.stepNumberCompleted]}>
                {step > 1 ? (
                  <SafeIcon name="check" size={24} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.stepNumberText, step >= 1 && styles.stepNumberTextActive]}>1</Text>
                )}
              </View>
              <Text style={styles.stepTitle}>إنشاء الفاتورة</Text>
            </View>
            <Text style={styles.stepDescription}>
              سيتم إنشاء فاتورة الدفع الخاصة بك عبر فواتيرك
            </Text>
            {step === 1 && (
              <TouchableOpacity style={styles.button} onPress={handleCreateInvoice} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <SafeIcon name="receipt" size={24} color="#FFFFFF" />
                    <Text style={styles.buttonText}>إنشاء الفاتورة</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Step 2 */}
          {step >= 2 && (
            <View style={[styles.stepCard, step >= 2 && styles.stepCardActive, step > 2 && styles.stepCardCompleted]}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepNumber, step >= 2 && styles.stepNumberActive, step > 2 && styles.stepNumberCompleted]}>
                  {step > 2 ? (
                    <SafeIcon name="check" size={24} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepNumberText, step >= 2 && styles.stepNumberTextActive]}>2</Text>
                  )}
                </View>
                <Text style={styles.stepTitle}>فتح صفحة الدفع</Text>
              </View>
              <Text style={styles.stepDescription}>
                سيتم فتح صفحة الدفع داخل التطبيق لإتمام عملية الدفع
              </Text>
              {step === 2 && (
                <TouchableOpacity style={styles.button} onPress={handleOpenPayment}>
                  <SafeIcon name="payment" size={24} color="#FFFFFF" />
                  <Text style={styles.buttonText}>فتح صفحة الدفع</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Step 3 */}
          {step >= 3 && step < 4 && (
            <View style={[styles.stepCard, styles.stepCardActive]}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepNumber, styles.stepNumberActive]}>
                  <Text style={styles.stepNumberTextActive}>3</Text>
                </View>
                <Text style={styles.stepTitle}>التحقق من الدفع</Text>
              </View>
              <Text style={styles.stepDescription}>
                جاري التحقق من حالة الدفع... يرجى الانتظار
              </Text>
              <View style={styles.statusContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.statusText, styles.statusPending]}>قيد المعالجة...</Text>
              </View>
            </View>
          )}

          {/* Step 4 - Success */}
          {step >= 4 && paymentStatus === 'completed' && (
            <View style={[styles.stepCard, styles.stepCardCompleted]}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepNumber, styles.stepNumberCompleted]}>
                  <SafeIcon name="check-circle" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.stepTitle}>تم الدفع بنجاح</Text>
              </View>
              <Text style={styles.stepDescription}>
                تم إتمام عملية الدفع بنجاح. سيتم تأكيد حجزك تلقائياً.
              </Text>
              <View style={styles.statusContainer}>
                <SafeIcon name="check-circle" size={24} color={theme.colors.success} />
                <Text style={[styles.statusText, styles.statusCompleted]}>تم الدفع بنجاح</Text>
              </View>
              <TouchableOpacity 
                style={styles.button} 
                onPress={() => {
                  (navigation as any).navigate('Bookings');
                }}
              >
                <SafeIcon name="book" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>عرض الحجوزات</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 4 - Failed */}
          {step >= 4 && paymentStatus === 'failed' && (
            <View style={[styles.stepCard, { borderColor: theme.colors.error }]}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepNumber, { backgroundColor: theme.colors.error }]}>
                  <SafeIcon name="error" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.stepTitle}>فشل الدفع</Text>
              </View>
              <Text style={styles.stepDescription}>
                فشلت عملية الدفع. يرجى المحاولة مرة أخرى.
              </Text>
              <View style={styles.statusContainer}>
                <SafeIcon name="error" size={24} color={theme.colors.error} />
                <Text style={[styles.statusText, styles.statusFailed]}>فشل الدفع</Text>
              </View>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.colors.error }]} 
                onPress={() => {
                  setStep(1);
                  setPaymentStatus('pending');
                  setPaymentUrl('');
                  setTransactionId(null);
                }}
              >
                <SafeIcon name="refresh" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>إعادة المحاولة</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {step >= 2 && (
          <View style={styles.infoCard}>
            <Text style={[styles.stepTitle, { marginBottom: theme.spacing.md }]}>معلومات الدفع</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>المبلغ:</Text>
              <Text style={styles.infoValue}>
                {typeof amount === 'number' ? amount.toLocaleString() : parseFloat(String(amount || 0)).toLocaleString()} EGP
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>رقم المعاملة:</Text>
              <Text style={styles.infoValue}>{transactionId || 'قيد الإنشاء'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>طريقة الدفع:</Text>
              <Text style={styles.infoValue}>فواتيرك</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

