/**
 * Marketing Automation Service
 * Handles all marketing campaign and automation API calls
 */

import { API } from './apiClient';
import { extractArray, extractData } from '../utils/apiResponse';

export interface MarketingCampaign {
  id: number;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  target_criteria?: any;
  content: any;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AutomatedTrigger {
  id: number;
  name: string;
  event_type: string;
  conditions?: any;
  actions?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const marketingService = {
  getMarketingDashboard: async () => extractData(await API.marketing.getMarketingDashboard()),

  getCampaigns: async (filters?: {
    status?: string;
    type?: string;
    limit?: number;
    page?: number;
  }) => extractArray(await API.marketing.getCampaigns(filters)),

  getCampaignDetails: async (id: number) =>
    extractData(await API.marketing.getCampaignDetails(id)),

  getCampaignStatistics: async (id: number) =>
    extractData(await API.marketing.getCampaignStatistics(id)),

  createCampaign: async (campaignData: {
    name: string;
    description?: string;
    type: string;
    targetCriteria?: any;
    content: any;
    scheduledAt?: string;
  }) => extractData(await API.marketing.createCampaign(campaignData)),

  updateCampaign: async (id: number, campaignData: Partial<MarketingCampaign>) =>
    extractData(await API.marketing.updateCampaign(id, campaignData)),

  scheduleCampaign: async (id: number, scheduledAt: string) =>
    extractData(await API.marketing.scheduleCampaign(id, scheduledAt)),

  startCampaign: async (id: number) => extractData(await API.marketing.startCampaign(id)),

  pauseCampaign: async (id: number) => extractData(await API.marketing.pauseCampaign(id)),

  getAutomatedTriggers: async () => extractArray(await API.marketing.getAutomatedTriggers()),

  createAutomatedTrigger: async (triggerData: {
    name: string;
    eventType: string;
    conditions?: any;
    actions?: any;
    isActive?: boolean;
  }) => extractData(await API.marketing.createAutomatedTrigger(triggerData)),

  updateAutomatedTrigger: async (id: number, triggerData: Partial<AutomatedTrigger>) =>
    extractData(await API.marketing.updateAutomatedTrigger(id, triggerData)),

  toggleTriggerStatus: async (id: number) =>
    extractData(await API.marketing.toggleTriggerStatus(id)),

  testTrigger: async (id: number) => extractData(await API.marketing.testTrigger(id)),
};

