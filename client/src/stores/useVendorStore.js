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
      suppliersLoading: false,
      error: null,
      suppliersPerformance: [],
      
      // Cache tracking
      lastFetchTime: {
        profile: null,
        materials: null,
        suppliers: null,
        suppliersPerformance: null
      },
      isFetching: {
        profile: false,
        materials: false,
        suppliers: false,
        suppliersPerformance: false
      },

      // Actions
      fetchProfile: async () => {
        const state = get();
        
        // Prevent duplicate requests
        if (state.isFetching.profile) {
          return state.profile;
        }
        
        // Check if we have recent data (cache for 5 minutes)
        const now = Date.now();
        const cacheTime = 5 * 60 * 1000; // 5 minutes
        if (state.profile && state.lastFetchTime.profile && 
            (now - state.lastFetchTime.profile) < cacheTime) {
          return state.profile;
        }
        set({ 
          loading: true, 
          error: null,
          isFetching: { ...state.isFetching, profile: true }
        });
        
        try {
          const response = await vendorAPI.getProfile();
          set({ 
            profile: response.data, 
            loading: false,
            lastFetchTime: { ...state.lastFetchTime, profile: now },
            isFetching: { ...state.isFetching, profile: false }
          });
          return response.data;
        } catch (error) {
          set({ 
            error: error.message, 
            loading: false,
            isFetching: { ...state.isFetching, profile: false }
          });
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
        const state = get();
        
        // Prevent duplicate requests
        if (state.isFetching.materials) {
          return state.materials;
        }
        
        // Check if we have recent data (cache for 2 minutes)
        const now = Date.now();
        const cacheTime = 2 * 60 * 1000; // 2 minutes
        if (state.materials.length > 0 && state.lastFetchTime.materials && 
            (now - state.lastFetchTime.materials) < cacheTime) {
          return state.materials;
        }
        set({ 
          loading: true, 
          error: null,
          isFetching: { ...state.isFetching, materials: true }
        });
        
        try {
          const response = await vendorAPI.getAllMaterials();
          // Extract the data array from the API response
          const materialsData = response?.data || response || [];
          set({ 
            materials: materialsData, 
            loading: false,
            lastFetchTime: { ...state.lastFetchTime, materials: now },
            isFetching: { ...state.isFetching, materials: false }
          });
          return response;
        } catch (error) {
          set({ 
            error: error.message, 
            loading: false,
            isFetching: { ...state.isFetching, materials: false }
          });
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

      // Supplier APIs
      fetchSuppliers: async () => {
        const state = get();
        
        // Prevent duplicate requests
        if (state.isFetching.suppliers) {
          return state.suppliers;
        }
        
        // Check if we have recent data (cache for 5 minutes)
        const now = Date.now();
        const cacheTime = 5 * 60 * 1000; // 5 minutes
        if (state.suppliers.length > 0 && state.lastFetchTime.suppliers && 
            (now - state.lastFetchTime.suppliers) < cacheTime) {
          return state.suppliers;
        }
        set({ 
          suppliersLoading: true, 
          error: null,
          isFetching: { ...state.isFetching, suppliers: true }
        });
        
        try {
          const response = await vendorAPI.getSuppliers();
          set({ 
            suppliers: response.data || [], 
            suppliersLoading: false,
            lastFetchTime: { ...state.lastFetchTime, suppliers: now },
            isFetching: { ...state.isFetching, suppliers: false }
          });
          return response.data;
        } catch (error) {
          set({ 
            error: error.message, 
            suppliersLoading: false,
            isFetching: { ...state.isFetching, suppliers: false }
          });
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
        const state = get();
        
        // Prevent duplicate requests
        if (state.isFetching.suppliersPerformance) {
          return state.suppliersPerformance;
        }
        
        // Check if we have recent data (cache for 5 minutes)
        const now = Date.now();
        const cacheTime = 5 * 60 * 1000; // 5 minutes
        if (state.suppliersPerformance.length > 0 && state.lastFetchTime.suppliersPerformance && 
            (now - state.lastFetchTime.suppliersPerformance) < cacheTime) {
          return state.suppliersPerformance;
        }
        
        set({ 
          loading: true, 
          error: null,
          isFetching: { ...state.isFetching, suppliersPerformance: true }
        });
        
        try {
          const response = await vendorAPI.getAllSuppliersPerformance();
          set({ 
            suppliersPerformance: response.data, 
            loading: false,
            lastFetchTime: { ...state.lastFetchTime, suppliersPerformance: now },
            isFetching: { ...state.isFetching, suppliersPerformance: false }
          });
          return response.data;
        } catch (error) {
          set({ 
            error: error.message, 
            loading: false,
            isFetching: { ...state.isFetching, suppliersPerformance: false }
          });
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

      // Force refresh functions (bypass cache)
      forceRefreshMaterials: async () => {
        const state = get();
        set({ 
          lastFetchTime: { ...state.lastFetchTime, materials: null },
          isFetching: { ...state.isFetching, materials: false }
        });
        return get().fetchAllMaterials();
      },

      forceRefreshProfile: async () => {
        const state = get();
        set({ 
          lastFetchTime: { ...state.lastFetchTime, profile: null },
          isFetching: { ...state.isFetching, profile: false }
        });
        return get().fetchProfile();
      },

      // Reset store
      reset: () => set({
        profile: null,
        materials: [],
        suppliers: [],
        suppliersPerformance: [],
        loading: false,
        suppliersLoading: false,
        error: null,
        lastFetchTime: {
          profile: null,
          materials: null,
          suppliers: null,
          suppliersPerformance: null
        },
        isFetching: {
          profile: false,
          materials: false,
          suppliers: false,
          suppliersPerformance: false
        }
      }),
    }),
    {
      name: 'vendor-store',
    }
  )
); 