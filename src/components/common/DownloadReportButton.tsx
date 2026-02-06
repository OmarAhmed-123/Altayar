/**
 * Download Report Button Component
 * Button to download user report as PDF
 */
import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { SafeIcon } from './../../utils/iconHelper';
import { reportService } from './../../services/reportService';

interface DownloadReportButtonProps {
  style?: any;
  iconSize?: number;
  showText?: boolean;
  navigation?: any;
  onPreview?: () => void;
}

export const DownloadReportButton: React.FC<DownloadReportButtonProps> = ({
  style,
  iconSize = 24,
  showText = true,
  navigation,
  onPreview,
}) => {
  const themeContext = useTheme();
  const theme = themeContext?.theme;
  const { t } = useLanguage();
  const [isDownloading, setIsDownloading] = useState(false);


  const downloadReport = async () => {
    if (isDownloading) return;

    try {
      setIsDownloading(true);

      // Get the authentication token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Get PDF download URL or data from backend
      const result = await reportService.generateUserReport();
      
      let downloadUrl: string;

      if (typeof result === 'string') {
        if (result.startsWith('http')) {
          // It's a direct URL
          downloadUrl = result;
        } else if (result.length > 100 && !result.includes(' ')) {
          // It's likely a base64 string - create data URI
          downloadUrl = `data:application/pdf;base64,${result}`;
        } else {
          // Try to construct URL from API base
          const { API_BASE_URL } = require('../../constants/theme');
          downloadUrl = `${API_BASE_URL}/reports/user-pdf?token=${encodeURIComponent(token)}`;
        }
      } else {
        // For blob or object, construct URL with token
        const { API_BASE_URL } = require('../../constants/theme');
        downloadUrl = `${API_BASE_URL}/reports/user-pdf?token=${encodeURIComponent(token)}`;
      }

      // Verify URL is valid
      if (!downloadUrl || (!downloadUrl.startsWith('http') && !downloadUrl.startsWith('data:'))) {
        throw new Error('Invalid download URL generated');
      }

      // Check if we can open the URL
      const canOpen = await Linking.canOpenURL(downloadUrl);
      
      if (canOpen) {
        // Open the URL - browser will handle PDF download
        await Linking.openURL(downloadUrl);
        
        // Show success message
        Alert.alert(
          t('success') || 'Success',
          t('report_download_started') || 'Report download started. Please check your browser or downloads folder.',
          [{ text: t('ok') || 'OK' }]
        );
      } else {
        // If canOpenURL returns false, try anyway (sometimes it's incorrect)
        try {
          await Linking.openURL(downloadUrl);
          Alert.alert(
            t('success') || 'Success',
            t('report_download_started') || 'Report download started.',
            [{ text: t('ok') || 'OK' }]
          );
        } catch (openError: any) {
          console.warn('Linking.openURL fallback failed:', openError);
          // If that fails, provide alternative
          const { API_BASE_URL } = require('../../constants/theme');
          const alternativeUrl = `${API_BASE_URL.replace('/api', '')}/api/reports/user-pdf?token=${encodeURIComponent(token)}`;
          
          Alert.alert(
            t('download_instructions') || 'Download Instructions',
            `${t('please_copy_url') || 'Please copy this URL and open it in your browser:'}\n\n${alternativeUrl}`,
            [
              { text: t('cancel') || 'Cancel', style: 'cancel' },
              {
                text: t('try_again') || 'Try Again',
                onPress: () => {
                  Linking.openURL(alternativeUrl).catch(() => {
                    Alert.alert(
                      t('error') || 'Error',
                      t('cannot_open_url') || 'Cannot open URL. Please check your internet connection and try again.'
                    );
                  });
                },
              },
            ]
          );
        }
      }
    } catch (error: any) {
      console.error('Error downloading report:', error);
      
      // Provide helpful error message
      let errorMessage = error.message || t('error_downloading_report') || 'Failed to download report';
      
      if (errorMessage.includes('Authentication')) {
        errorMessage = t('auth_required') || 'Authentication required. Please login again.';
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        errorMessage = t('network_error') || 'Network error. Please check your connection and try again.';
      }

      Alert.alert(
        t('error') || 'Error',
        errorMessage,
        [
          { text: t('cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('retry') || 'Retry',
            onPress: downloadReport,
          },
        ]
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePress = () => {
    // Navigate to report preview screen
    if (navigation) {
      navigation.navigate('ReportPreview');
    } else if (onPreview) {
      onPreview();
    } else {
      // Fallback: show alert
      Alert.alert(
        t('preview_report') || 'Preview Report',
        t('preview_report_message') || 'Do you want to preview your report before downloading?',
        [
          {
            text: t('cancel') || 'Cancel',
            style: 'cancel',
          },
          {
            text: t('preview') || 'Preview',
            onPress: downloadReport, // Fallback to direct download
          },
        ]
      );
    }
  };

  // Ensure theme is available
  const primaryColor = theme?.colors?.primary || '#0078D4';
  
  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: primaryColor,
      borderRadius: 8,
      gap: 8,
      opacity: isDownloading ? 0.6 : 1,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    iconButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: primaryColor + '20',
    },
  });

  if (!showText) {
    return (
      <TouchableOpacity
        style={[styles.iconButton, style]}
        onPress={handlePress}
        disabled={isDownloading}
        activeOpacity={0.7}
      >
        <SafeIcon
          name="picture-as-pdf"
          size={iconSize}
          color={primaryColor}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={isDownloading}
      activeOpacity={0.8}
    >
      <SafeIcon
        name="picture-as-pdf"
        size={iconSize}
        color="#FFFFFF"
      />
      <Text style={styles.buttonText}>
        {isDownloading
          ? (t('downloading') || 'Downloading...')
          : (t('download_report') || 'Download Report')}
      </Text>
    </TouchableOpacity>
  );
};

