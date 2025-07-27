import { create } from 'zustand';
import { vendorAPI } from '../services/api';

const useCartStore = create((set, get) => ({
  // State
  cartItems: [],
  cartSummary: null,
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Get all cart items
  fetchCartItems: async () => {
    try {
      set({ loading: true, error: null });
      const response = await vendorAPI.getCartItems();
      set({ cartItems: response.data || [], loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Add item to cart
  addToCart: async (cartData) => {
    try {
      set({ loading: true, error: null });
      const response = await vendorAPI.addToCart(cartData);
      
      // Refresh cart items
      await get().fetchCartItems();
      
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update cart item quantity
  updateCartItem: async (cartItemId, quantity) => {
    try {
      set({ loading: true, error: null });
      const response = await vendorAPI.updateCartItem(cartItemId, { quantity });
      
      // Update item in cart
      set(state => ({
        cartItems: state.cartItems.map(item => 
          item._id === cartItemId ? { ...item, quantity } : item
        ),
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Remove item from cart
  removeFromCart: async (cartItemId) => {
    try {
      set({ loading: true, error: null });
      const response = await vendorAPI.removeFromCart(cartItemId);
      
      // Remove item from cart
      set(state => ({
        cartItems: state.cartItems.filter(item => item._id !== cartItemId),
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear entire cart
  clearCart: async () => {
    try {
      set({ loading: true, error: null });
      const response = await vendorAPI.clearCart();
      
      set({ cartItems: [], loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get cart summary
  fetchCartSummary: async () => {
    try {
      set({ loading: true, error: null });
      const response = await vendorAPI.getCartSummary();
      set({ cartSummary: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Utility functions
  getCartItemCount: () => {
    const { cartItems } = get();
    return cartItems.length;
  },

  getCartTotalQuantity: () => {
    const { cartItems } = get();
    return cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  },

  getCartTotalAmount: () => {
    const { cartItems } = get();
    return cartItems.reduce((total, item) => {
      const itemTotal = (item.materialId?.pricePerUnit || 0) * (item.quantity || 0);
      return total + itemTotal;
    }, 0);
  },

  getCartItemById: (itemId) => {
    const { cartItems } = get();
    return cartItems.find(item => item._id === itemId);
  },

  getCartItemByMaterialId: (materialId) => {
    const { cartItems } = get();
    return cartItems.find(item => item.materialId?._id === materialId);
  },

  // Check if material is in cart
  isMaterialInCart: (materialId) => {
    const { cartItems } = get();
    return cartItems.some(item => item.materialId?._id === materialId);
  },

  // Get cart items by supplier
  getCartItemsBySupplier: (supplierId) => {
    const { cartItems } = get();
    return cartItems.filter(item => item.supplierId?._id === supplierId);
  },

  // Group cart items by supplier
  getCartItemsGroupedBySupplier: () => {
    const { cartItems } = get();
    const grouped = {};
    
    cartItems.forEach(item => {
      const supplierId = item.supplierId?._id;
      if (!grouped[supplierId]) {
        grouped[supplierId] = {
          supplier: item.supplierId,
          items: []
        };
      }
      grouped[supplierId].items.push(item);
    });
    
    return Object.values(grouped);
  },

  // Clear current cart
  clearCurrentCart: () => set({ cartItems: [], cartSummary: null }),

  // Reset store
  reset: () => set({
    cartItems: [],
    cartSummary: null,
    loading: false,
    error: null
  }),
}));

export { useCartStore }; 