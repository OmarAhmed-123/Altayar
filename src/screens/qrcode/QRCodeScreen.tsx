import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { useAuthStore } from './../../stores/authStore';
import { getExpressiveImage } from './../../services/expressiveImageService';
import { ensureStringUri } from './../../utils/imageUriHelper';
import { SafeIcon } from './../../utils/iconHelper';

export const QRCodeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [membershipNumber, setMembershipNumber] = useState<string>('ALT-2024-001');

  useEffect(() => {
    loadQRCode();
  }, []);

  // Reload QR code when user changes
  useEffect(() => {
    if (user) {
      loadQRCode();
    }
  }, [user]);

  const loadQRCode = async () => {
    try {
      // Generate QR code data as JSON string
      const qrData = {
        userId: user?.id || 1,
        membershipNumber: membershipNumber,
        name: user?.name || 'عمر سيف الدين',
        email: user?.email || 'omar@example.com',
      };
      
      // Store QR data as string for QRCode component
      const qrDataString = JSON.stringify(qrData);
      setQrCodeImage(qrDataString);
    } catch (error) {
      console.error('Error loading QR code:', error);
      // Fallback: create simple QR data
      const fallbackData = JSON.stringify({
        userId: user?.id || 1,
        membershipNumber: membershipNumber,
      });
      setQrCodeImage(fallbackData);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `عضويتي في ALTAYARVIP\nرقم العضوية: ${membershipNumber}\nQR Code: ${qrCodeImage}`,
        title: 'ALTAYARVIP Membership',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopy = () => {
    Clipboard.setString(membershipNumber);
    Alert.alert('تم النسخ', 'تم نسخ رقم العضوية بنجاح');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    header: {
      marginBottom: theme.spacing.xxl,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    qrCodeContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      marginBottom: theme.spacing.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      alignItems: 'center',
    },
    qrCodeImage: {
      width: 300,
      height: 300,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: '#FFFFFF',
    },
    membershipInfo: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      width: '100%',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
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
    actionsContainer: {
      width: '100%',
      gap: theme.spacing.md,
    },
    actionButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md + 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonSecondary: {
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
      marginLeft: theme.spacing.sm,
    },
    actionButtonTextSecondary: {
      color: theme.colors.primary,
    },
    instructions: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      width: '100%',
    },
    instructionsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    instructionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    instructionNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    instructionNumberText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    instructionText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>QR Code العضوية</Text>
          <Text style={styles.subtitle}>اعرض هذا الكود للحصول على المزايا الحصرية</Text>
        </View>

        <View style={styles.qrCodeContainer}>
          {qrCodeImage ? (
            <QRCode
              value={qrCodeImage}
              size={300}
              color="#000000"
              backgroundColor="#FFFFFF"
              logo={require('./../../assets/images/icon.png')}
              logoSize={60}
              logoBackgroundColor="#FFFFFF"
              logoMargin={2}
              logoBorderRadius={10}
            />
          ) : (
            <View style={[styles.qrCodeImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.border }]}>
              <SafeIcon name="qr-code" size={150} color={theme.colors.textSecondary} />
            </View>
          )}
        </View>

        <View style={styles.membershipInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>اسم العضو:</Text>
            <Text style={styles.infoValue}>{user?.name || 'عمر سيف الدين'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>رقم العضوية:</Text>
            <Text style={styles.infoValue}>{membershipNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>نوع العضوية:</Text>
            <Text style={styles.infoValue}>Gold Membership</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <SafeIcon name="share" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>مشاركة QR Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={handleCopy}>
            <SafeIcon name="content-copy" size={24} color={theme.colors.primary} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>نسخ رقم العضوية</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>كيفية الاستخدام:</Text>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              اعرض QR Code عند الحجز أو الشراء
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              سيتم تطبيق خصومات العضوية تلقائياً
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              احصل على نقاط مكافآت إضافية
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

