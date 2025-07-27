import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supplierAPI } from '../services/api';

export const useSupplierStore = create(
  devtools(
    (set, get) => ({
      // State
      profile: null,
      materials: [],
      dashboardStats: null,
      inventory: null,
      customers: null,
      pricingStrategies: null,
      performanceMetrics: null,
      lowStockAlerts: null,
      loading: false,
      error: null,

      // Actions
      fetchProfile: async () => {
        set({ loading: true, error: null });
        
        try {
          const response = await supplierAPI.getProfile();
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
          console.log('🔍 Updating profile with:', updates);
          const response = await supplierAPI.updateProfile(updates);
          console.log('✅ Profile update response:', response);
          
          set({ profile: response.data, loading: false });
          return response; // Return the full response object
        } catch (error) {
          console.error('❌ Error updating profile:', error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Materials API functions
      fetchMaterials: async () => {
        set({ loading: true, error: null });
        
        try {
          console.log('🔍 Fetching materials from API...');
          const response = await supplierAPI.getMaterials();
          console.log('📦 API Response:', response);
          
          // Extract the data array from the API response
          const materialsData = response?.data || response || [];
          console.log('📋 Materials data:', materialsData);
          
          set({ materials: materialsData, loading: false });
          return response;
        } catch (error) {
          console.error('❌ Error in fetchMaterials:', error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      createMaterial: async (materialData) => {
        set({ loading: true, error: null });
        
        try {
          console.log('🔍 Creating material:', materialData);
          const response = await supplierAPI.createMaterial(materialData);
          console.log('✅ Material created:', response);
          
          // Add the new material to the local state
          if (response?.data) {
            set(state => ({
              materials: [response.data, ...state.materials],
              loading: false
            }));
          } else {
            set({ loading: false });
          }
          
          return response;
        } catch (error) {
          console.error('❌ Error creating material:', error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateMaterial: async (materialId, updates) => {
        set({ loading: true, error: null });
        
        try {
          console.log('🔍 Updating material:', materialId, updates);
          const response = await supplierAPI.updateMaterial(materialId, updates);
          console.log('✅ Material updated:', response);
          
          // Update the material in local state
          if (response?.data) {
            set(state => ({
              materials: state.materials.map(material => 
                material._id === materialId ? response.data : material
              ),
              loading: false
            }));
          } else {
            set({ loading: false });
          }
          
          return response;
        } catch (error) {
          console.error('❌ Error updating material:', error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteMaterial: async (materialId) => {
        set({ loading: true, error: null });
        
        try {
          console.log('🔍 Deleting material:', materialId);
          const response = await supplierAPI.deleteMaterial(materialId);
          console.log('✅ Material deleted:', response);
          
          // Remove the material from local state
          set(state => ({
            materials: state.materials.filter(material => material._id !== materialId),
            loading: false
          }));
          
          return response;
        } catch (error) {
          console.error('❌ Error deleting material:', error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Upload API functions
      uploadImages: async (files) => {
        set({ loading: true, error: null });
        
        try {
          const response = await supplierAPI.uploadMultipleImages(files);
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

      // Utility functions
      getMaterial: (materialId) => {
        const { materials } = get();
        return materials.find(material => material._id === materialId);
      },

      getMaterialsByCategory: (category) => {
        const { materials } = get();
        return materials.filter(material => material.category === category);
      },

      // Add material to local state after creation
      addMaterial: (material) => {
        set(state => ({
          materials: [material, ...state.materials]
        }));
      },

      // Update material in local state
      updateMaterialInState: (materialId, updates) => {
        set(state => ({
          materials: state.materials.map(material => 
            material._id === materialId ? { ...material, ...updates } : material
          )
        }));
      },

      // Remove material from local state
      removeMaterial: (materialId) => {
        set(state => ({
          materials: state.materials.filter(material => material._id !== materialId)
        }));
      },

      // Dashboard Analytics
      fetchDashboardStats: async () => {
        set({ loading: true, error: null });
        
        try {
          const response = await supplierAPI.getDashboardStats();
          set({ dashboardStats: response.data, loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Inventory Management
      fetchInventory: async (params = {}) => {
        set({ loading: true, error: null });
        
        try {
          const response = await supplierAPI.getInventory(params);
          set({ inventory: response.data, loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      bulkUpdateInventory: async (updates) => {
        set({ loading: true, error: null });
        
        try {
          const response = await supplierAPI.bulkUpdateInventory(updates);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchLowStockAlerts: async (threshold = 10) => {
        set({ loading: true, error: null });
        
        try {
          const response = await supplierAPI.getLowStockAlerts(threshold);
          set({ lowStockAlerts: response.data, loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Customer Management
      fetchCustomers: async (params = {}) => {
        set({ loading: true, error: null });
        
        try {
          const response = await supplierAPI.getCustomers(params);
          set({ customers: response.data, loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchCustomerDetails: async (customerId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await supplierAPI.getCustomerDetails(customerId);
          set({ loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Pricing Management
      fetchPricingStrategies: async () => {
        set({ loading: true, error: null });
        
        try {
          const response = await supplierAPI.getPricingStrategies();
          set({ pricingStrategies: response.data, loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      bulkUpdatePricing: async (updates, strategy) => {
        set({ loading: true, error: null });
        
        try {
          const response = await supplierAPI.bulkUpdatePricing(updates, strategy);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Performance Metrics
      fetchPerformance: async (period = '1m') => {
        set({ loading: true, error: null });
        
        try {
          const response = await supplierAPI.getPerformance(period);
          set({ performanceMetrics: response.data, loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Reset store
      reset: () => set({
        profile: null,
        materials: [],
        dashboardStats: null,
        inventory: null,
        customers: null,
        pricingStrategies: null,
        performanceMetrics: null,
        lowStockAlerts: null,
        loading: false,
        error: null
      }),
    }),
    {
      name: 'supplier-store',
    }
  )
); 