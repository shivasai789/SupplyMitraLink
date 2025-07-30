import { create } from 'zustand';
import { vendorAPI } from '../services/api';

const cartStore = create((set, get) => ({
  // State
  cartItems: [],
  cartSummary: null,
  loading: false,
  error: null,
  
  // Cache tracking
  lastFetchTime: {
    cartItems: null,
    cartSummary: null
  },
  isFetching: {
    cartItems: false,
    cartSummary: false
  },

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Get all cart items
  fetchCartItems: async () => {
    const state = get();
    
    // Prevent duplicate requests
    if (state.isFetching.cartItems) {
      return state.cartItems;
    }
    
    // Check if we have recent data (cache for 1 minute)
    const now = Date.now();
    const cacheTime = 1 * 60 * 1000; // 1 minute
    if (state.cartItems.length > 0 && state.lastFetchTime.cartItems && 
        (now - state.lastFetchTime.cartItems) < cacheTime) {
      return state.cartItems;
    }
    
    set({ 
      loading: true, 
      error: null,
      isFetching: { ...state.isFetching, cartItems: true }
    });
    
    try {
      const response = await vendorAPI.getCartItems();
      set({ 
        cartItems: response.data || [], 
        loading: false,
        lastFetchTime: { ...state.lastFetchTime, cartItems: now },
        isFetching: { ...state.isFetching, cartItems: false }
      });
      return response.data;
    } catch (error) {
      set({ 
        error: error.message, 
        loading: false,
        isFetching: { ...state.isFetching, cartItems: false }
      });
      throw error;
    }
  },

  // Add item to cart
  addToCart: async (cartData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await vendorAPI.addToCart(cartData);
      
      // Update cart items optimistically
      const newItem = response.data;
      set(state => ({
        cartItems: [...state.cartItems, newItem],
        loading: false,
        lastFetchTime: { ...state.lastFetchTime, cartItems: Date.now() }
      }));
      
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update cart item quantity
  updateCartItem: async (cartItemId, quantity) => {
    set({ loading: true, error: null });
    
    try {
      const response = await vendorAPI.updateCartItem(cartItemId, { quantity });
      
      // Update item in cart optimistically
      set(state => ({
        cartItems: state.cartItems.map(item => 
          item._id === cartItemId ? { ...item, quantity } : item
        ),
        loading: false,
        lastFetchTime: { ...state.lastFetchTime, cartItems: Date.now() }
      }));
      
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Remove item from cart
  removeFromCart: async (cartItemId) => {
    set({ loading: true, error: null });
    
    try {
      const response = await vendorAPI.removeFromCart(cartItemId);
      
      // Remove item from cart optimistically
      set(state => ({
        cartItems: state.cartItems.filter(item => item._id !== cartItemId),
        loading: false,
        lastFetchTime: { ...state.lastFetchTime, cartItems: Date.now() }
      }));
      
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear entire cart
  clearCart: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await vendorAPI.clearCart();
      
      set({ 
        cartItems: [], 
        loading: false,
        lastFetchTime: { ...get().lastFetchTime, cartItems: Date.now() }
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get cart summary
  fetchCartSummary: async () => {
    const state = get();
    
    // Prevent duplicate requests
    if (state.isFetching.cartSummary) {
      return state.cartSummary;
    }
    
    // Check if we have recent data (cache for 1 minute)
    const now = Date.now();
    const cacheTime = 1 * 60 * 1000; // 1 minute
    if (state.cartSummary && state.lastFetchTime.cartSummary && 
        (now - state.lastFetchTime.cartSummary) < cacheTime) {
      return state.cartSummary;
    }
    
    set({ 
      loading: true, 
      error: null,
      isFetching: { ...state.isFetching, cartSummary: true }
    });
    
    try {
      const response = await vendorAPI.getCartSummary();
      set({ 
        cartSummary: response.data, 
        loading: false,
        lastFetchTime: { ...state.lastFetchTime, cartSummary: now },
        isFetching: { ...state.isFetching, cartSummary: false }
      });
      return response.data;
    } catch (error) {
      set({ 
        error: error.message, 
        loading: false,
        isFetching: { ...state.isFetching, cartSummary: false }
      });
      throw error;
    }
  },

  // Force refresh functions (bypass cache)
  forceRefreshCartItems: async () => {
    const state = get();
    set({ 
      lastFetchTime: { ...state.lastFetchTime, cartItems: null },
      isFetching: { ...state.isFetching, cartItems: false }
    });
    return get().fetchCartItems();
  },

  forceRefreshCartSummary: async () => {
    const state = get();
    set({ 
      lastFetchTime: { ...state.lastFetchTime, cartSummary: null },
      isFetching: { ...state.isFetching, cartSummary: false }
    });
    return get().fetchCartSummary();
  },

  // Utility functions
  getCartItemById: (itemId) => {
    const { cartItems } = get();
    return cartItems.find(item => item._id === itemId);
  },

  getCartTotal: () => {
    const { cartItems } = get();
    return cartItems.reduce((total, item) => {
      const itemPrice = item.materialId?.pricePerUnit || 0;
      const itemQuantity = item.quantity || 0;
      return total + (itemPrice * itemQuantity);
    }, 0);
  },

  getCartItemCount: () => {
    const { cartItems } = get();
    return cartItems.reduce((count, item) => count + (item.quantity || 0), 0);
  },

  // Reset store
  reset: () => set({
    cartItems: [],
    cartSummary: null,
    loading: false,
    error: null,
    lastFetchTime: {
      cartItems: null,
      cartSummary: null
    },
    isFetching: {
      cartItems: false,
      cartSummary: false
    }
  }),
}));

export const useCartStore = cartStore; 