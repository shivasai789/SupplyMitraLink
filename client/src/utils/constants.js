// Application Constants
export const APP_NAME = 'SupplyMitraLink';
export const APP_VERSION = '1.0.0';

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export const API_TIMEOUT = 30000; // 30 seconds

// Authentication
export const AUTH_TOKEN_KEY = 'supply_mitra_token';
export const AUTH_USER_KEY = 'supply_mitra_user';
export const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes

// User Roles
export const USER_ROLES = {
  VENDOR: 'vendor',
  SUPPLIER: 'supplier',
  ADMIN: 'admin'
};

// Order Statuses
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PACKED: 'packed',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Order Status Colors
export const ORDER_STATUS_COLORS = {
  [ORDER_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ORDER_STATUSES.CONFIRMED]: 'bg-blue-100 text-blue-800',
  [ORDER_STATUSES.PACKED]: 'bg-purple-100 text-purple-800',
  [ORDER_STATUSES.IN_TRANSIT]: 'bg-orange-100 text-orange-800',
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: 'bg-indigo-100 text-indigo-800',
  [ORDER_STATUSES.DELIVERED]: 'bg-green-100 text-green-800',
  [ORDER_STATUSES.CANCELLED]: 'bg-red-100 text-red-800'
};

// Product Categories
export const PRODUCT_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Dairy',
  'Grains',
  'Poultry',
  'Fish',
  'Spices',
  'Beverages',
  'Snacks',
  'Other'
];

// Units
export const UNITS = [
  'kg',
  'g',
  'l',
  'ml',
  'pieces',
  'dozen',
  'pack',
  'bundle',
  'box',
  'bag'
];

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Map Configuration
export const DEFAULT_MAP_CENTER = {
  lat: 12.9716,
  lng: 77.5946
};
export const DEFAULT_MAP_ZOOM = 10;

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Validation
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[\d\s\-\(\)]{10,}$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50
};

// Local Storage Keys
export const STORAGE_KEYS = {
  LANGUAGE: 'supply_mitra_language',
  THEME: 'supply_mitra_theme',
  CART: 'supply_mitra_cart',
  RECENT_SEARCHES: 'supply_mitra_recent_searches'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logout successful!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  ORDER_CREATED: 'Order created successfully!',
  ORDER_UPDATED: 'Order updated successfully!',
  ITEM_ADDED: 'Item added successfully!',
  ITEM_UPDATED: 'Item updated successfully!',
  ITEM_DELETED: 'Item deleted successfully!'
}; 