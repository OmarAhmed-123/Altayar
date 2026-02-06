/**
 * Transaction Service
 * Uses the unified API client
 */
import { API } from './apiClient';
import type { Transaction } from './apiClient';
import { extractArray, extractData } from '../utils/apiResponse';

// Re-export types
export type { Transaction } from './apiClient';

export interface SalesReport {
  totalRevenue: number;
  newBookingsLast30Days: number;
  reportGeneratedAt: string;
}

export const transactionService = {
  getUserTransactions: async () => extractArray(await API.transaction.getUserTransactions()),
  getAllTransactions: async () => extractArray(await API.transaction.getAllTransactions()),
  generateInvoice: async (bookingId: number) =>
    extractData(await API.transaction.generateInvoice(bookingId)),
  getSalesReports: async () => extractData(await API.transaction.getSalesReports()),
  getPaymentHistory: async () => extractArray(await API.transaction.getPaymentHistory()),
};
