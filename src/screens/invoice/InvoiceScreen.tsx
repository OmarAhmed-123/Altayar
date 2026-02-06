import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { reportService } from './../../services/reportService';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { SafeIcon } from './../../utils/iconHelper';
import Toast from 'react-native-toast-message';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  user: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  services: Array<{
    name: string;
    description?: string;
    quantity: number;
    rate: number;
    adjustment?: number;
    total: number;
  }>;
  subtotal: number;
  total: number;
  terms?: string;
}

export const InvoiceScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { bookingId } = route.params as { bookingId: string };

  useEffect(() => {
    loadInvoice();
  }, [bookingId]);

  const loadInvoice = async () => {
    setIsLoading(true);
    try {
      const response = await reportService.generateInvoice(parseInt(bookingId));
      const invoiceResponse = response.data || response;
      
      // Use the new invoice data structure from backend
      if (invoiceResponse.invoiceNumber) {
        // New format with structured invoice data
        const invoiceData: InvoiceData = {
          invoiceNumber: invoiceResponse.invoiceNumber,
          invoiceDate: invoiceResponse.invoiceDate,
          dueDate: invoiceResponse.dueDate,
          user: invoiceResponse.user,
          services: invoiceResponse.services,
          subtotal: invoiceResponse.subtotal,
          total: invoiceResponse.total,
          terms: invoiceResponse.terms,
        };
        setInvoice(invoiceData);
      } else {
        // Fallback to old format for backward compatibility
        const booking = invoiceResponse.booking || invoiceResponse;
        const user = booking.user || {};
        const packageData = booking.package || booking.details || {};
        
        // Calculate number of days dynamically
        let numberOfDays = 1;
        if (booking.details?.startDate && booking.details?.endDate) {
          const startDate = new Date(booking.details.startDate);
          const endDate = new Date(booking.details.endDate);
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
            const timeDiff = endDate.getTime() - startDate.getTime();
            numberOfDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
          }
        } else if (packageData?.days) {
          numberOfDays = packageData.days;
        }

        // Calculate pricing dynamically
        const participants = booking.details?.participants || booking.participants || 1;
        const totalPrice = booking.total_price || booking.totalAmount || 0;
        const dailyRate = numberOfDays > 0 ? totalPrice / (numberOfDays * participants) : totalPrice;
        
        const invoiceData: InvoiceData = {
          invoiceNumber: booking.invoice_id || `EIN_${String(booking.id).padStart(6, '0')}`,
          invoiceDate: new Date(booking.created_at || new Date()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          dueDate: new Date(
            new Date(booking.created_at || new Date()).getTime() + 30 * 24 * 60 * 60 * 1000
          ).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          user: {
            name: user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'User'),
            email: user.email,
            phone: user.phone,
            address: user.address,
          },
          services: [
            {
              name: packageData.name || packageData.title || booking.booking_type || 'Service',
              description: packageData.description || 
                `${packageData.name || booking.booking_type || 'Service'} - ${numberOfDays} ${numberOfDays === 1 ? 'day' : 'days'} for ${participants} ${participants === 1 ? 'participant' : 'participants'}`,
              quantity: numberOfDays,
              rate: dailyRate,
              adjustment: 0,
              total: totalPrice,
            },
          ],
          subtotal: totalPrice,
          total: totalPrice,
          terms: 'Payment is due within 30 days from date of invoice. All prices are in EGP.',
        };
        
        setInvoice(invoiceData);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل الفاتورة',
      });
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!invoice) return;
    
    try {
      const invoiceText = `
Invoice Number: ${invoice.invoiceNumber}
Date: ${invoice.invoiceDate}
Due Date: ${invoice.dueDate}
Customer: ${invoice.user.name}
Total: $${invoice.total.toFixed(2)}
      `;
      
      await Share.share({
        message: invoiceText,
        title: `Invoice ${invoice.invoiceNumber}`,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل مشاركة الفاتورة',
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل الفاتورة..." />;
  }

  if (!invoice) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>لا توجد بيانات فاتورة</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <SafeIcon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>الفاتورة</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <SafeIcon name="share" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Company Header */}
        <View style={styles.companyHeader}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: theme.colors.primary }]}>
              <SafeIcon name="flight" size={32} color="#FFFFFF" />
            </View>
            <Text style={[styles.companyName, { color: theme.colors.primary }]}>ALTAYARVIP</Text>
            <Text style={[styles.companyTagline, { color: theme.colors.textSecondary }]}>
              A global search engine for companies and individuals that provides all tourism and travel services.
            </Text>
            <Text style={[styles.companyWebsite, { color: theme.colors.textSecondary }]}>
              https://altayarvip.com
            </Text>
          </View>
        </View>

        {/* Invoice Details */}
        <View style={styles.invoiceDetails}>
          <View style={styles.invoiceDetailsLeft}>
            <Text style={[styles.toLabel, { color: theme.colors.textSecondary }]}>TO</Text>
            <Text style={[styles.customerName, { color: theme.colors.text }]}>
              {invoice.user.name}
            </Text>
            {invoice.user.email && (
              <Text style={[styles.customerInfo, { color: theme.colors.textSecondary }]}>
                {invoice.user.email}
              </Text>
            )}
            {invoice.user.phone && (
              <Text style={[styles.customerInfo, { color: theme.colors.textSecondary }]}>
                {invoice.user.phone}
              </Text>
            )}
            {invoice.user.address && (
              <Text style={[styles.customerInfo, { color: theme.colors.textSecondary }]}>
                {invoice.user.address}
              </Text>
            )}
          </View>

          <View style={styles.invoiceDetailsRight}>
            <View style={styles.invoiceInfoRow}>
              <Text style={[styles.invoiceInfoLabel, { color: theme.colors.textSecondary }]}>
                Invoice Number:
              </Text>
              <Text style={[styles.invoiceInfoValue, { color: theme.colors.text }]}>
                {invoice.invoiceNumber}
              </Text>
            </View>
            <View style={styles.invoiceInfoRow}>
              <Text style={[styles.invoiceInfoLabel, { color: theme.colors.textSecondary }]}>
                Invoice Date:
              </Text>
              <Text style={[styles.invoiceInfoValue, { color: theme.colors.text }]}>
                {invoice.invoiceDate}
              </Text>
            </View>
            <View style={styles.invoiceInfoRow}>
              <Text style={[styles.invoiceInfoLabel, { color: theme.colors.textSecondary }]}>
                Due Date:
              </Text>
              <Text style={[styles.invoiceInfoValue, { color: theme.colors.text }]}>
                {invoice.dueDate}
              </Text>
            </View>
          </View>
        </View>

        {/* Services Table */}
        <View style={[styles.tableContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>Service</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderCenter, { color: theme.colors.text }]}>
              Qty
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderCenter, { color: theme.colors.text }]}>
              Rate
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderCenter, { color: theme.colors.text }]}>
              Adjust (%)
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderRight, { color: theme.colors.text }]}>
              Total
            </Text>
          </View>

          {invoice.services.map((service, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.serviceColumn}>
                <Text style={[styles.serviceName, { color: theme.colors.text }]}>{service.name}</Text>
                {service.description && (
                  <Text style={[styles.serviceDescription, { color: theme.colors.textSecondary }]}>
                    {service.description}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.tableCellCenter, { color: theme.colors.text }]}>
                {service.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellCenter, { color: theme.colors.text }]}>
                ${service.rate.toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellCenter, { color: theme.colors.textSecondary }]}>
                {service.adjustment ? `${service.adjustment}%` : '—'}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { color: theme.colors.text }]}>
                ${service.total.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Sub Total</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              ${invoice.subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={[styles.summaryLabel, styles.summaryTotalLabel, { color: theme.colors.text }]}>
              Total
            </Text>
            <Text style={[styles.summaryValue, styles.summaryTotalValue, { color: theme.colors.text }]}>
              ${invoice.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Terms & Conditions */}
        {invoice.terms && (
          <View style={styles.termsContainer}>
            <Text style={[styles.termsTitle, { color: theme.colors.text }]}>Terms & Conditions:</Text>
            <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
              {invoice.terms}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Thanks for choosing AltayarVIP |{' '}
            <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
              info@altayarvip.com
            </Text>
          </Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  companyHeader: {
    padding: 24,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyTagline: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  companyWebsite: {
    fontSize: 12,
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
  },
  invoiceDetailsLeft: {
    flex: 1,
  },
  invoiceDetailsRight: {
    alignItems: 'flex-end',
  },
  toLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  customerInfo: {
    fontSize: 14,
    marginBottom: 2,
  },
  invoiceInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  invoiceInfoLabel: {
    fontSize: 12,
    marginRight: 8,
  },
  invoiceInfoValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  tableHeaderCenter: {
    textAlign: 'center',
  },
  tableHeaderRight: {
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  serviceColumn: {
    flex: 2,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
  },
  tableCell: {
    fontSize: 14,
    flex: 1,
  },
  tableCellCenter: {
    textAlign: 'center',
  },
  tableCellRight: {
    textAlign: 'right',
  },
  summaryContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 8,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

