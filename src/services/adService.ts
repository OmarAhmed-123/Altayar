/**
 * Ad Service
 * Uses the unified API client
 */
import { API } from './apiClient';

export const adService = {
  getActiveAds: API.ad.getActiveAds,
  createAd: API.ad.createAd,
  updateAd: API.ad.updateAd,
  deleteAd: API.ad.deleteAd,
  sendAdToUsers: API.ad.sendAdToUsers,
};

