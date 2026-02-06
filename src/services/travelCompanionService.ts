/**
 * Travel Companion Service
 * Uses the unified API client
 */
import { API } from './apiClient';

export const travelCompanionService = {
  getCompanions: API.travelCompanion.getCompanions,
  createCompanionRequest: API.travelCompanion.createCompanionRequest,
  updateCompanionRequest: API.travelCompanion.updateCompanionRequest,
  deleteCompanionRequest: API.travelCompanion.deleteCompanionRequest,
};

