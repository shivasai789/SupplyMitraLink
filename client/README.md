# SupplyMitra - State Management Documentation

## 🏗️ **Project Overview**

SupplyMitra is a React-based B2B marketplace application that connects **suppliers** (farmers/producers) with **vendors** (retailers/shop owners) in the Indian agricultural supply chain. This document provides comprehensive documentation for the state management system.

## 📦 **State Management Architecture**

### **Technology Stack**
- **Zustand**: Lightweight state management library
- **React Context**: For global state and authentication
- **React Router**: For navigation and route management
- **React i18next**: For internationalization

### **Store Structure**
```
src/stores/
├── useAuthStore.js      # Authentication & User Management
├── useSupplierStore.js  # Supplier-specific data & operations
├── useVendorStore.js    # Vendor-specific data & operations
├── useOrderStore.js     # Order management & tracking
├── useFeedbackStore.js  # Ratings, reviews & feedback
└── index.js            # Store exports & utilities
```

---

## 🔐 **Authentication Store (`useAuthStore`)**

### **Purpose**
Manages user authentication, login/logout, and user session data.

### **State Structure**
```javascript
{
  user: null,              // Current user object
  token: null,             // JWT token
  loading: false,          // Loading state
  error: null,             // Error messages
  isAuthenticated: false   // Authentication status
}
```

### **Key Actions**
- `login(email, password, role)` - User login
- `signup(userData)` - User registration
- `logout()` - User logout
- `getCurrentUser()` - Fetch current user data
- `updateUser(updates)` - Update user profile

### **Usage Example**
```javascript
import { useAuthStore } from '../stores/useAuthStore';

const { user, login, loading, error } = useAuthStore();

// Login
await login('user@example.com', 'password', 'supplier');

// Check authentication
if (user && user.role === 'supplier') {
  // Supplier-specific logic
}
```

---

## 🏭 **Supplier Store (`useSupplierStore`)**

### **Purpose**
Manages supplier-specific data including profile, inventory, stats, and price warnings.

### **State Structure**
```javascript
{
  profile: null,           // Supplier profile data
  inventory: [],           // Product inventory
  stats: null,             // Dashboard statistics
  priceWarnings: [],       // Price alerts
  loading: false,          // Loading state
  error: null              // Error messages
}
```

### **Key Actions**
- `fetchProfile(supplierId, token)` - Get supplier profile
- `updateProfile(supplierId, updates, token)` - Update profile
- `fetchInventory(supplierId, token)` - Get inventory items
- `addInventoryItem(supplierId, item, token)` - Add new item
- `updateInventoryItem(supplierId, itemId, updates, token)` - Update item
- `deleteInventoryItem(supplierId, itemId, token)` - Delete item
- `fetchStats(supplierId, token)` - Get dashboard stats
- `fetchPriceWarnings(supplierId, token)` - Get price alerts

### **Utility Functions**
- `getInventoryItem(itemId)` - Find specific item
- `getInventoryByCategory(category)` - Filter by category
- `getLowStockItems()` - Get items with low stock

### **Usage Example**
```javascript
import { useSupplierStore } from '../stores/useSupplierStore';

const { 
  profile, 
  inventory, 
  fetchProfile, 
  addInventoryItem 
} = useSupplierStore();

// Fetch supplier data
useEffect(() => {
  fetchProfile(user.id, token);
}, []);

// Add new inventory item
await addInventoryItem(user.id, {
  name: 'Fresh Tomatoes',
  category: 'Vegetables',
  currentStock: 100,
  price: 40
}, token);
```

---

## 🛒 **Vendor Store (`useVendorStore`)**

### **Purpose**
Manages vendor-specific data including profile, supplier discovery, and product browsing.

### **State Structure**
```javascript
{
  profile: null,           // Vendor profile data
  suppliers: [],           // Available suppliers
  products: [],            // Available products
  stats: null,             // Dashboard statistics
  searchFilters: {},       // Search and filter options
  loading: false,          // Loading state
  error: null              // Error messages
}
```

### **Key Actions**
- `fetchProfile(vendorId, token)` - Get vendor profile
- `updateProfile(vendorId, updates, token)` - Update profile
- `fetchSuppliers(filters, token)` - Discover suppliers
- `fetchProducts(filters, token)` - Browse products
- `fetchStats(vendorId, token)` - Get dashboard stats
- `setSearchFilters(filters)` - Update search filters
- `clearSearchFilters()` - Reset filters

### **Utility Functions**
- `getSupplierById(supplierId)` - Find specific supplier
- `getProductsBySupplier(supplierId)` - Get supplier's products
- `getProductsByCategory(category)` - Filter products by category
- `getInStockProducts()` - Get available products

### **Usage Example**
```javascript
import { useVendorStore } from '../stores/useVendorStore';

const { 
  suppliers, 
  products, 
  fetchSuppliers, 
  setSearchFilters 
} = useVendorStore();

// Search suppliers
useEffect(() => {
  fetchSuppliers({ category: 'Vegetables', rating: 4 }, token);
}, []);

// Filter products
setSearchFilters({ category: 'Fruits', inStock: true });
```

---

## 📦 **Order Store (`useOrderStore`)**

### **Purpose**
Manages order lifecycle including placement, status updates, and order history.

### **State Structure**
```javascript
{
  orders: [],              // All orders
  pendingOrders: [],       // Orders awaiting confirmation
  activeOrders: [],        // Orders in progress
  completedOrders: [],     // Finished orders
  currentOrder: null,      // Currently viewed order
  loading: false,          // Loading state
  error: null              // Error messages
}
```

### **Order Status Flow**
1. **pending** → **confirmed** → **packed** → **in_transit** → **out_for_delivery** → **delivered**
2. **pending** → **cancelled** (if rejected)

### **Key Actions**
- `placeOrder(orderData, token)` - Create new order
- `fetchOrders(params, token)` - Get orders with filters
- `updateOrderStatus(orderId, status, note, token)` - Update order status
- `getOrderDetails(orderId, token)` - Get specific order details

### **Utility Functions**
- `getOrderById(orderId)` - Find specific order
- `getOrdersByStatus(status)` - Filter by status
- `getOrdersBySupplier(supplierId)` - Get supplier's orders
- `getOrdersByVendor(vendorId)` - Get vendor's orders
- `getOrderStats()` - Get order statistics

### **Usage Example**
```javascript
import { useOrderStore } from '../stores/useOrderStore';

const { 
  orders, 
  placeOrder, 
  updateOrderStatus 
} = useOrderStore();

// Place new order
await placeOrder({
  vendorId: 'vendor-1',
  supplierId: 'supplier-1',
  items: [{ productId: 'item-1', quantity: 10 }],
  totalAmount: 400
}, token);

// Update order status (supplier action)
await updateOrderStatus('order-123', 'confirmed', 'Order confirmed', token);
```

---

## ⭐ **Feedback Store (`useFeedbackStore`)**

### **Purpose**
Manages ratings, reviews, and feedback system between suppliers and vendors.

### **State Structure**
```javascript
{
  feedback: [],            // All feedback
  userFeedback: [],        // Feedback for specific user
  loading: false,          // Loading state
  error: null              // Error messages
}
```

### **Key Actions**
- `submitFeedback(feedbackData, token)` - Submit new feedback
- `fetchFeedback(params, token)` - Get feedback with filters
- `fetchUserFeedback(userId, token)` - Get user's feedback
- `markHelpful(feedbackId)` - Mark feedback as helpful
- `reportFeedback(feedbackId)` - Report inappropriate feedback

### **Utility Functions**
- `getFeedbackById(feedbackId)` - Find specific feedback
- `getFeedbackByUser(userId)` - Get user's feedback
- `getAverageRating(userId)` - Calculate average rating
- `getRatingDistribution(userId)` - Get rating breakdown
- `getRecentFeedback(limit)` - Get recent feedback
- `getPositiveFeedback(userId)` - Get positive reviews
- `getNegativeFeedback(userId)` - Get negative reviews

### **Usage Example**
```javascript
import { useFeedbackStore } from '../stores/useFeedbackStore';

const { 
  feedback, 
  submitFeedback, 
  getAverageRating 
} = useFeedbackStore();

// Submit feedback
await submitFeedback({
  fromUserId: 'vendor-1',
  toUserId: 'supplier-1',
  role: 'vendor',
  rating: 5,
  comment: 'Excellent service!'
}, token);

// Get average rating
const avgRating = getAverageRating('supplier-1');
```

---

## 🔧 **API Integration**

### **Environment Configuration**
```javascript
// .env file
VITE_API_URL=http://localhost:3001/api
```

### **API Base URL**
All stores use the same base URL configuration:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

### **Development Mode**
In development mode, stores use sample data instead of making actual API calls:
```javascript
if (import.meta.env.DEV) {
  // Use sample data
} else {
  // Make actual API calls
}
```

### **Error Handling**
All stores include comprehensive error handling:
```javascript
try {
  // API call or sample data
} catch (error) {
  set({ error: error.message, loading: false });
  throw error;
}
```

---

## 📊 **Sample Data Structure**

### **User Data**
```javascript
// Supplier
{
  id: 'supplier-1',
  name: 'Fresh Farm Supplies',
  email: 'supplier@freshfarm.com',
  role: 'supplier',
  phone: '+91 98765 12345',
  address: 'Farm Road, Bangalore Rural, Karnataka 562123',
  businessType: 'Agricultural Farm',
  farmSize: '25 acres',
  specializations: ['Organic Vegetables', 'Fresh Fruits', 'Dairy Products'],
  certifications: ['Organic Certified', 'FSSAI Approved', 'ISO 22000'],
  rating: 4.5,
  reviews: 67
}

// Vendor
{
  id: 'vendor-1',
  name: 'Fresh Market Vendor',
  email: 'vendor@freshmarket.com',
  role: 'vendor',
  phone: '+91 98765 43210',
  address: '123 Market Street, Bangalore',
  businessType: 'Retail Store',
  preferredCategories: ['Vegetables', 'Fruits', 'Dairy'],
  rating: 4.2,
  reviews: 45
}
```

### **Inventory Item**
```javascript
{
  id: 'item-1',
  name: 'Fresh Tomatoes',
  category: 'Vegetables',
  currentStock: 150,
  unit: 'kg',
  price: 40,
  minStock: 20,
  maxStock: 200,
  status: 'in-stock',
  lastUpdated: '2024-01-20'
}
```

### **Order**
```javascript
{
  id: 'order-001',
  vendorId: 'vendor-1',
  supplierId: 'supplier-1',
  vendorName: 'Fresh Market Vendor',
  supplierName: 'Fresh Farm Supplies',
  items: [
    {
      id: 'item-1',
      name: 'Fresh Tomatoes',
      quantity: 10,
      unit: 'kg',
      price: 40,
      total: 400
    }
  ],
  totalAmount: 400,
  orderDate: '2024-01-20T10:30:00Z',
  expectedDelivery: '2024-01-21T14:00:00Z',
  status: 'confirmed',
  statusHistory: [
    {
      status: 'pending',
      timestamp: '2024-01-20T10:30:00Z',
      note: 'Order placed'
    }
  ],
  deliveryAddress: '123 Market Street, Bangalore',
  paymentStatus: 'pending',
  paymentMethod: 'cash_on_delivery'
}
```

---

## 🚀 **Getting Started**

### **Installation**
```bash
npm install zustand
```

### **Store Initialization**
```javascript
import { initializeStores } from './stores';

// Initialize stores (optional)
initializeStores();
```

### **Using Stores in Components**
```javascript
import React, { useEffect } from 'react';
import { useAuthStore, useSupplierStore } from '../stores';

const SupplierDashboard = () => {
  const { user, token } = useAuthStore();
  const { profile, stats, fetchProfile, fetchStats } = useSupplierStore();

  useEffect(() => {
    if (user && token) {
      fetchProfile(user.id, token);
      fetchStats(user.id, token);
    }
  }, [user, token]);

  return (
    <div>
      <h1>Welcome, {profile?.name}</h1>
      <p>Total Earnings: ₹{stats?.totalEarnings}</p>
    </div>
  );
};
```

---

## 🔄 **State Persistence**

### **Authentication Persistence**
The auth store uses Zustand's persist middleware to maintain user sessions:
```javascript
persist(
  (set, get) => ({
    // Store logic
  }),
  {
    name: 'auth-storage',
    partialize: (state) => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
    }),
  }
)
```

### **Development Tools**
All stores include Redux DevTools integration for debugging:
```javascript
devtools(
  (set, get) => ({
    // Store logic
  }),
  {
    name: 'store-name',
  }
)
```

---

## 📝 **Best Practices**

### **1. Store Organization**
- Keep stores focused on specific domains
- Use descriptive action names
- Include comprehensive error handling

### **2. Performance**
- Use selective subscriptions to avoid unnecessary re-renders
- Implement proper loading states
- Cache data appropriately

### **3. Error Handling**
- Always handle API errors gracefully
- Provide meaningful error messages
- Implement retry mechanisms where appropriate

### **4. Type Safety**
- Consider adding TypeScript for better type safety
- Define clear interfaces for all data structures
- Validate data at store boundaries

---

## 🔗 **API Endpoints Reference**

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user

### **Supplier APIs**
- `GET /api/suppliers/:supplierId` - Get supplier profile
- `PUT /api/suppliers/:supplierId` - Update supplier profile
- `GET /api/suppliers/:supplierId/inventory` - Get inventory
- `POST /api/suppliers/:supplierId/inventory` - Add inventory item
- `PUT /api/suppliers/:supplierId/inventory/:itemId` - Update inventory item
- `DELETE /api/suppliers/:supplierId/inventory/:itemId` - Delete inventory item
- `GET /api/suppliers/:supplierId/stats` - Get supplier stats
- `GET /api/suppliers/:supplierId/price-warnings` - Get price warnings

### **Vendor APIs**
- `GET /api/vendors/:vendorId` - Get vendor profile
- `PUT /api/vendors/:vendorId` - Update vendor profile
- `GET /api/vendors/:vendorId/stats` - Get vendor stats

### **Discovery APIs**
- `GET /api/suppliers` - Get all suppliers (with filters)
- `GET /api/products` - Get all products (with filters)

### **Order APIs**
- `POST /api/orders` - Place new order
- `GET /api/orders` - Get orders (with filters)
- `PUT /api/orders/:orderId` - Update order status
- `GET /api/orders/:orderId` - Get order details

### **Feedback APIs**
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get feedback (with filters)

---

This comprehensive state management system provides a robust foundation for the SupplyMitra application, ensuring efficient data flow, proper error handling, and excellent developer experience.
