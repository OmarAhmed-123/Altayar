/**
 * Settings Service
 * Uses the unified API client
 */
import { API } from './apiClient';

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface GeneralSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  social_media: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  currency: string;
  timezone: string;
  maintenance_mode: boolean;
}

export const settingsService = {
  getGeneralSettings: API.settings.getGeneralSettings,
  updateGeneralSettings: API.settings.updateGeneralSettings,
  getAllPages: API.settings.getAllPages,
  getPageBySlug: API.settings.getPageBySlug,
  createPage: API.settings.createPage,
  updatePage: API.settings.updatePage,
  deletePage: API.settings.deletePage,
};
