import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { vendorAPI } from '../services/api';

export const useVendorStore = create(
  devtools(
    (set, get) => ({
      // State
      profile: null,
      materials: [],
      suppliers: [],
      loading: false,
      error: null,
      suppliersPerformance: [],

      // Actions
      fetchProfile: async () => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.getProfile();
          set({ profile: response.data, loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateProfile: async (updates) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.updateProfile(updates);
          set({ profile: response.data, loading: false });
          return response; // Return the full response object
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Materials API functions (for browsing)
      fetchAllMaterials: async () => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.getAllMaterials();
          // Extract the data array from the API response
          const materialsData = response?.data || response || [];
          console.log('Materials API response:', response);
          console.log('Materials data:', materialsData);
          console.log('First material details:', materialsData[0]);
          console.log('All materials images:', materialsData.map(m => ({ id: m._id, name: m.name, images: m.images, imagesLength: m.images?.length })));
          set({ materials: materialsData, loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      getMaterial: async (materialId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.getMaterial(materialId);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Address API functions
      fetchAddresses: async () => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.getAddresses();
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      getAddress: async (addressId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.getAddress(addressId);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      createAddress: async (addressData) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.createAddress(addressData);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateAddress: async (addressId, updates) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.updateAddress(addressId, updates);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteAddress: async (addressId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.deleteAddress(addressId);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Review API functions
      fetchReviews: async (materialId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.getReviews(materialId);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      createReview: async (reviewData) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.createReview(reviewData);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateReview: async (reviewId, updates) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.updateReview(reviewId, updates);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteReview: async (reviewId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.deleteReview(reviewId);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Supplier detail functions
      getSupplierDetails: async (supplierId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.getSupplierDetails(supplierId);
          set({ loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      getSupplierProducts: async (supplierId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.getSupplierProducts(supplierId);
          set({ loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      getSupplierPerformance: async (supplierId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.getSupplierPerformance(supplierId);
          set({ loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Fetch all suppliers' performance
      fetchAllSuppliersPerformance: async () => {
        set({ loading: true, error: null });
        try {
          const response = await vendorAPI.getAllSuppliersPerformance();
          set({ suppliersPerformance: response.data, loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Utility functions
      getMaterialById: (materialId) => {
        const { materials } = get();
        return materials.find(material => material._id === materialId);
      },

      getMaterialsByCategory: (category) => {
        const { materials } = get();
        return materials.filter(material => material.category === category);
      },

      getMaterialsBySupplier: (supplierId) => {
        const { materials } = get();
        return materials.filter(material => material.supplierId === supplierId);
      },

      searchMaterials: (searchTerm) => {
        const { materials } = get();
        const term = searchTerm.toLowerCase();
        return materials.filter(material => 
          material.name.toLowerCase().includes(term) ||
          material.description?.toLowerCase().includes(term) ||
          material.category?.toLowerCase().includes(term)
        );
      },

      filterMaterialsByPrice: (minPrice, maxPrice) => {
        const { materials } = get();
        return materials.filter(material => 
          material.pricePerUnit >= minPrice && material.pricePerUnit <= maxPrice
        );
      },

      filterMaterialsByRating: (minRating) => {
        const { materials } = get();
        return materials.filter(material => 
          material.averageRating >= minRating
        );
      },

      // Reset store
      reset: () => set({
        profile: null,
        materials: [],
        suppliers: [],
        suppliersPerformance: [],
        loading: false,
        error: null
      }),
    }),
    {
      name: 'vendor-store',
    }
  )
); 