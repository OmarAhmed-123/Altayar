import { create } from 'zustand';
import { Package } from './../types';
import { packageService } from './../services/packageService';

interface PackageStore {
  packages: Package[];
  isLoading: boolean;
  error: string | null;
  fetchPackages: () => Promise<void>;
  fetchPackageById: (id: string) => Promise<Package | null>;
  clearError: () => void;
}

export const usePackageStore = create<PackageStore>((set, get) => ({
  packages: [],
  isLoading: false,
  error: null,

  fetchPackages: async () => {
    set({ isLoading: true, error: null });
    try {
      // Use real backend API
      const packages = await packageService.getPackages();
      // Transform backend data to frontend format
      const transformedPackages = packages.map(pkg => ({
        ...pkg,
        title: pkg.name,
        duration: pkg.days,
        location: 'الموقع', // Default location
        rating: 4.5, // Default rating
        reviewCount: 0, // Default review count
        isActive: pkg.is_active,
        createdAt: pkg.created_at,
        updatedAt: pkg.updated_at,
      }));
      set({ packages: transformedPackages, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchPackageById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const package_ = await packageService.getPackageById(id);
      // Transform backend data to frontend format
      const transformedPackage = {
        ...package_,
        title: package_.name,
        duration: package_.days,
        location: 'الموقع', // Default location
        rating: 4.5, // Default rating
        reviewCount: 0, // Default review count
        isActive: package_.is_active,
        createdAt: package_.created_at,
        updatedAt: package_.updated_at,
      };
      set({ isLoading: false });
      return transformedPackage;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
