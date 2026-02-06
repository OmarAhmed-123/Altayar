/**
 * Geolocation Service
 * Handles location tracking, visited locations, and travel statistics
 */

import { API } from './apiClient';
import type { ApiResponse } from '../types';

export interface VisitedLocation {
  id: number;
  user_id: number;
  location_name: string;
  latitude: number;
  longitude: number;
  country: string;
  city?: string;
  visit_type?: string;
  booking_id?: number;
  visit_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TravelStatistics {
  totalLocations: number;
  countriesVisited: number;
  citiesVisited: number;
  totalDistance: number;
  averageStayDuration: number;
  favoriteDestinations: Array<{
    location: string;
    visitCount: number;
  }>;
}

export interface MapData {
  locations: Array<{
    latitude: number;
    longitude: number;
    name: string;
    country: string;
  }>;
  routes?: Array<{
    from: { latitude: number; longitude: number };
    to: { latitude: number; longitude: number };
  }>;
}

export interface CountryCurrency {
  country: string;
  countryCode: string;
  currency: string;
  currencyCode: string;
  symbol: string;
}

export const geolocationService = {
  updateUserLocation: async (locationData: {
    latitude: number;
    longitude: number;
    countryCode?: string;
    timezone?: string;
  }): Promise<ApiResponse<any>> => {
    return await API.geolocation.updateUserLocation(locationData);
  },

  getVisitedLocations: async (limit?: number): Promise<ApiResponse<VisitedLocation[]>> => {
    return await API.geolocation.getVisitedLocations(limit);
  },

  addVisitedLocation: async (locationData: {
    locationName: string;
    latitude: number;
    longitude: number;
    country: string;
    city?: string;
    visitType?: string;
    bookingId?: number;
    visitDate?: string;
    notes?: string;
  }): Promise<ApiResponse<VisitedLocation>> => {
    return await API.geolocation.addVisitedLocation(locationData);
  },

  getMapData: async (): Promise<ApiResponse<MapData>> => {
    return await API.geolocation.getMapData();
  },

  getTravelStatistics: async (): Promise<ApiResponse<TravelStatistics>> => {
    return await API.geolocation.getTravelStatistics();
  },

  getCountryCurrencies: async (): Promise<ApiResponse<CountryCurrency[]>> => {
    return await API.geolocation.getCountryCurrencies();
  },

  getPopularCurrencies: async (): Promise<ApiResponse<CountryCurrency[]>> => {
    return await API.geolocation.getPopularCurrencies();
  },

  detectCurrencyFromLocation: async (locationData: {
    latitude?: number;
    longitude?: number;
    countryCode?: string;
  }): Promise<ApiResponse<any>> => {
    return await API.geolocation.detectCurrencyFromLocation(locationData);
  },

  getCurrentLocationInfo: async (): Promise<ApiResponse<any>> => {
    return await API.geolocation.getCurrentLocationInfo();
  },

  getLanguagesOrdered: async (): Promise<ApiResponse<any[]>> => {
    return await API.geolocation.getLanguagesOrdered();
  },

  getCurrenciesOrdered: async (): Promise<ApiResponse<any[]>> => {
    return await API.geolocation.getCurrenciesOrdered();
  },
};

