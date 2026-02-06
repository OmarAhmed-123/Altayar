/**
 * OAuth Service
 * Uses the unified API client
 */
import { API } from './apiClient';
import { extractArray, extractData } from '../utils/apiResponse';

export const oauthService = {
  getOAuthConfig: async () => extractData(await API.oauth.getOAuthConfig()),
  googleLogin: API.oauth.googleLogin,
  appleLogin: API.oauth.appleLogin,
  tokenExchange: API.oauth.tokenExchange,
  getUserProviders: async () => extractArray(await API.oauth.getUserProviders()),
  linkProvider: API.oauth.linkProvider,
  unlinkProvider: API.oauth.unlinkProvider,
};

