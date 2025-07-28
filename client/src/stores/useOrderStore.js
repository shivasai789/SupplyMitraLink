import { create } from 'zustand';
import { vendorAPI, supplierAPI } from '../services/api';

const useOrderStore = create((set, get) => ({
  // State
  orders: [],
  activeOrders: [],
  mapOrders: [],
  dashboardStats: null,
  currentOrder: null,
  orderStats: null,
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Get all vendor orders
  fetchVendorOrders: async () => {
    try {
      set({ loading: true, error: null });
      const response = await vendorAPI.getVendorOrders();
      const ordersData = response.data || [];
      
      // Filter active orders (pending, confirmed, packed, in_transit, out_for_delivery)
      const activeOrdersData = ordersData.filter(order => 
        ['pending', 'confirmed', 'packed', 'in_transit', 'out_for_delivery'].includes(order?.status)
      );
      
      set({ 
        orders: ordersData, 
        activeOrders: activeOrdersData,
        loading: false 
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get all supplier orders
  fetchSupplierOrders: async () => {
    try {
      set({ loading: true, error: null });
      const response = await supplierAPI.getSupplierOrders();
      const ordersData = response.data || [];
      
      // Filter active orders (pending, confirmed, packed, in_transit, out_for_delivery)
      const activeOrdersData = ordersData.filter(order => 
        ['pending', 'confirmed', 'packed', 'in_transit', 'out_for_delivery'].includes(order?.status)
      );
      
      set({ 
        orders: ordersData, 
        activeOrders: activeOrdersData,
        loading: false 
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get all orders (generic function)
  fetchOrders: async () => {
    try {
      set({ loading: true, error: null });
      const response = await supplierAPI.getSupplierOrders();
      const ordersData = response.data || [];
      
      // Filter active orders (pending, confirmed, packed, in_transit, out_for_delivery)
      const activeOrdersData = ordersData.filter(order => 
        ['pending', 'confirmed', 'packed', 'in_transit', 'out_for_delivery'].includes(order?.status)
      );
      
      set({ 
        orders: ordersData, 
        activeOrders: activeOrdersData,
        loading: false 
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get order details
  fetchOrderDetails: async (orderId) => {
    try {
      set({ loading: true, error: null });
      const response = await vendorAPI.getOrderDetails(orderId);
      set({ currentOrder: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Create new order (vendor only)
  createOrder: async (orderData) => {
    try {
      set({ loading: true, error: null });
      const response = await vendorAPI.createVendorOrder(orderData);
      
      // Add new order to the list
      const newOrder = response.data;
      set(state => ({
        orders: [newOrder, ...state.orders],
        loading: false
      }));
      
      return newOrder;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get vendor order statistics
  fetchVendorOrderStats: async () => {
    try {
      set({ loading: true, error: null });
      const response = await vendorAPI.getVendorOrderStats();
      set({ orderStats: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get supplier order statistics
  fetchSupplierOrderStats: async () => {
    try {
      set({ loading: true, error: null });
      const response = await supplierAPI.getSupplierOrderStats();
      set({ orderStats: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get dashboard statistics (vendor)
  fetchVendorDashboardStats: async () => {
    try {
      set({ loading: true, error: null });
      const response = await vendorAPI.getVendorOrderStats();
      
      // Transform order stats into dashboard stats format
      const stats = response.data || {};
      const dashboardStats = {
        pendingOrders: stats.pendingOrders || 0,
        confirmedOrders: stats.confirmedOrders || 0,
        activeOrders: stats.activeOrders || 0,
        completedOrders: stats.completedOrders || 0,
        totalOrders: stats.totalOrders || 0,
        totalAmount: stats.totalAmount || 0,
        averageOrderValue: stats.averageOrderValue || 0,
        monthlyOrders: stats.monthlyOrders || 0,
        monthlyAmount: stats.monthlyAmount || 0
      };
      
      set({ dashboardStats, loading: false });
      return dashboardStats;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get dashboard statistics (supplier)
  fetchSupplierDashboardStats: async () => {
    try {
      set({ loading: true, error: null });
      const response = await supplierAPI.getSupplierOrderStats();
      
      // Transform order stats into dashboard stats format
      const stats = response.data || {};
      const dashboardStats = {
        pendingOrders: stats.pendingOrders || 0,
        confirmedOrders: stats.confirmedOrders || 0,
        activeOrders: stats.activeOrders || 0,
        completedOrders: stats.completedOrders || 0,
        totalOrders: stats.totalOrders || 0,
        totalAmount: stats.totalAmount || 0,
        averageOrderValue: stats.averageOrderValue || 0,
        monthlyOrders: stats.monthlyOrders || 0,
        monthlyAmount: stats.monthlyAmount || 0
      };
      
      set({ dashboardStats, loading: false });
      return dashboardStats;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get dashboard statistics (generic function)
  fetchDashboardStats: async () => {
    try {
      set({ loading: true, error: null });
      const response = await supplierAPI.getSupplierOrderStats();
      
      // Transform order stats into dashboard stats format
      const stats = response.data || {};
      const dashboardStats = {
        pendingOrders: stats.pendingOrders || 0,
        confirmedOrders: stats.confirmedOrders || 0,
        activeOrders: stats.activeOrders || 0,
        completedOrders: stats.completedOrders || 0,
        totalOrders: stats.totalOrders || 0,
        totalAmount: stats.totalAmount || 0,
        averageOrderValue: stats.averageOrderValue || 0,
        monthlyOrders: stats.monthlyOrders || 0,
        monthlyAmount: stats.monthlyAmount || 0
      };
      
      set({ dashboardStats, loading: false });
      return dashboardStats;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get map orders (vendor)
  fetchVendorMapOrders: async () => {
    try {
      set({ loading: true, error: null });
      const response = await vendorAPI.getVendorOrders();
      const ordersData = response.data || [];
      
      // Filter orders for map display (active orders with location data)
      const mapOrdersData = ordersData.filter(order => 
        ['pending', 'confirmed', 'packed', 'in_transit', 'out_for_delivery'].includes(order?.status) &&
        order?.supplierAddressId
      );
      
      set({ mapOrders: mapOrdersData, loading: false });
      return mapOrdersData;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get map orders (supplier)
  fetchSupplierMapOrders: async () => {
    try {
      set({ loading: true, error: null });
      const response = await supplierAPI.getSupplierOrders();
      const ordersData = response.data || [];
      
      // Filter orders for map display (active orders with location data)
      const mapOrdersData = ordersData.filter(order => 
        ['pending', 'confirmed', 'packed', 'in_transit', 'out_for_delivery'].includes(order?.status) &&
        order?.vendorAddressId
      );
      
      set({ mapOrders: mapOrdersData, loading: false });
      return mapOrdersData;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get map orders (generic function)
  fetchMapOrders: async () => {
    try {
      set({ loading: true, error: null });
      const response = await supplierAPI.getSupplierOrders();
      const ordersData = response.data || [];
      
      // Filter orders for map display (active orders with location data)
      const mapOrdersData = ordersData.filter(order => 
        ['pending', 'confirmed', 'packed', 'in_transit', 'out_for_delivery'].includes(order?.status) &&
        order?.vendorAddressId
      );
      
      set({ mapOrders: mapOrdersData, loading: false });
      return mapOrdersData;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status, note) => {
    try {
      set({ loading: true, error: null });
      const response = await supplierAPI.updateOrderStatus(orderId, { status, note });
      
      // Update order in the list
      set(state => ({
        orders: state.orders.map(order => 
          order._id === orderId ? { ...order, status: response.data.status } : order
        ),
        currentOrder: state.currentOrder?._id === orderId ? { ...state.currentOrder, status: response.data.status } : state.currentOrder,
        loading: false
      }));

      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Filter orders by status
  getOrdersByStatus: (status) => {
    const { orders } = get();
    return Array.isArray(orders) ? orders.filter(order => order?.status === status) : [];
  },

  // Get orders count by status
  getOrdersCountByStatus: () => {
    const { orders } = get();
    const counts = {
      pending: 0,
      confirmed: 0,
      packed: 0,
      in_transit: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0
    };

    if (Array.isArray(orders)) {
      orders.forEach(order => {
        if (order?.status && counts.hasOwnProperty(order.status)) {
          counts[order.status]++;
        }
      });
    }

    return counts;
  },

  // Calculate total order value
  getTotalOrderValue: () => {
    const { orders } = get();
    return Array.isArray(orders) ? orders.reduce((total, order) => total + (order?.totalAmount || 0), 0) : 0;
  },

  // Get recent orders
  getRecentOrders: (limit = 5) => {
    const { orders } = get();
    if (!Array.isArray(orders)) return [];
    return orders
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      .slice(0, limit);
  },

  // Clear current order
  clearCurrentOrder: () => set({ currentOrder: null }),

  // Reset store
  reset: () => set({
    orders: [],
    activeOrders: [],
    mapOrders: [],
    dashboardStats: null,
    currentOrder: null,
    orderStats: null,
    loading: false,
    error: null
  }),
}));

export { useOrderStore }; 