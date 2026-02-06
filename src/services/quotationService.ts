/**
 * Quotation Service
 * Handles all quotation/proposal related API calls
 */
import { API } from './apiClient';
import type { ApiResponse } from './apiClient';

export interface Quotation {
  id: number;
  customer_id: number;
  sales_id: number;
  package_id?: number;
  items?: any[];
  notes?: string;
  total_amount: number;
  discount: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  valid_until?: string;
  sent_at?: string;
  viewed_at?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  sales?: {
    id: number;
    name: string;
    email: string;
  };
  package?: {
    id: number;
    title: string;
    price: number;
  };
}

export interface CreateQuotationData {
  customerId: number;
  packageId?: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  notes?: string;
  validUntil?: string;
  discount?: number;
}

export const quotationService = {
  // Get all quotations
  getQuotations: async (params?: {
    status?: string;
    customerId?: number;
    salesId?: number;
  }): Promise<ApiResponse<Quotation[]>> => {
    return await API.quotation.getQuotations(params);
  },

  // Get quotation by ID
  getQuotationById: async (id: number): Promise<ApiResponse<Quotation>> => {
    return await API.quotation.getQuotationById(id);
  },

  // Create new quotation
  createQuotation: async (data: CreateQuotationData): Promise<ApiResponse<Quotation>> => {
    return await API.quotation.createQuotation(data);
  },

  // Update quotation
  updateQuotation: async (id: number, data: Partial<CreateQuotationData & { status?: string }>): Promise<ApiResponse<Quotation>> => {
    return await API.quotation.updateQuotation(id, data);
  },

  // Send quotation to customer
  sendQuotation: async (id: number, options?: { sendEmail?: boolean; sendNotification?: boolean }): Promise<ApiResponse<Quotation>> => {
    return await API.quotation.sendQuotation(id, options);
  },

  // Generate PDF
  generateQuotationPDF: async (id: number): Promise<Blob> => {
    return await API.quotation.generateQuotationPDF(id);
  },

  // Delete quotation
  deleteQuotation: async (id: number): Promise<void> => {
    await API.quotation.deleteQuotation(id);
  },
};

