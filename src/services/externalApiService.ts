/**
 * External API Service
 * Handles external API integrations (Maps, Weather, Flights, Hotels, etc.)
 */

import { API } from './apiClient';
import type { ApiResponse } from '../types';

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  photos?: string[];
  reviews?: any[];
}

export interface Directions {
  routes: Array<{
    distance: number;
    duration: number;
    steps: Array<{
      instruction: string;
      distance: number;
      duration: number;
    }>;
  }>;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon?: string;
}

export interface WeatherForecast {
  date: string;
  temperature: {
    min: number;
    max: number;
  };
  condition: string;
  icon?: string;
}

export interface FlightSearchResult {
  flights: Array<{
    airline: string;
    flightNumber: string;
    departure: {
      airport: string;
      time: string;
    };
    arrival: {
      airport: string;
      time: string;
    };
    price: number;
    duration: number;
  }>;
}

export interface HotelSearchResult {
  hotels: Array<{
    name: string;
    address: string;
    rating: number;
    price: number;
    images: string[];
    amenities: string[];
  }>;
}

export interface ApiIntegration {
  id: number;
  service_name: string;
  service_type: string;
  is_active: boolean;
  is_production: boolean;
  rate_limit?: number;
  created_at: string;
  updated_at: string;
}

export const externalApiService = {
  // Maps APIs
  getPlaceDetails: async (placeId: string): Promise<ApiResponse<PlaceDetails>> => {
    return await API.external.getPlaceDetails(placeId);
  },

  getDirections: async (origin: string, destination: string, mode?: string): Promise<ApiResponse<Directions>> => {
    return await API.external.getDirections(origin, destination, mode);
  },

  geocodeAddress: async (address: string): Promise<ApiResponse<any>> => {
    return await API.external.geocodeAddress(address);
  },

  // Weather APIs
  getCurrentWeather: async (lat: number, lon: number): Promise<ApiResponse<WeatherData>> => {
    return await API.external.getCurrentWeather(lat, lon);
  },

  getWeatherForecast: async (lat: number, lon: number, days?: number): Promise<ApiResponse<WeatherForecast[]>> => {
    return await API.external.getWeatherForecast(lat, lon, days);
  },

  // Currency APIs
  getExchangeRate: async (from: string, to: string): Promise<ApiResponse<any>> => {
    return await API.external.getExchangeRate(from, to);
  },

  // Flight APIs
  searchFlights: async (searchData: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers?: number;
  }): Promise<ApiResponse<FlightSearchResult>> => {
    return await API.external.searchFlights(searchData);
  },

  // Hotel APIs
  searchHotels: async (searchData: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests?: number;
  }): Promise<ApiResponse<HotelSearchResult>> => {
    return await API.external.searchHotels(searchData);
  },

  // Communication APIs (Admin only)
  sendSMS: async (to: string, message: string): Promise<ApiResponse<any>> => {
    return await API.external.sendSMS(to, message);
  },

  sendEmail: async (emailData: {
    to: string;
    subject: string;
    body: string;
    isHtml?: boolean;
  }): Promise<ApiResponse<any>> => {
    return await API.external.sendEmail(emailData);
  },

  // Admin APIs
  getApiStatistics: async (serviceName?: string): Promise<ApiResponse<any>> => {
    return await API.external.getApiStatistics(serviceName);
  },

  getApiLogs: async (filters?: {
    serviceName?: string;
    status?: string;
    limit?: number;
  }): Promise<ApiResponse<any[]>> => {
    return await API.external.getApiLogs(filters);
  },

  getApiIntegrations: async (filters?: {
    serviceType?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<ApiIntegration[]>> => {
    return await API.external.getApiIntegrations(filters);
  },

  createApiIntegration: async (integrationData: {
    serviceName: string;
    serviceType: string;
    apiKey: string;
    apiSecret?: string;
    baseUrl?: string;
    configuration?: any;
    isProduction?: boolean;
    rateLimit?: number;
  }): Promise<ApiResponse<ApiIntegration>> => {
    return await API.external.createApiIntegration(integrationData);
  },

  updateApiIntegration: async (id: number, updateData: Partial<ApiIntegration>): Promise<ApiResponse<ApiIntegration>> => {
    return await API.external.updateApiIntegration(id, updateData);
  },

  toggleIntegrationStatus: async (id: number): Promise<ApiResponse<ApiIntegration>> => {
    return await API.external.toggleIntegrationStatus(id);
  },

  testApiIntegration: async (id: number, testData: {
    endpoint: string;
    method?: string;
    data?: any;
  }): Promise<ApiResponse<any>> => {
    return await API.external.testApiIntegration(id, testData);
  },
};

