import { create } from 'zustand';
import { Package } from '../types';

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
      // Simulate API call - replace with actual API call
      const mockPackages: Package[] = [
        {
          id: '1',
          title: 'رحلة إلى دبي',
          description: 'رحلة رائعة إلى مدينة دبي مع زيارة المعالم السياحية',
          price: 2500,
          duration: 5,
          location: 'دبي، الإمارات',
          images: ['https://via.placeholder.com/300x200'],
          rating: 4.5,
          reviewCount: 120,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'رحلة إلى إسطنبول',
          description: 'اكتشف جمال إسطنبول التاريخية',
          price: 1800,
          duration: 4,
          location: 'إسطنبول، تركيا',
          images: ['https://via.placeholder.com/300x200'],
          rating: 4.8,
          reviewCount: 95,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      set({ packages: mockPackages, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchPackageById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call - replace with actual API call
      const package_ = get().packages.find(p => p.id === id);
      set({ isLoading: false });
      return package_ || null;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
