/**
 * Trip Service
 * Uses the unified API client
 */
import { API } from './apiClient';
import type { Trip } from '../types';

export const tripService = {
  getMyTrips: API.trip.getMyTrips,
  getAllTrips: API.trip.getAllTrips,
  // createTrip now supports images parameter: { ..., images?: string[] }
  // Pass array of image URIs to upload images when creating a trip
  createTrip: API.trip.createTrip,
  updateTrip: API.trip.updateTrip,
  deleteTrip: API.trip.deleteTrip,
  updateTripStatus: API.trip.updateTripStatus,
};
