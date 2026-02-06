/**
 * Booking Service
 * Uses the unified API client
 */
import { API } from './apiClient';
import { packageService } from './packageService';
const unwrapResponse = <T,>(response: T | { data?: T }): T => {
  if (response && typeof response === 'object' && 'data' in (response as any) && (response as any).data !== undefined) {
    return (response as any).data as T;
  }
  return response as T;
};

export const bookingService = {
  async createBooking(bookingData: {
    packageId?: string;
    participants: number;
    startDate: string;
    endDate: string;
    specialRequests?: string;
    totalPrice?: number;
    images?: string[]; // Array of image URIs for hotel, facilities, etc.
    bookingType?: 'tour' | 'nile_cruise' | 'flight_ticket' | 'hotel_booking' | 'transfer' | 'nile_trip' | 'general_tour';
  }): Promise<any> {
    // Get package to calculate price if not provided
    let totalPrice = bookingData.totalPrice;
    if (!totalPrice && bookingData.packageId) {
      try {
        const pkgResponse = await packageService.getPackageById(bookingData.packageId);
        const pkg = pkgResponse.data || pkgResponse;
        totalPrice = (pkg as any).price || 0;
      } catch (error) {
        // If package fetch fails, use default
        totalPrice = 0;
      }
    }

    // Use the unified API client
    const response = await API.booking.createBooking({
      ...bookingData,
      totalPrice,
    });

    return unwrapResponse(response);
  },

  getMyBookings: async (): Promise<any[]> => {
    const response = await API.booking.getMyBookings();
    return unwrapResponse(response) || [];
  },

  getAllBookings: async (): Promise<any[]> => {
    const response = await API.booking.getAllBookings();
    return unwrapResponse(response) || [];
  },

  getBookingById: async (id: string): Promise<any> => {
    const response = await API.booking.getBookingById(id);
    return unwrapResponse(response);
  },

  updateBookingStatus: async (id: string, status: string): Promise<any> => {
    const response = await API.booking.updateBookingStatus(id, status);
    return unwrapResponse(response);
  },

  cancelBooking: API.booking.cancelBooking,
};
