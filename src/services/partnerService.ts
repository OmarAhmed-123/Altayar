/**
 * Partner Portal Service
 * Handles all partner-related API calls
 */

import { API } from './apiClient';
import { extractArray, extractData } from '../utils/apiResponse';

export interface Partner {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  business_type: string;
  services?: string[];
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  approved_at?: string;
  approved_by?: number;
  created_at: string;
  updated_at: string;
}

export interface PartnerService {
  id: number;
  partner_id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  duration?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartnerBooking {
  id: number;
  partner_service_id: number;
  user_id: number;
  start_date: string;
  end_date?: string;
  participants?: number;
  special_requests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface PartnerApplication {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  businessType: string;
  services?: string[];
}

export const partnerService = {
  // Public APIs
  applyToBePartner: async (applicationData: PartnerApplication) =>
    extractData(await API.partner.applyToBePartner(applicationData)),

  getAvailableServices: async () => extractArray(await API.partner.getAvailableServices()),

  // Private APIs
  bookPartnerService: async (
    serviceId: number,
    bookingData: {
      startDate: string;
      endDate?: string;
      participants?: number;
      specialRequests?: string;
    }
  ) => extractData(await API.partner.bookPartnerService(serviceId, bookingData)),

  // Admin APIs
  getPartnerDashboard: async () => extractData(await API.partner.getPartnerDashboard()),

  getPartners: async (filters?: {
    status?: string;
    businessType?: string;
    limit?: number;
    page?: number;
  }) => extractArray(await API.partner.getPartners(filters)),

  getPartnerDetails: async (id: number) =>
    extractData(await API.partner.getPartnerDetails(id)),

  approvePartner: async (id: number) => extractData(await API.partner.approvePartner(id)),

  suspendPartner: async (id: number) => extractData(await API.partner.suspendPartner(id)),

  rejectPartner: async (id: number) => extractData(await API.partner.rejectPartner(id)),

  getPartnerServices: async (partnerId: number) =>
    extractArray(await API.partner.getPartnerServices(partnerId)),

  createPartnerService: async (
    partnerId: number,
    serviceData: {
      name: string;
      description?: string;
      price: number;
      category?: string;
      duration?: number;
      isActive?: boolean;
    }
  ) => extractData(await API.partner.createPartnerService(partnerId, serviceData)),

  getPartnerBookings: async (partnerId: number) =>
    extractArray(await API.partner.getPartnerBookings(partnerId)),

  updateBookingStatus: async (bookingId: number, status: string) =>
    extractData(await API.partner.updateBookingStatus(bookingId, status)),
};

