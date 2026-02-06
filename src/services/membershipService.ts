/**
 * Membership Service
 * Uses the unified API client
 */
import { API } from './apiClient';
import { extractArray, extractData } from '../utils/apiResponse';

export const membershipService = {
  getMemberships: async () => extractArray(await API.membership.getMemberships()),
  getMembershipById: async (id: number | string) =>
    extractData(await API.membership.getMembershipById(id.toString())),
  getMyMembershipCard: async () => extractData(await API.membership.getMyMembershipCard()),
  subscribeToMembership: API.membership.subscribeToMembership,
  downloadMembershipPDF: API.membership.downloadMembershipPDF,
  createMembership: API.membership.createMembership,
  updateMembership: API.membership.updateMembership,
  deleteMembership: API.membership.deleteMembership,
};
