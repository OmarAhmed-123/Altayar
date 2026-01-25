import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../hooks/useTheme';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface QRCodeGeneratorProps {
  visible: boolean;
  onClose: () => void;
  apkUrl: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  visible, 
  onClose, 
  apkUrl 
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl,
      alignItems: 'center',
      margin: theme.spacing.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },
    qrContainer: {
      backgroundColor: '#FFFFFF',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.lg,
    },
    closeButton: {
      position: 'absolute',
      top: theme.spacing.md,
      right: theme.spacing.md,
      padding: theme.spacing.sm,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modal}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <Text style={styles.title}>مسح رمز QR</Text>
          
          <View style={styles.qrContainer}>
            <QRCode
              value={apkUrl}
              size={200}
              color="#000000"
              backgroundColor="#FFFFFF"
            />
          </View>
          
          <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
            امسح الرمز لتحميل التطبيق
          </Text>
        </View>
      </View>
    </Modal>
  );
};
