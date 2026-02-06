/**
 * Affiliate Service
 * Uses the unified API client
 */
import { API } from './apiClient';
import { extractArray, extractData } from '../utils/apiResponse';

export const affiliateService = {
  getMyCode: async () => extractData(await API.affiliate.getMyCode()),
  getMyReferrals: async () => extractArray(await API.affiliate.getMyReferrals()),
  getMyAffiliateLinks: async () => extractArray(await API.affiliate.getMyAffiliateLinks()),
  getAffiliateEarnings: async () => extractData(await API.affiliate.getAffiliateEarnings()),
  requestPayout: API.affiliate.requestPayout,
};

