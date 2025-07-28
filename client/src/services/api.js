import { API_BASE_URL, API_TIMEOUT, AUTH_TOKEN_KEY, ERROR_MESSAGES } from '../utils/constants';

/**
 * API Endpoints Documentation
 * 
 * Server runs on: http://localhost:8080
 * Base API URL: http://localhost:8080/api
 * 
 * Available Endpoints:
 * 
 * AUTH ENDPOINTS (No authentication required):
 * - POST /api/auth/signup - User registration
 * - POST /api/auth/login - User login
 * 
 * PROTECTED ENDPOINTS (Authentication required):
 * - GET /api/user/profile - Get user profile
 * - PUT /api/user/profile - Update user profile
 * 
 * MATERIAL ENDPOINTS (Authentication + Supplier role required for write operations):
 * - GET /api/material - Get all materials (supplier's own materials)
 * - GET /api/material/:id - Get specific material
 * - POST /api/material - Create material (Supplier only)
 * - PUT /api/material/:id - Update material (Supplier only)
 * - DELETE /api/material/:id - Delete material (Supplier only)
 * 
 * CART ENDPOINTS (Authentication + Vendor role required):
 * - GET /api/cart - Get all cart items
 * - GET /api/cart/summary - Get cart summary
 * - GET /api/cart/:id - Get specific cart item
 * - POST /api/cart/add - Add item to cart
 * - PUT /api/cart/:id - Update cart item
 * - DELETE /api/cart/:id - Remove item from cart
 * - DELETE /api/cart - Clear cart
 * 
 * ORDER ENDPOINTS (Authentication + Role-based access):
 * Vendor endpoints:
 * - GET /api/order/vendor - Get vendor orders
 * - POST /api/order/vendor - Create vendor order
 * - GET /api/order/vendor/stats - Get vendor order stats
 * 
 * Supplier endpoints:
 * - GET /api/order/supplier - Get supplier orders
 * - GET /api/order/supplier/stats - Get supplier order stats
 * - PATCH /api/order/supplier/:id/status - Update order status (Supplier only)
 * 
 * Common order endpoints:
 * - GET /api/order/:id - Get order details
 * 
 * REVIEW ENDPOINTS (Authentication + Vendor role required):
 * - GET /api/review/:id - Get reviews for material
 * - POST /api/review - Create review (Vendor only)
 * - PUT /api/review/:id - Update review (Vendor only)
 * - DELETE /api/review/:id - Delete review (Vendor only)
 * 
 * ADDRESS ENDPOINTS (Authentication required):
 * - GET /api/address - Get all addresses
 * - GET /api/address/:id - Get specific address
 * - POST /api/address - Create address
 * - PUT /api/address/:id - Update address
 * - DELETE /api/address/:id - Delete address
 * 
 * UPLOAD ENDPOINTS (Authentication required):
 * - POST /api/upload/multiple - Upload multiple images
 */

/**
 * Base API service class
 */
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
  }

  /**
   * Get auth token from localStorage
   */
  getAuthToken() {
    // Get token from auth store instead of localStorage
    const authStorage = localStorage.getItem('auth-storage');
    
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage);
        const token = authData.state?.token || null;
        return token;
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  /**
   * Set auth token in localStorage
   */
  setAuthToken(token) {
    // This method is kept for compatibility but the token is managed by the auth store
  }

  /**
   * Create headers for API requests
   */
  createHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Make API request with timeout and error handling
   */
  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Don't apply default headers if custom headers are provided (for file uploads)
      const headers = options.headers || {
        ...this.createHeaders(options.includeAuth !== false),
      };

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
      }
      
      if (error.message.includes('HTTP 401')) {
        this.setAuthToken(null);
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }
      
      if (error.message.includes('HTTP 403')) {
        throw new Error(ERROR_MESSAGES.FORBIDDEN);
      }
      
      if (error.message.includes('HTTP 404')) {
        throw new Error(ERROR_MESSAGES.NOT_FOUND);
      }
      
      if (error.message.includes('HTTP 500')) {
        throw new Error(ERROR_MESSAGES.SERVER_ERROR);
      }
      
      throw new Error(error.message || ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}, includeAuth = true) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    return this.makeRequest(url.toString(), {
      method: 'GET',
      includeAuth,
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}, includeAuth = true) {
    return this.makeRequest(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth,
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}, includeAuth = true) {
    return this.makeRequest(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      includeAuth,
    });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data = {}, includeAuth = true) {
    return this.makeRequest(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      includeAuth,
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, includeAuth = true) {
    return this.makeRequest(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      includeAuth,
    });
  }

  /**
   * Upload file
   */
  async uploadFile(endpoint, file, includeAuth = true) {
    const formData = new FormData();
    formData.append('file', file);

    // Get the token directly
    const token = this.getAuthToken();

    // Create headers manually for file upload
    const headers = {};
    if (includeAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type - let browser set it for FormData

    return this.makeRequest(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      body: formData,
      headers,
      includeAuth: false, // Don't let makeRequest override our headers
    });
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(endpoint, files, includeAuth = true) {
    const formData = new FormData();
    
    // Add up to 5 images to FormData
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      formData.append('images', files[i]);
    }

    // Get the token directly
    const token = this.getAuthToken();

    // Create headers manually for file upload
    const headers = {};
    if (includeAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type - let browser set it for FormData

    return this.makeRequest(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      body: formData,
      headers,
      includeAuth: false, // Don't let makeRequest override our headers
    });
  }

  // ===== AUTH ENDPOINTS =====
  
  /**
   * User registration
   */
  async signup(userData) {
    return this.post('/auth/signup', userData, false);
  }

  /**
   * User login
   */
  async login(credentials) {
    return this.post('/auth/login', credentials, false);
  }

  // ===== USER ENDPOINTS =====
  
  /**
   * Get user profile
   */
  async getUserProfile() {
    const result = await this.get('/user/profile');
    return result;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates) {
    const result = await this.put('/user/profile', updates);
    return result;
  }

  // ===== MATERIAL ENDPOINTS =====
  
  /**
   * Get all materials (supplier's own materials)
   */
  async getMaterials() {
    const result = await this.get('/material');
    return result;
  }

  /**
   * Get specific material
   */
  async getMaterial(materialId) {
    return this.get(`/material/${materialId}`);
  }

  /**
   * Create material (Supplier only)
   */
  async createMaterial(materialData) {
    const result = await this.post('/material', materialData);
    return result;
  }

  /**
   * Update material (Supplier only)
   */
  async updateMaterial(materialId, updates) {
    const result = await this.put(`/material/${materialId}`, updates);
    return result;
  }

  /**
   * Delete material (Supplier only)
   */
  async deleteMaterial(materialId) {
    const result = await this.delete(`/material/${materialId}`);
    return result;
  }

  // ===== CART ENDPOINTS =====
  
  /**
   * Get all cart items
   */
  async getCartItems() {
    return this.get('/cart');
  }

  /**
   * Get cart summary
   */
  async getCartSummary() {
    return this.get('/cart/summary');
  }

  /**
   * Get specific cart item
   */
  async getCartItem(cartItemId) {
    return this.get(`/cart/${cartItemId}`);
  }

  /**
   * Add item to cart
   */
  async addToCart(cartData) {
    return this.post('/cart/add', cartData);
  }

  /**
   * Update cart item
   */
  async updateCartItem(cartItemId, updates) {
    return this.put(`/cart/${cartItemId}`, updates);
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(cartItemId) {
    return this.delete(`/cart/${cartItemId}`);
  }

  /**
   * Clear cart
   */
  async clearCart() {
    return this.delete('/cart');
  }

  // ===== ORDER ENDPOINTS =====
  
  // Vendor Order Endpoints
  /**
   * Get vendor orders
   */
  async getVendorOrders() {
    return this.get('/order/vendor');
  }

  /**
   * Create vendor order
   */
  async createVendorOrder(orderData) {
    return this.post('/order/vendor', orderData);
  }

  /**
   * Get vendor order stats
   */
  async getVendorOrderStats() {
    return this.get('/order/vendor/stats');
  }

  // Supplier Order Endpoints
  /**
   * Get supplier orders
   */
  async getSupplierOrders() {
    return this.get('/order/supplier');
  }

  /**
   * Get supplier order stats
   */
  async getSupplierOrderStats() {
    return this.get('/order/supplier/stats');
  }

  /**
   * Update order status (Supplier only)
   */
  async updateOrderStatus(orderId, statusData) {
    return this.patch(`/order/supplier/${orderId}/status`, statusData);
  }

  // Common Order Endpoints
  /**
   * Get order details
   */
  async getOrderDetails(orderId) {
    return this.get(`/order/${orderId}`);
  }

  // ===== REVIEW ENDPOINTS =====
  
  /**
   * Get reviews for material
   */
  async getReviews(materialId) {
    return this.get(`/review/${materialId}`);
  }

  /**
   * Create review (Vendor only)
   */
  async createReview(reviewData) {
    return this.post('/review', reviewData);
  }

  /**
   * Update review (Vendor only)
   */
  async updateReview(reviewId, updates) {
    return this.put(`/review/${reviewId}`, updates);
  }

  /**
   * Delete review (Vendor only)
   */
  async deleteReview(reviewId) {
    return this.delete(`/review/${reviewId}`);
  }

  // ===== ADDRESS ENDPOINTS =====
  
  /**
   * Get all addresses
   */
  async getAddresses() {
    return this.get('/address');
  }

  /**
   * Get specific address
   */
  async getAddress(addressId) {
    return this.get(`/address/${addressId}`);
  }

  /**
   * Create address
   */
  async createAddress(addressData) {
    return this.post('/address', addressData);
  }

  /**
   * Update address
   */
  async updateAddress(addressId, updates) {
    return this.put(`/address/${addressId}`, updates);
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId) {
    return this.delete(`/address/${addressId}`);
  }

  // ===== UPLOAD ENDPOINTS =====
  
  /**
   * Upload multiple images
   */
  async uploadMultipleImages(files) {
    return this.uploadMultipleFiles('/upload/multiple', files);
  }
}

// Create singleton instance
const apiService = new ApiService();

// Export the main API service
export default apiService;

// Export vendor-specific API functions
export const vendorAPI = {
  // Profile APIs
  getProfile: () => apiService.getUserProfile(),
  updateProfile: (updates) => apiService.updateUserProfile(updates),
  
  // Material APIs (for browsing)
  getAllMaterials: () => apiService.getMaterials(),
  getMaterial: (materialId) => apiService.getMaterial(materialId),
  
  // Cart APIs
  getCartItems: () => apiService.getCartItems(),
  getCartSummary: () => apiService.getCartSummary(),
  getCartItem: (cartItemId) => apiService.getCartItem(cartItemId),
  addToCart: (cartData) => apiService.addToCart(cartData),
  updateCartItem: (cartItemId, updates) => apiService.updateCartItem(cartItemId, updates),
  removeFromCart: (cartItemId) => apiService.removeFromCart(cartItemId),
  clearCart: () => apiService.clearCart(),
  
  // Order APIs
  getVendorOrders: () => apiService.getVendorOrders(),
  createVendorOrder: (orderData) => apiService.createVendorOrder(orderData),
  getVendorOrderStats: () => apiService.getVendorOrderStats(),
  getOrderDetails: (orderId) => apiService.getOrderDetails(orderId),
  
  // Review APIs
  getReviews: (materialId) => apiService.getReviews(materialId),
  createReview: (reviewData) => apiService.createReview(reviewData),
  updateReview: (reviewId, updates) => apiService.updateReview(reviewId, updates),
  deleteReview: (reviewId) => apiService.deleteReview(reviewId),
  
  // Address APIs
  getAddresses: () => apiService.getAddresses(),
  getAddress: (addressId) => apiService.getAddress(addressId),
  createAddress: (addressData) => apiService.createAddress(addressData),
  updateAddress: (addressId, updates) => apiService.updateAddress(addressId, updates),
  deleteAddress: (addressId) => apiService.deleteAddress(addressId),
  
  // Supplier detail APIs
  getSupplierDetails: (supplierId) => {
    return apiService.get(`/user/supplier/${supplierId}/details`);
  },
  getSupplierProducts: (supplierId) => {
    return apiService.get(`/user/supplier/${supplierId}/products`);
  },
  getSupplierPerformance: (supplierId) => {
    return apiService.get(`/user/supplier/${supplierId}/performance`);
  },
  getAllSuppliersPerformance: () => apiService.get('/user/suppliers/performance'),
};

// Export supplier-specific API functions
export const supplierAPI = {
  // Profile APIs
  getProfile: () => apiService.getUserProfile(),
  updateProfile: (updates) => apiService.updateUserProfile(updates),
  
  // Material APIs (CRUD operations)
  getMaterials: () => apiService.getMaterials(),
  getMaterial: (materialId) => apiService.getMaterial(materialId),
  createMaterial: (materialData) => apiService.createMaterial(materialData),
  updateMaterial: (materialId, updates) => apiService.updateMaterial(materialId, updates),
  deleteMaterial: (materialId) => apiService.deleteMaterial(materialId),
  
  // Order APIs
  getSupplierOrders: () => apiService.getSupplierOrders(),
  getSupplierOrderStats: () => apiService.getSupplierOrderStats(),
  updateOrderStatus: (orderId, statusData) => apiService.updateOrderStatus(orderId, statusData),
  getOrderDetails: (orderId) => apiService.getOrderDetails(orderId),
  
  // Dashboard APIs
  getDashboardStats: () => apiService.getSupplierOrderStats(),
  
  // Inventory Management APIs
  getInventory: (params = {}) => apiService.get('/inventory', params),
  bulkUpdateInventory: (updates) => apiService.put('/inventory/bulk', updates),
  getLowStockAlerts: (threshold = 10) => apiService.get(`/inventory/low-stock?threshold=${threshold}`),
  
  // Customer Management APIs
  getCustomers: (params = {}) => apiService.get('/customers', params),
  getCustomerDetails: (customerId) => apiService.get(`/customers/${customerId}`),
  
  // Pricing Management APIs
  getPricingStrategies: () => apiService.get('/pricing/strategies'),
  bulkUpdatePricing: (updates, strategy) => apiService.put('/pricing/bulk', { updates, strategy }),
  
  // Review APIs (for viewing reviews on their materials)
  getReviews: (materialId) => apiService.getReviews(materialId),
  
  // Address APIs
  getAddresses: () => apiService.getAddresses(),
  getAddress: (addressId) => apiService.getAddress(addressId),
  createAddress: (addressData) => apiService.createAddress(addressData),
  updateAddress: (addressId, updates) => apiService.updateAddress(addressId, updates),
  deleteAddress: (addressId) => apiService.deleteAddress(addressId),
  
  // Upload APIs
  uploadMultipleImages: (files) => apiService.uploadMultipleImages(files),
}; 