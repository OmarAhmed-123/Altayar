/**
 * Report Preview Screen
 * Displays user report data before downloading as PDF
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  RefreshControl,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { SafeIcon } from './../../utils/iconHelper';
import { reportService, UserReportData } from './../../services/reportService';
import { useAuthStore } from './../../stores/authStore';
import { ProfileScreenProps } from './../../types/navigation';

type ReportPreviewScreenProps = ProfileScreenProps<'ReportPreview'>;

const buildDisplayUser = (
  reportUser?: UserReportData['user'] | null,
  fallbackUser?: Partial<UserReportData['user']> | null,
) => {
  const source = reportUser || fallbackUser || null;
  if (!source) {
    return null;
  }

  const toNameParts = (name?: string) => {
    if (!name) return { first: '', last: '' };
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return { first: parts[0], last: '' };
    }
    return { first: parts[0], last: parts.slice(1).join(' ') };
  };

  const derived = toNameParts((source as any).name);
  const firstName = source.firstName || derived.first || '';
  const lastName = source.lastName || derived.last || '';

  const createdAt = (source as any).created_at || (source as any).createdAt || '';

  return {
    firstName,
    lastName,
    email: source.email || '',
    phone: source.phone,
    role: source.role || '',
    createdAt,
  };
};

const formatFullName = (userData: ReturnType<typeof buildDisplayUser>): string => {
  if (!userData) return 'N/A';
  return [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim() || 'N/A';
};

export const ReportPreviewScreen: React.FC<ReportPreviewScreenProps> = ({ navigation, route }) => {
  const themeContext = useTheme();
  const theme = themeContext?.theme;
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const [reportData, setReportData] = useState<UserReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      const data = await reportService.getUserReportData();
      setReportData(data);
    } catch (error: any) {
      console.error('Error loading report data:', error);
      Alert.alert(
        t('error') || 'Error',
        error.message || t('error_loading_report') || 'Failed to load report data'
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadReportData();
  };

  const downloadPDF = async () => {
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
      let canOpen = false;
      try {
        canOpen = await Linking.canOpenURL(downloadUrl);
      } catch (checkError) {
        console.log('[Report Preview] canOpenURL check failed, will try anyway');
      }
      
      if (canOpen || downloadUrl.startsWith('http')) {
        // Open the URL - browser will handle PDF download
        try {
          await Linking.openURL(downloadUrl);
          
          // Show success message after a short delay
          setTimeout(() => {
            Alert.alert(
              t('success') || 'Success',
              t('report_download_started') || 'Report download started. Please check your browser or downloads folder.',
              [{ text: t('ok') || 'OK' }]
            );
          }, 500);
        } catch (openError: any) {
          console.error('[Report Preview] Error opening URL:', openError);
          
          // If opening fails, try alternative URL format
          const { API_BASE_URL } = require('../../constants/theme');
          const baseUrl = API_BASE_URL.replace('/api', '');
          const alternativeUrl = `${baseUrl}/api/reports/user-pdf?token=${encodeURIComponent(token)}`;
          
          try {
            await Linking.openURL(alternativeUrl);
            Alert.alert(
              t('success') || 'Success',
              t('report_download_started') || 'Report download started.',
              [{ text: t('ok') || 'OK' }]
            );
          } catch (altError: any) {
            // Last resort: show URL for manual copy
            Alert.alert(
              t('download_instructions') || 'Download Instructions',
              `${t('please_copy_url') || 'Please copy this URL and open it in your browser:'}\n\n${alternativeUrl}\n\n${t('backend_config_note') || 'Note: Make sure backend supports token in query string.'}`,
              [
                { text: t('cancel') || 'Cancel', style: 'cancel' },
                {
                  text: t('copy_url') || 'Copy URL',
                  onPress: () => {
                    // You can add clipboard functionality here if needed
                    Alert.alert(
                      t('url_copied') || 'URL Copied',
                      t('paste_in_browser') || 'Please paste the URL in your browser.'
                    );
                  },
                },
              ]
            );
          }
        }
      } else {
        // If canOpenURL returns false, try anyway
        try {
          await Linking.openURL(downloadUrl);
          Alert.alert(
            t('success') || 'Success',
            t('report_download_started') || 'Report download started.',
            [{ text: t('ok') || 'OK' }]
          );
        } catch (openError: any) {
          throw new Error('Cannot open download URL. Please check backend configuration.');
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
            onPress: downloadPDF,
          },
        ]
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} EGP`;
  };

  if (isLoading) {
    return <LoadingSpinner text={t('loading_report') || 'Loading report...'} />;
  }

  if (!reportData) {
    return (
      <View style={[styles.container, { backgroundColor: theme?.colors?.background || '#FFFFFF' }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <SafeIcon name="arrow-back" size={24} color={theme?.colors?.text || '#000000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme?.colors?.text || '#000000' }]}>
            {t('report_preview') || 'Report Preview'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <SafeIcon name="error-outline" size={64} color={theme?.colors?.textSecondary || '#999999'} />
          <Text style={[styles.emptyText, { color: theme?.colors?.textSecondary || '#999999' }]}>
            {t('no_report_data') || 'No report data available'}
          </Text>
        </View>
      </View>
    );
  }

  const primaryColor = theme?.colors?.primary || '#0078D4';

  return (
    <View style={[styles.container, { backgroundColor: theme?.colors?.background || '#FFFFFF' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <SafeIcon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('report_preview') || 'Report Preview'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* User Information */}
        {(() => {
          const fallbackUserData = user
            ? {
                firstName: (user as any).firstName,
                lastName: (user as any).lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                createdAt: (user as any).created_at,
                name: (user as any).name,
              }
            : null;
          const displayUser = buildDisplayUser(reportData?.user || null, fallbackUserData);
          const displayName = formatFullName(displayUser);

          return (
            <View style={[styles.section, { backgroundColor: theme?.colors?.surface || '#F5F5F5' }]}>
          <View style={styles.sectionHeader}>
            <SafeIcon name="person" size={24} color={primaryColor} />
            <Text style={[styles.sectionTitle, { color: theme?.colors?.text || '#000000' }]}>
              {t('user_information') || 'User Information'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
              {t('name') || 'Name'}:
            </Text>
            <Text style={[styles.infoValue, { color: theme?.colors?.text || '#000000' }]}>
                  {displayName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
              {t('email') || 'Email'}:
            </Text>
            <Text style={[styles.infoValue, { color: theme?.colors?.text || '#000000' }]}>
                  {displayUser?.email || 'N/A'}
            </Text>
          </View>
              {(displayUser?.phone || user?.phone) && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
                {t('phone') || 'Phone'}:
              </Text>
              <Text style={[styles.infoValue, { color: theme?.colors?.text || '#000000' }]}>
                    {displayUser?.phone || user?.phone}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
              {t('role') || 'Role'}:
            </Text>
            <Text style={[styles.infoValue, { color: theme?.colors?.text || '#000000' }]}>
                  {displayUser?.role || 'N/A'}
            </Text>
          </View>
              {(displayUser?.createdAt || user?.created_at) && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
                {t('member_since') || 'Member Since'}:
              </Text>
              <Text style={[styles.infoValue, { color: theme?.colors?.text || '#000000' }]}>
                    {formatDate(displayUser?.createdAt || user?.created_at || '')}
              </Text>
            </View>
          )}
            </View>
          );
        })()}

        {/* Membership Information */}
        <View style={[styles.section, { backgroundColor: theme?.colors?.surface || '#F5F5F5' }]}>
          <View style={styles.sectionHeader}>
            <SafeIcon name="card-membership" size={24} color={primaryColor} />
            <Text style={[styles.sectionTitle, { color: theme?.colors?.text || '#000000' }]}>
              {t('membership_information') || 'Membership Information'}
            </Text>
          </View>
          {reportData.membership ? (
            <>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
                  {t('type') || 'Type'}:
                </Text>
                <Text style={[styles.infoValue, { color: theme?.colors?.text || '#000000' }]}>
                  {reportData.membership.type}
                </Text>
              </View>
              {reportData.membership.subscriptionDate && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
                    {t('subscription_date') || 'Subscription Date'}:
                  </Text>
                  <Text style={[styles.infoValue, { color: theme?.colors?.text || '#000000' }]}>
                    {formatDate(reportData.membership.subscriptionDate)}
                  </Text>
                </View>
              )}
              {reportData.membership.expiryDate && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
                    {t('expiry_date') || 'Expiry Date'}:
                  </Text>
                  <Text style={[styles.infoValue, { color: theme?.colors?.text || '#000000' }]}>
                    {formatDate(reportData.membership.expiryDate)}
                  </Text>
                </View>
              )}
              {reportData.membership.cashbackBalance !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
                    {t('cashback_balance') || 'Cashback Balance'}:
                  </Text>
                  <Text style={[styles.infoValue, { color: primaryColor, fontWeight: 'bold' }]}>
                    {formatCurrency(reportData.membership.cashbackBalance)}
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
                  {t('status') || 'Status'}:
                </Text>
                <Text style={[styles.infoValue, { color: theme?.colors?.text || '#000000' }]}>
                  {reportData.membership.status}
                </Text>
              </View>
            </>
          ) : (
            <Text style={[styles.emptyText, { color: theme?.colors?.textSecondary || '#999999' }]}>
              {t('no_membership') || 'No active membership'}
            </Text>
          )}
        </View>

        {/* Statistics */}
        <View style={[styles.section, { backgroundColor: theme?.colors?.surface || '#F5F5F5' }]}>
          <View style={styles.sectionHeader}>
            <SafeIcon name="bar-chart" size={24} color={primaryColor} />
            <Text style={[styles.sectionTitle, { color: theme?.colors?.text || '#000000' }]}>
              {t('statistics') || 'Statistics'}
            </Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: primaryColor }]}>
                {reportData.statistics.totalBookings}
              </Text>
              <Text style={[styles.statLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
                {t('total_bookings') || 'Total Bookings'}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: primaryColor }]}>
                {reportData.statistics.totalTrips}
              </Text>
              <Text style={[styles.statLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
                {t('total_trips') || 'Total Trips'}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: primaryColor }]}>
                {formatCurrency(reportData.statistics.totalSpent)}
              </Text>
              <Text style={[styles.statLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
                {t('total_spent') || 'Total Spent'}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: primaryColor }]}>
                {formatCurrency(reportData.statistics.totalCashback)}
              </Text>
              <Text style={[styles.statLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
                {t('total_cashback') || 'Total Cashback'}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: primaryColor }]}>
                {formatCurrency(reportData.statistics.pendingPayments)}
              </Text>
              <Text style={[styles.statLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
                {t('pending_payments') || 'Pending Payments'}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={[styles.section, { backgroundColor: theme?.colors?.surface || '#F5F5F5' }]}>
          <View style={styles.sectionHeader}>
            <SafeIcon name="book" size={24} color={primaryColor} />
            <Text style={[styles.sectionTitle, { color: theme?.colors?.text || '#000000' }]}>
              {t('recent_bookings') || 'Recent Bookings'} ({reportData.bookings.length})
            </Text>
          </View>
          {reportData.bookings.length > 0 ? (
            reportData.bookings.slice(0, 5).map((booking, index) => (
              <View key={booking.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemTitle, { color: theme?.colors?.text || '#000000' }]}>
                    {booking.packageName}
                  </Text>
                  <Text style={[styles.listItemSubtitle, { color: theme?.colors?.textSecondary || '#666666' }]}>
                    {formatDate(booking.bookingDate)} • {formatCurrency(booking.totalAmount)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: primaryColor + '20' }]}>
                  <Text style={[styles.statusText, { color: primaryColor }]}>
                    {booking.status}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme?.colors?.textSecondary || '#999999' }]}>
              {t('no_bookings') || 'No bookings found'}
            </Text>
          )}
        </View>

        {/* Recent Trips */}
        <View style={[styles.section, { backgroundColor: theme?.colors?.surface || '#F5F5F5' }]}>
          <View style={styles.sectionHeader}>
            <SafeIcon name="flight" size={24} color={primaryColor} />
            <Text style={[styles.sectionTitle, { color: theme?.colors?.text || '#000000' }]}>
              {t('recent_trips') || 'Recent Trips'} ({reportData.trips.length})
            </Text>
          </View>
          {reportData.trips.length > 0 ? (
            reportData.trips.slice(0, 5).map((trip, index) => (
              <View key={trip.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemTitle, { color: theme?.colors?.text || '#000000' }]}>
                    {trip.destination}
                  </Text>
                  <Text style={[styles.listItemSubtitle, { color: theme?.colors?.textSecondary || '#666666' }]}>
                    {formatDate(trip.startDate)} • {formatCurrency(trip.totalCost)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: primaryColor + '20' }]}>
                  <Text style={[styles.statusText, { color: primaryColor }]}>
                    {trip.status}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme?.colors?.textSecondary || '#999999' }]}>
              {t('no_trips') || 'No trips found'}
            </Text>
          )}
        </View>

        {/* Download Button */}
        <View style={styles.downloadSection}>
          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: primaryColor }]}
            onPress={downloadPDF}
            disabled={isDownloading}
            activeOpacity={0.8}
          >
            <SafeIcon
              name="picture-as-pdf"
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.downloadButtonText}>
              {isDownloading
                ? (t('downloading') || 'Downloading...')
                : (t('download_pdf') || 'Download PDF')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  downloadSection: {
    padding: 16,
    paddingBottom: 32,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

