/**
 * Report Service
 * Handles PDF report generation and download
 */
import { API } from './apiClient';

export interface UserReportData {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    createdAt: string;
  };
  membership: {
    type: string;
    subscriptionDate?: string;
    expiryDate?: string;
    status: string;
    cashbackBalance?: number;
  } | null;
  bookings: Array<{
    id: number;
    packageName: string;
    status: string;
    totalAmount: number;
    bookingDate: string;
    travelDate?: string;
  }>;
  trips: Array<{
    id: number;
    destination: string;
    status: string;
    startDate: string;
    endDate?: string;
    totalCost: number;
  }>;
  transactions: Array<{
    id: number;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
    status: string;
  }>;
  statistics: {
    totalBookings: number;
    totalTrips: number;
    totalSpent: number;
    totalCashback: number;
    pendingPayments: number;
  };
}

export const reportService = {
  /**
   * Generate and download user report as PDF
   * For React Native: Returns download URL or base64 string
   * For Web: Returns Blob
   */
  generateUserReport: async (): Promise<string | Blob> => {
    try {
      // For React Native, get the download URL directly with token in query string
      const downloadUrl = await API.report.getPDFDownloadURL();
      return downloadUrl;
    } catch (error: any) {
      console.error('Error generating report URL:', error);
      
      // Fallback 1: Try to get base64 if URL method fails
      try {
        console.log('[Report Service] Trying base64 fallback...');
        const base64 = await API.report.downloadPDFAsBase64();
        if (base64 && base64.length > 0) {
          return base64;
        }
      } catch (base64Error: any) {
        console.error('Error downloading PDF as base64:', base64Error);
        
        // Fallback 2: Try blob method (for web compatibility)
        try {
          console.log('[Report Service] Trying blob fallback...');
          const blob = await API.report.generateUserReportPDF();
          if (blob && (blob instanceof Blob || typeof blob === 'object')) {
            return blob;
          }
        } catch (blobError: any) {
          console.error('Error generating report blob:', blobError);
        }
      }
      
      // If all methods fail, throw error with helpful message
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to generate report. Please check backend configuration.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get user report data (without PDF)
   */
  getUserReportData: async (): Promise<UserReportData> => {
    try {
      const response = await API.report.getUserReportData();
      const data = (response as any).data || response;
      
      // Ensure the response has the correct structure
      if (data && typeof data === 'object' && 'user' in data) {
        return data;
      }
      
      // If response is wrapped in success object
      if (data && typeof data === 'object' && 'success' in data && data.data) {
        return data.data;
      }
      
      return data;
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      throw new Error(error?.response?.data?.message || 'Failed to fetch report data');
    }
  },

  /**
   * Generate invoice for a booking
   */
  generateInvoice: async (bookingId: number): Promise<any> => {
    try {
      const response = await API.report.generateInvoice(bookingId);
      return (response as any).data || response;
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      throw new Error(error?.response?.data?.message || 'Failed to generate invoice');
    }
  },

  /**
   * Get sales reports (Admin only)
   */
  getSalesReports: async (): Promise<any> => {
    try {
      const response = await API.report.getSalesReports();
      return (response as any).data || response;
    } catch (error: any) {
      console.error('Error fetching sales reports:', error);
      throw new Error(error?.response?.data?.message || 'Failed to fetch sales reports');
    }
  },

  /**
   * Get payment history (Admin only)
   */
  getPaymentHistory: async (): Promise<any[]> => {
    try {
      const response = await API.report.getPaymentHistory();
      const data = (response as any).data || response;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      throw new Error(error?.response?.data?.message || 'Failed to fetch payment history');
    }
  },
};

