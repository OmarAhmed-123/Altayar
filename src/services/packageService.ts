/**
 * Package Service
 * Uses the unified API client
 */
import { API } from './apiClient';
import { extractArray, extractData } from '../utils/apiResponse';

export const packageService = {
  getPackages: async () => extractArray(await API.package.getPackages()),
  getPackageById: async (id: string | number) =>
    extractData(await API.package.getPackageById(id)),
  createPackage: API.package.createPackage,
  updatePackage: API.package.updatePackage,
  deletePackage: API.package.deletePackage,
};
