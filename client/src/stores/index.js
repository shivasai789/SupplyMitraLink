// Main store index file
export { useAuthStore } from './useAuthStore';
export { useSupplierStore } from './useSupplierStore';
export { useVendorStore } from './useVendorStore';
export { useOrderStore } from './useOrderStore';
export { useCartStore } from './useCartStore';
export { useFeedbackStore } from './useFeedbackStore';

// Store initialization helper
export const initializeStores = () => {
  // This function can be used to initialize stores with default data
  // or perform any setup required for the stores
};

// Store reset helper
export const resetAllStores = () => {
  // This function can be used to reset all stores to their initial state
  // Useful for logout or app reset scenarios
}; 